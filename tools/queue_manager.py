import sys
import os

# Force utf-8 encoding for stdout to prevent emoji printing errors on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import argparse
import boto3
from urllib.parse import urlparse
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def get_db() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("FATAL: SUPABASE_URL or SUPABASE_KEY not set.")
        sys.exit(1)
    return create_client(url, key)

def status_report(db: Client):
    print("\n--- QUEUE STATUS REPORT ---")
    resp = db.table("videos").select("id, youtube_id, tiktok_status").execute()
    data = resp.data
    
    total = len(data)
    on_yt = len([r for r in data if r.get("youtube_id")])
    pending_tiktok = len([r for r in data if r.get("tiktok_status") == "PENDING"])
    
    print(f"Total Records:    {total}")
    print(f"On YouTube:       {on_yt}")
    print(f"Pending TikTok:   {pending_tiktok}")
    print("-" * 27)

def sync_tiktok_backlog(db: Client, before_id: int):
    print(f"\nACTION: Marking all PENDING TikTok tasks before ID {before_id} as SUCCESS...")
    
    # We only touch PENDING items to avoid overwriting FAILED or processing items
    resp = db.table("videos")\
        .update({"tiktok_status": "SUCCESS"})\
        .eq("tiktok_status", "PENDING")\
        .lt("id", before_id)\
        .execute()
    
    print(f"✓ Updated {len(resp.data)} records.")

def handle_youtube_ghosts(db: Client, before_id: int):
    print(f"\nACTION: Identifying records before ID {before_id} that never reached YouTube...")
    
    # Records where youtube_id is NULL and id < before_id
    # Note: Supabase/PostgREST 'is' filter for null
    resp = db.table("videos")\
        .select("id, topic")\
        .is_("youtube_id", "null")\
        .lt("id", before_id)\
        .execute()
    
    ghosts = resp.data
    if not ghosts:
        print("No YouTube ghost records found.")
        return

    print(f"Found {len(ghosts)} ghost records. Marking as ABANDONED to prevent recovery attempts...")
    
    for g in ghosts:
        # We can't update multiple rows with different conditions easily in one go if we want to be safe,
        # but here we can just update those specific IDs.
        db.table("videos").update({"youtube_id": "ABANDONED"}).eq("id", g["id"]).execute()
        
    print(f"✓ Processed {len(ghosts)} ghosts.")

def cleanup_s3_storage(db: Client):
    print("\nACTION: Cleaning up AWS S3 storage for SUCCESSFUL and SKIPPED_LIMIT TikTok uploads...")
    
    # Fetch all records with tiktok_status SUCCESS or SKIPPED_LIMIT and a non-null s3_video_url
    resp = db.table("videos").select("id, s3_video_url").in_("tiktok_status", ["SUCCESS", "SKIPPED_LIMIT"]).not_.is_("s3_video_url", "null").execute()
    data = resp.data
    
    if not data:
        print("No videos found in S3 that need cleanup.")
        return

    print(f"Found {len(data)} potential videos to delete from S3.")
    
    bucket = os.getenv("BUCKET_NAME")
    s3 = boto3.client("s3")
    deleted_count = 0
    
    for item in data:
        url = item.get("s3_video_url")
        # Extract key
        try:
            path = urlparse(url).path
            key = path.lstrip('/')
            if key:
                print(f"  Deleting ID {item['id']}: {key}")
                s3.delete_object(Bucket=bucket, Key=key)
                # Null out the URL in DB so we don't try to delete it again
                db.table("videos").update({"s3_video_url": None}).eq("id", item["id"]).execute()
                deleted_count += 1
        except Exception as e:
            print(f"  ⚠ Failed to delete {url}: {e}")

    print(f"\n✓ Successfully cleared {deleted_count} videos from AWS S3.")

def auto_trim_queue(db: Client, keep_limit: int = 3):
    print(f"\nACTION: Auto-trimming TikTok queue to keep only the newest {keep_limit} videos...")
    
    resp = db.table("videos")\
        .select("id, topic")\
        .eq("tiktok_status", "PENDING")\
        .order("id", desc=True)\
        .execute()
        
    pending_videos = resp.data
    if len(pending_videos) <= keep_limit:
        print(f"Queue is healthy ({len(pending_videos)} pending). No trimming needed.")
        return
        
    doomed_videos = pending_videos[keep_limit:]
    doomed_ids = [v['id'] for v in doomed_videos]
    
    print(f"Found {len(pending_videos)} pending videos. Keeping {keep_limit}, skipping {len(doomed_videos)}.")
    
    try:
        db.table("videos")\
            .update({"tiktok_status": "SKIPPED_LIMIT"})\
            .in_("id", doomed_ids)\
            .execute()
        print(f"✓ Successfully marked {len(doomed_ids)} old videos as SKIPPED_LIMIT.")
    except Exception as e:
        print(f"❌ Failed to bulk update videos: {e}")

def main():
    parser = argparse.ArgumentParser(description="HAZY Queue Management Utility")
    parser.add_argument("command", nargs="?", default="report", choices=["report", "sync-tiktok", "clean-ghosts", "cleanup-s3", "full-maintenance", "auto-trim"])
    parser.add_argument("--before", type=int, default=224, help="Target ID threshold (default: 224)")
    
    args = parser.parse_args()
    db = get_db()
    
    # PRO MOVE: Dynamic Thresholding
    # If the user didn't provide a threshold, we look at everything except the last 50 IDs.
    # This keeps the 'clean-ghosts' logic relevant as the database grows.
    before_threshold = args.before
    if before_threshold == 224: # Default value was hit
        try:
            # Get the highest ID
            res = db.table("videos").select("id").order("id", desc=True).limit(1).execute()
            if res.data:
                latest_id = res.data[0]['id']
                before_threshold = max(0, latest_id - 50)
                print(f"📡 Dynamic Cleanup: Target ID set to {before_threshold} (Latest: {latest_id})")
        except Exception as e:
            print(f"⚠️  Dynamic thresholding failed: {e}. Falling back to default 224.")
    
    if args.command == "report":
        status_report(db)
    elif args.command == "sync-tiktok":
        sync_tiktok_backlog(db, before_threshold)
    elif args.command == "clean-ghosts":
        handle_youtube_ghosts(db, before_threshold)
    elif args.command == "cleanup-s3":
        cleanup_s3_storage(db)
    elif args.command == "auto-trim":
        auto_trim_queue(db, keep_limit=3)
    elif args.command == "full-maintenance":
        status_report(db)
        handle_youtube_ghosts(db, before_threshold)
        sync_tiktok_backlog(db, before_threshold)
        auto_trim_queue(db, keep_limit=3)
        cleanup_s3_storage(db)
        print("\nMAINTENANCE COMPLETE.")
        status_report(db)

if __name__ == "__main__":
    main()
