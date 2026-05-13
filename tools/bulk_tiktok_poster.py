import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import os
import requests
import traceback
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Reverting to library-based imports
from src.api.tiktok import upload_to_tiktok, _cleanup, _prepare_cookies, _validate_netscape
from src.utils.discord import ping_error, ping_tiktok_success, ping_queue_completed

def _get_supabase() -> Client | None:
    try:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if url and key:
            return create_client(url, key)
    except Exception as e:
        print(f"Supabase init failed: {e}")
    return None

def download_video(url: str, output_path: str) -> bool:
    print(f"Downloading from S3: {url[:60]}...")
    try:
        r = requests.get(url, stream=True)
        r.raise_for_status()
        with open(output_path, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        print(f"Failed to download video: {e}")
        return False

def drain_tiktok_queue():
    print("="*40)
    print("TIKTOK SUPABASE RETRY QUEUE MANAGER (LIBRARY VERSION)")
    print("="*40)
    
    db = _get_supabase()
    if not db:
        print("FATAL: Could not connect to Supabase.")
        return

    # Fetch queued items
    try:
        resp = db.table("videos").select("Topic:topic, id, s3_video_url, tiktok_description")\
                .eq("tiktok_status", "PENDING").execute()
    except Exception as e:
        print(f"Supabase query failed: {e}")
        return
        
    queue = resp.data
    if not queue:
        print("Queue is empty! No pending TikTok uploads found.")
        return
        
    # PRO MOVE: Limit posts per run to protect account reputation and avoid shadowbans.
    MAX_POSTS_PER_RUN = 3 
    if len(queue) > MAX_POSTS_PER_RUN:
        print(f"Found {len(queue)} pending, but LIMITING to {MAX_POSTS_PER_RUN} for account safety.")
        queue = queue[:MAX_POSTS_PER_RUN]
    else:
        print(f"Found {len(queue)} pending TikTok uploads in the queue.\n")

    total_uploaded = 0

    for i, item in enumerate(queue):
        video_id = item.get("id")
        topic = item.get("Topic")
        s3_url = item.get("s3_video_url")
        desc = item.get("tiktok_description")
        
        print(f"\n--- Processing {i+1}/{len(queue)}: {topic} ---")
        if not s3_url:
            print(f"  [SKIP] No S3 video URL found for this topic. Record may be incomplete.")
            continue
        if not desc:
            print(f"  [SKIP] No TikTok description found for this topic.")
            continue
            
        temp_dir = ".temp"
        os.makedirs(temp_dir, exist_ok=True)
        local_filename = os.path.join(temp_dir, f"queue_render_{video_id}.mp4")
        
        # 1. Download
        print(f"  ACTION: Downloading video from S3...")
        if not download_video(s3_url, local_filename):
            print(f"  [ERROR] Failed to download video from: {s3_url}")
            continue
            
        # 2. Upload
        try:
            import threading
            from tiktok_uploader.upload import upload_video
            
            cookies_path = _prepare_cookies()
            if not cookies_path or not _validate_netscape(cookies_path):
                print("FATAL: Invalid or missing TikTok Cookies. Stop to fix cookies.")
                break
                
            # Local manual mode: Headless is False so user can solve captchas
            is_headless = False
            print(f"Launching LOCAL browser via threaded-sync mode...")
            
            thread_result = None
            thread_err = None

            def _run_sync_upload():
                nonlocal thread_result, thread_err
                try:
                    thread_result = upload_video(
                        local_filename,
                        description=desc,
                        cookies=cookies_path,
                        headless=is_headless,
                    )
                except Exception as e:
                    thread_err = e

            # We must run this in a thread because Supabase/Httpx might have 
            # already started an asyncio loop, which crashes Playwright Sync API
            upload_thread = threading.Thread(target=_run_sync_upload)
            upload_thread.start()
            upload_thread.join()

            if thread_err: raise thread_err
            result = thread_result
            
            if isinstance(result, list) and len(result) > 0:
                print(f"[RETRY ERROR] {result[0]}")
            else:
                # 3. Mark Success
                print(f"SUCCESS! Uploaded {topic}")
                db.table("videos").update({"tiktok_status": "SUCCESS"}).eq("id", video_id).execute()
                total_uploaded += 1
                ping_tiktok_success(topic)
                
        except Exception as e:
            print(f"Upload flow crashed for {topic}: {e}")
            traceback.print_exc()
            continue # Don't stop the whole queue if one fails
            
        finally:
            if os.path.exists(local_filename):
                try: os.remove(local_filename)
                except: pass
                
    if total_uploaded > 0:
        ping_queue_completed(total_uploaded)
                
    _cleanup()
    print("\nQueue Manager finished processing.")

if __name__ == "__main__":
    drain_tiktok_queue()
