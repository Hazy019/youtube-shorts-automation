import os
import sys
import time
import requests
import random
import traceback
import boto3
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
from supabase import create_client, Client

# Force console output to UTF-8 to prevent Windows CP1252 UnicodeEncodeError crashing the script
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

load_dotenv()

# --- SECURITY & SANITY CHECKS ------------------------------------------------
ALLOWED_RENDER_DOMAINS = [
    "s3.amazonaws.com",          # generic AWS S3
    "s3.us-east-1.amazonaws.com",
    "s3.us-west-2.amazonaws.com",
    "remotion-render",           # direct lambda testing
]

def validate_render_url(url):
    """Ensure the render download URL is from a trusted domain."""
    if not url:
        return False
    parsed = urlparse(url)
    domain = parsed.netloc.lower()
    # Check if any allowed domain is in the netloc
    return any(allowed in domain for allowed in ALLOWED_RENDER_DOMAINS)

def check_environment():
    """Verify critical environment variables are present before starting."""
    required = [
        "GEMINI_API_KEY", "SUPABASE_URL", "SUPABASE_KEY", 
        "BUCKET_NAME", "SERVE_URL",
        "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"
    ]
    missing = [k for k in required if not os.getenv(k)]
    if missing:
        print(f"FATAL: Missing environment variables: {missing}")
        sys.exit(1)
    
    # Pre-flight Validation for Remotion Site
    serve_url = os.getenv("SERVE_URL")
    print(f"Validating Remotion Site: {serve_url}")
    try:
        r = requests.head(serve_url, timeout=10)
        if r.status_code == 403:
            print(f"WARNING: Remotion SERVE_URL returned 403 Forbidden.")
            print("ACTION: Your Remotion bundle is either not deployed or S3 permissions block public access.")
            print("Continuing anyway, as Lambda might still have access internally.")
        elif r.status_code >= 400:
            print(f"WARNING: Remotion SERVE_URL returned status {r.status_code}. Continuing anyway.")
    except Exception as e:
        print(f"FATAL: Failed to reach Remotion SERVE_URL: {e}")
        sys.exit(1)

    print("Environment & Site check passed.")

# -----------------------------------------------------------------------------

check_environment()

supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def with_supabase_retry(operation, max_attempts=3):
    """Wrapper to handle transient network issues with Supabase."""
    for attempt in range(max_attempts):
        try:
            return operation.execute()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise e
            print(f"  Supabase error (attempt {attempt+1}/{max_attempts}): {e}. Retrying...")
            time.sleep(2)

def _check_column_exists(column_name):
    """Probe Supabase to see if a column exists before querying it."""
    try:
        supabase.table("videos").select(column_name).limit(1).execute()
        return True
    except Exception:
        return False

def find_recovery_record(category):
    """
    Check Supabase for a video that was initialized but never successfully 
    published for this category within the last 48 hours.
    Gracefully handles missing 'payload' and 'category' columns.
    """
    from datetime import datetime, timedelta
    limit = (datetime.now() - timedelta(hours=48)).isoformat()

    # Check schema readiness once per call
    has_payload  = _check_column_exists("payload")
    has_category = _check_column_exists("category")

    if not has_payload:
        print("  [Recovery] 'payload' column not found in DB — skipping recovery (add column to enable).")
        return None

    try:
        # Check for both database NULL and the literal string 'NULL'
        query = supabase.table("videos").select("*").is_("youtube_id", "null")

        if has_category:
            query = query.eq("category", category)
        else:
            print("  [Recovery] 'category' column missing — recovery will not filter by channel.")

        query = (
            query
            .not_.is_("payload", "null")
            .gt("created_at", limit)
            .order("created_at", desc=True)
            .limit(1)
        )
        res = with_supabase_retry(query)

        # Fallback check for the literal string 'NULL'
        if not res.data:
            fallback_query = supabase.table("videos").select("*").eq("youtube_id", "NULL")
            if has_category:
                fallback_query = fallback_query.eq("category", category)
            fallback_query = (
                fallback_query
                .not_.is_("payload", "null")
                .gt("created_at", limit)
                .order("created_at", desc=True)
                .limit(1)
            )
            res = with_supabase_retry(fallback_query)

        return res.data[0] if res.data else None
    except Exception as e:
        print(f"  [Recovery] Check failed (non-fatal): {e}")
        return None

from src.ai.brain import generate_full_package
from src.ai.tts import generate_voiceover
from src.media.assets import get_background_videos, get_sfx_urls, get_bgm_url
from src.media.builder import make_cloud_video
from src.api.youtube import upload_video
from src.api.meta import MetaAPI
from src.utils.discord import ping_error, ping_creator, ping_render_start, ping_queue
from src.utils.meta_healer import perform_meta_recovery

