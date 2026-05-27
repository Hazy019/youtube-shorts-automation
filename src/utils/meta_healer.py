import os
import sys
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from src.api.meta import MetaAPI
from src.utils.discord import ping_error

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

def perform_meta_recovery():
    """
    Autonomous recovery for Meta (FB/IG) uploads.
    Scans Supabase for videos that have a rendered S3 URL but failed Meta status.
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("⚠️ Meta Healer: Supabase credentials missing. Skipping recovery.")
        return

    print("\n" + "═"*60)
    print("🛠️  AUTONOMOUS META HEALER: CHECKING FOR FAILED SYNDICATION")
    print("═"*60)

    try:
        supabase: Client = create_client(url, key)
        
        # Fetch records from the last 7 days that need recovery
        # We look for: s3_video_url is NOT null AND (fb_status != SUCCESS OR ig_status != SUCCESS)
        # Note: Supabase doesn't support complex OR in simple .not_ filters easily, 
        # so we fetch pending/failed and filter in Python.
        
        res = supabase.table("videos").select("*")\
            .not_.is_("s3_video_url", "null")\
            .order("created_at", desc=True)\
            .limit(10)\
            .execute()

        if not res.data:
            print("✨ No videos with S3 assets found. Nothing to heal.")
            return

        meta = None # Lazy init
        healed_count = 0
        ig_healed_count = 0
        IG_MAX_PER_RUN = 3  # Meta's trust score degrades with bulk API publishing

        for row in res.data:
            topic = row.get("topic")
            fb_status = row.get("facebook_status")
            ig_status = row.get("instagram_status")
            s3_url = row.get("s3_video_url")
            
            # Extract description (handle potential missing fields)
            title = row.get("title", "Untitled Video")
            # We don't have the full description in the main row usually, 
            # but we can try to get it from payload or just use a generic one if missing.
            payload = row.get("payload") or {}
            description = payload.get("description", title)
            tags = payload.get("tags", [])
            hashtags = " ".join(f"#{t}" for t in tags) if tags else "#shorts #viral"
            full_caption = f"{title}\n\n{description[:1400]}\n\n{hashtags}"[:2200]

            needs_fb = fb_status in ["FAILED", "PENDING", "INITIALIZED"]
            needs_ig = ig_status in ["FAILED", "PENDING", "INITIALIZED"]

            if not (needs_fb or needs_ig):
                continue

            print(f"♻️  Healing: {topic[:40]}...")
            
            if meta is None:
                try:
                    meta = MetaAPI()
                except Exception as e:
                    print(f"❌ Meta API Init Failed: {e}")
                    return

            # Facebook Recovery
            if needs_fb:
                print(f"  → Retrying Facebook...")
                try:
                    fb_id = meta.upload_facebook_reel(s3_url, full_caption)
                    if fb_id:
                        supabase.table("videos").update({"facebook_status": "SUCCESS"}).eq("id", row["id"]).execute()
                        print("    ✅ Facebook Healed!")
                    else:
                        print("    ❌ Facebook retry failed.")
                except Exception as e:
                    print(f"    💥 Facebook Exception: {e}")

            # Instagram Recovery
            if needs_ig:
                if ig_healed_count >= IG_MAX_PER_RUN:
                    print(f"  → Skipping Instagram (capped at {IG_MAX_PER_RUN}/run to avoid Meta rate limiting)")
                else:
                    print(f"  → Retrying Instagram...")
                    try:
                        ig_id = meta.upload_instagram_reel(s3_url, full_caption)
                        if ig_id:
                            supabase.table("videos").update({"instagram_status": "SUCCESS"}).eq("id", row["id"]).execute()
                            print("    ✅ Instagram Healed!")
                            ig_healed_count += 1
                        else:
                            print("    ❌ Instagram retry failed.")
                    except Exception as e:
                        print(f"    💥 Instagram Exception: {e}")
            
            healed_count += 1
            # 60s cooldown between uploads — prevents Meta's bulk-publish rate limiter
            if healed_count < len([r for r in res.data if r.get('facebook_status') in ['FAILED','PENDING','INITIALIZED'] or r.get('instagram_status') in ['FAILED','PENDING','INITIALIZED']]):
                print("⏸  Cooling down 60s before next video...")
                time.sleep(60)

        if healed_count == 0:
            print("✨ All recent Meta uploads are already SUCCESS. Great job!")
        else:
            print(f"🏁 Meta Healing Cycle Complete. Processed {healed_count} video(s).")

    except Exception as e:
        print(f"💥 Meta Healer Critical Error: {e}")
        ping_error(f"Meta Healer crashed: {e}", "Self-Healing")

if __name__ == "__main__":
    perform_meta_recovery()