def extract_s3_key(url):
    """Extract object key from a pre-signed or direct S3 URL."""
    try:
        path = urlparse(url).path
        return path.lstrip('/')
    except:
        return None

def cleanup_s3_assets(keys):
    """Delete temporary background and audio assets from S3."""
    if not keys: return
    # Filter out None and deduplicate
    unique_keys = list(set(k for k in keys if k))
    print(f"\n--- S3 CLEANUP: Deleting {len(unique_keys)} temporary assets ---")
    s3 = boto3.client("s3", region_name="us-east-1")
    for key in unique_keys:
        try:
            s3.delete_object(Bucket=os.getenv("BUCKET_NAME"), Key=key)
            print(f"  ✓ Deleted: {key}")
        except Exception as e:
            print(f"  ⚠ Failed to delete {key}: {e}")

def produce_video(category, local_excludes=None, token_name='token_youtube.json'):
    print(f"\n--- STARTING PRODUCTION FOR CATEGORY: {category.upper()} (Token: {token_name}) ---")
    local_recovery_file = f"temp_recovery_{category}.json"

    try:
        import json
        # ── PRO MOVE: SELF-HEALING RECOVERY ──────────────────────────────────
        # Check local failsafe first to avoid burning Gemini tokens on DB failures
        if os.path.exists(local_recovery_file):
            print(f"♻️  LOCAL RECOVERY: Resuming interrupted job from {local_recovery_file}!")
            with open(local_recovery_file, 'r', encoding='utf-8') as f:
                full_package = json.load(f)
        else:
            # Check if we have a 'stuck' video in the database for this channel.
            recovery_record = find_recovery_record(category)
            if recovery_record:
                print(f"♻️  DB RECOVERY: Resuming failed topic: {recovery_record['topic']}")
                full_package = recovery_record['payload']
            else:
                print(f"✨ FRESH RUN: Generating new {category} topic with Gemini...")
                full_package = generate_full_package(category, local_excludes=local_excludes)
                # Save to local failsafe immediately
                with open(local_recovery_file, 'w', encoding='utf-8') as f:
                    json.dump(full_package, f)
        
        topic = full_package['topic']
        search_keyword = full_package['search_keyword']
        viral_package = full_package

        print(f"Topic acquired: {topic}")
        print(f"B-Roll Keyword: {search_keyword}")

    except Exception as e:
        msg = f"Gemini Error: {str(e)}"
        tb = traceback.format_exc()
        print(f"\nABORTING: {msg}")
        ping_error(msg, "Gemini Factory", traceback_str=tb)
        return None, None, False

    full_audio_script = " ".join([s['voiceover'] for s in viral_package['segments']])

    audio_url, duration, word_timestamps, voice_error = generate_voiceover(full_audio_script, category=category)
    if not audio_url:
        print("\nFACTORY HALTED: Voiceover generation failed.")
        ping_error(str(voice_error), "ElevenLabs")
        return None, None, False

    video_urls = get_background_videos(
        topic,
        search_keyword,
        backup_keywords=viral_package.get('backup_keywords'),
        num_clips=10,
        max_duration=duration
    )
    sfx_urls = get_sfx_urls(num_sfx=max(7, len(viral_package['segments'])))

    bgm_url = get_bgm_url(category=category)

    # Prevent AWS Lambda waste if local Google Drive API times out (WinError 10060)
    if not video_urls or not sfx_urls or not bgm_url:
        err = f"FACTORY HALTED: Local Media Fetch Failed. Missing assets. Videos: {len(video_urls)}, SFX: {len(sfx_urls)}, BGM: {'Yes' if bgm_url else 'No'}."
        print(f"\n{err}")
        ping_error(err, "Local Google API")
        return None, None, False

    # SMART CACHE HASHING: Ensures Remotion safely resumes identical renders
    # without glitched/stale assets if the script changes.
    import hashlib
    script_hash_input = viral_package['topic'] + full_audio_script
    render_seed = int(hashlib.md5(script_hash_input.encode('utf-8')).hexdigest()[:8], 16)
    ping_render_start(viral_package['title'], category=category)
    final_video_url, render_error = make_cloud_video(
        audio_url,
        video_urls,
        sfx_urls,
        bgm_url,
        viral_package['segments'],
        min(duration, 50.0), # Hard-cap at 50.0s for stability & retention
        category=category,
        render_seed=render_seed,
        word_timestamps=word_timestamps
    )

    if final_video_url:
        print(f"\nSUCCESS! RENDER COMPLETE:\n{final_video_url}")

        if not validate_render_url(final_video_url):
            err = f"SECURITY ALERT: Blocked insecure render download from untrusted domain: {final_video_url}"
            print(f"\n{err}")
            ping_error(err, "Security Manager")
            return None, None, False

        local_filename = f"temp_render_{category}.mp4"
        for attempt in range(3):
            try:
                r = requests.get(final_video_url, stream=True, timeout=120)
                r.raise_for_status()
                with open(local_filename, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                break
            except Exception as e:
                print(f"Download error: {e}. Retrying {attempt+1}/3...")
                time.sleep(3)
                if attempt == 2:
                    ping_error(f"Render download failed after 3 attempts: {e}", "Downloader")
                    return None, None, False

        print("\n[STEP 1/2] Initiating YouTube Upload...")
        from src.api.youtube import get_publish_at
        publish_at = get_publish_at()
        youtube_link = upload_video(
            local_filename,
            viral_package['title'],
            viral_package['description'],
            category,
            tags=viral_package.get('tags'),
            token_name=token_name,
            publish_at=publish_at
        )

        tiktok_status = "Skipped"

        if youtube_link:
            try:
                video_id = youtube_link.split("/")[-1]
                # Stamp youtube_id AND channel name so dashboard shows US vs Hazy
                update_payload = {"youtube_id": video_id, "channel": token_name.replace(".json", "")}
                with_supabase_retry(
                    supabase.table("videos").update(update_payload).eq("topic", full_package['topic'])
                )
                print(f"Supabase updated — youtube_id: {video_id} | channel: {update_payload['channel']}")
            except Exception as e:
                print(f"Warning: Failed to save youtube_id to Supabase: {e}")

        # [STEP 2/2] TikTok queuing
        tiktok_status = "QUEUED"
        print("\n[STEP 2/2] Adding video to TikTok retry queue...")
        
        try:
            tags = viral_package.get('tags')
            hashtags = " ".join(f"#{t}" for t in tags) if tags else "#shorts #gaming #facts"
            tiktok_description = f"{viral_package['title']}\n\n{viral_package['description'][:1400]}\n\n{hashtags}"[:2200]

            tiktok_payload = {
                "tiktok_status":    "PENDING",
                "facebook_status":  "PENDING",
                "instagram_status": "PENDING",
                "s3_video_url":     final_video_url,
                "tiktok_description": tiktok_description
            }

            # Try update first (row should exist from brain.py insert)
            result = with_supabase_retry(
                supabase.table("videos").update(tiktok_payload).eq("topic", full_package['topic'])
            )

            # If no rows matched, the brain.py insert was skipped — insert the row now
            if not result.data:
                print("  Row not found — inserting new Supabase record.")
                with_supabase_retry(
                    supabase.table("videos").insert({
                        "topic": full_package['topic'],
                        "title": viral_package['title'],
                        **tiktok_payload
                    })
                )

            print("Supabase updated with TikTok metadata.")
        except Exception as e:
            print(f"Warning: Failed to queue for TikTok: {e}")
            tiktok_status = "FAILED"
        
        # [STEP 3/3] Meta (Facebook & Instagram) Direct Posting
        fb_status = "PENDING"
        ig_status = "PENDING"
        
        try:
            print("\n[STEP 3/3] Initiating Meta Direct Posting...")
            meta = MetaAPI()
            tags = viral_package.get('tags')
            hashtags = " ".join(f"#{t}" for t in tags) if tags else "#shorts #gaming #facts"
            meta_description = f"{viral_package['title']}\n\n{viral_package['description'][:1400]}\n\n{hashtags}"[:2200]

            # Facebook
            try:
                fb_id = meta.upload_facebook_reel(final_video_url, meta_description)
                if fb_id:
                    fb_status = "SUCCESS"
                    with_supabase_retry(supabase.table("videos").update({"facebook_status": "SUCCESS"}).eq("topic", full_package['topic']))
                else:
                    fb_status = "FAILED"
                    with_supabase_retry(supabase.table("videos").update({"facebook_status": "FAILED"}).eq("topic", full_package['topic']))
            except Exception as e:
                print(f"  ⚠ Facebook Direct Upload Failed: {e}")
                fb_status = "FAILED"

            # Instagram
            try:
                ig_id = meta.upload_instagram_reel(final_video_url, meta_description)
                if ig_id:
                    ig_status = "SUCCESS"
                    with_supabase_retry(supabase.table("videos").update({"instagram_status": "SUCCESS"}).eq("topic", full_package['topic']))
                else:
                    ig_status = "FAILED"
                    with_supabase_retry(supabase.table("videos").update({"instagram_status": "FAILED"}).eq("topic", full_package['topic']))
            except Exception as e:
                print(f"  ⚠ Instagram Direct Upload Failed: {e}")
                ig_status = "FAILED"

        except Exception as e:
            print(f"  ⚠ Meta API Initialization Failed: {e}")
            fb_status = "FAILED"
            ig_status = "FAILED"

        ping_creator(youtube_link or "Upload Failed", tiktok_status, fb_status, ig_status, viral_package['title'])

        # --- S3 ASSET CLEANUP (TASK 2) ---------------------------------------
        # We collect all temporary input keys. We do NOT delete final_video_url 
        # because the TikTok uploader might still need to fetch it from S3.
        temp_keys = []
        temp_keys.append(extract_s3_key(audio_url))
        temp_keys.append(extract_s3_key(bgm_url))
        for v in video_urls: temp_keys.append(extract_s3_key(v))
        for s in sfx_urls:   temp_keys.append(extract_s3_key(s))
        
        cleanup_s3_assets(temp_keys)
        # ---------------------------------------------------------------------

        if os.path.exists(local_filename):
            os.remove(local_filename)
        if os.path.exists(local_recovery_file):
            os.remove(local_recovery_file)
        print(f"Local temp files deleted. {category.upper()} Syndication Cycle Complete!")
        
        title = viral_package['title']
        was_queued = (tiktok_status == "QUEUED")
        return topic, title, was_queued
    else:
        # render_error may be a raw Python list from the Remotion SDK (its 'errors' field).
        # str(list) can produce 10,000+ characters — Discord rejects messages >2000 chars
        # with a silent HTTP 400, which is swallowed by _post()'s exception handler.
        # Always coerce to a capped string before pinging.
        safe_render_err = str(render_error or "Remotion render returned None")[:1200]
        print(f"\nRender failed: {safe_render_err}. Check AWS CloudWatch logs.")
        ping_error(safe_render_err, "AWS Lambda")
        return None, None, False

def start_factory():
    print("HAZY MULTI-CHANNEL FACTORY STARTING (PARALLEL v14)...\n" + "="*40)
    
    # --- PHASE 0: AUTONOMOUS SELF-HEALING ------------------------------------
    # Automatically fix any failed Meta uploads from previous runs
    try:
        perform_meta_recovery()
    except Exception as e:
        print(f"⚠️ Self-Healing Phase Warning: {e}")
    # -------------------------------------------------------------------------
    
    # Define channel configurations — 2 accounts, 2 videos per run
    channels = [
        {
            "name": "Hazy Insight",
            "token": "token_youtube_hazy.json",
            "categories": ["general"]
        },
        {
            "name": "Hazy US",
            "token": "token_youtube_us.json",
            "categories": ["us-centric"]
        }
    ]

    # Support targeted runs (e.g., from GitHub Actions specialized workflows)
    shift_target = os.getenv("SHIFT_CHANNEL")
    if shift_target:
        print(f"Targeting specific channel: {shift_target}")
        channels = [c for c in channels if c["name"].lower() == shift_target.lower()]
        if not channels:
            print(f"ERROR: Channel '{shift_target}' not found in configuration.")
            sys.exit(1)

    overall_success = True
    queued_titles = []
    produced_topics = []

    # Sequential Execution to prevent AWS Lambda concurrency limits (Rate Exceeded)
    max_workers = 1
    print(f"Dispatching {len(channels)} channel(s) sequentially to respect AWS limits...\n")

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {}
        for channel in channels:
            category = random.choice(channel["categories"])
            # Note: local_excludes is not strictly thread-safe here, but for 2-4 channels 
            # with different categories, collision is negligible.
            future = executor.submit(
                produce_video, 
                category, 
                local_excludes=produced_topics, 
                token_name=channel["token"]
            )
            futures[future] = channel["name"]

        for future in as_completed(futures):
            channel_name = futures[future]
            try:
                topic, title, queued = future.result()
                # PRO MOVE: A truthy topic is NOT enough. If it wasn't queued/published, 
                # we don't consider it a success. This forces the GitHub Action to go RED
                # so the user knows they need to check the YouTube quota/token.
                if topic and (queued or title):
                    print(f"\n>>> CHANNEL SUCCESS: {channel_name.upper()} <<<")
                    produced_topics.append(topic)
                    if queued: 
                        queued_titles.append(f"[{channel_name}] {title}")
                else:
                    print(f"\n>>> CHANNEL FAILED: {channel_name.upper()} (Upload or Render Failed) <<<")
                    overall_success = False
            except Exception as e:
                print(f"\n>>> CHANNEL CRASHED: {channel_name.upper()} <<<\n{e}")
                traceback.print_exc()
                ping_error(f"Channel {channel_name} crashed: {e}", "Orchestrator")
                overall_success = False

    # Only notify about the queue state if the factory run had at least some success.
    if queued_titles:
        ping_queue(queued_titles)
    
    if not overall_success:
        print("\nFACTORY SHUTDOWN WITH ERRORS. One or more channels failed.")
        sys.exit(1)
    
    print("\nHAZY MULTI-CHANNEL FACTORY SHUTTING DOWN. ALL TASKS COMPLETE!")

if __name__ == "__main__":
    start_factory()