"""
Self-Healing Recovery Test
===========================
Simulates what the factory does at startup:
1. Checks if 'payload' and 'category' columns exist
2. Queries for any stuck/failed topics for each channel
3. Reports exactly what the morning run will see

Run this BEFORE pushing to confirm the recovery engine is healthy.
"""
import sys
import os
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from datetime import datetime, timedelta

def test_self_healing():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("[FATAL] Supabase credentials missing in .env")
        return

    db = create_client(url, key)
    print("=" * 55)
    print(" SELF-HEALING RECOVERY ENGINE - PRE-FLIGHT TEST")
    print("=" * 55)

    # ── STEP 1: Schema Check ────────────────────────────────
    print("\n[1/3] Checking Supabase schema...")
    cols_to_check = ["payload", "category", "channel", "youtube_id",
                     "tiktok_status", "facebook_status", "instagram_status"]
    schema_ok = True
    for col in cols_to_check:
        try:
            db.table("videos").select(col).limit(1).execute()
            print(f"  [OK]      '{col}' column EXISTS")
        except Exception:
            print(f"  [MISSING] '{col}' column NOT FOUND -- recovery/tracking limited")
            if col in ("payload", "category"):
                schema_ok = False

    if not schema_ok:
        print("\n  ACTION: Add missing columns in Supabase Dashboard before morning run.")
        print("          payload  -> jsonb, null default")
        print("          category -> text,  null default")

    # ── STEP 2: Recovery Simulation ─────────────────────────
    print("\n[2/3] Simulating recovery check for each channel...")
    limit = (datetime.now() - timedelta(hours=48)).isoformat()
    channels = [
        ("Hazy Insight", "general"),
        ("Hazy US",      "us-centric"),
    ]

    for channel_name, category in channels:
        print(f"\n  Channel: {channel_name} (category='{category}')")
        try:
            # Replicate exact logic from find_recovery_record()
            res = db.table("videos")\
                .select("id, topic, created_at, tiktok_status")\
                .eq("category", category)\
                .is_("youtube_id", "null")\
                .not_.is_("payload", "null")\
                .gt("created_at", limit)\
                .order("created_at", desc=True)\
                .limit(1)\
                .execute()

            if res.data:
                r = res.data[0]
                print(f"  [FOUND]   Recovery candidate detected!")
                print(f"            Topic:   {r['topic'][:70]}")
                print(f"            Created: {r['created_at']}")
                print(f"            Status:  {r.get('tiktok_status', 'N/A')}")
                print(f"  --> Tomorrow's run will RESUME this topic instead of generating new content.")
            else:
                print(f"  [CLEAN]   No stuck topics found. Fresh Gemini run will trigger.")
        except Exception as e:
            print(f"  [ERROR]   Query failed: {e}")
            print(f"            This means 'payload' or 'category' columns are missing.")
            print(f"            The factory will fall back to FRESH RUN mode (safe but wastes tokens).")

    # ── STEP 3: Queue Health Check ──────────────────────────
    print("\n[3/3] Checking TikTok/Meta queue health...")
    try:
        pending = db.table("videos")\
            .select("id, topic, tiktok_status, facebook_status, instagram_status")\
            .eq("tiktok_status", "PENDING")\
            .execute()

        count = len(pending.data) if pending.data else 0
        print(f"  TikTok PENDING queue: {count} video(s) waiting to be posted")
        if count > 3:
            print(f"  [WARNING] {count} videos pending. Run 'python tools/bulk_tiktok_poster.py' to drain.")
        elif count == 0:
            print(f"  [OK]      Queue is clean.")
    except Exception as e:
        print(f"  [SKIP]    Could not check queue: {e}")

    print("\n" + "=" * 55)
    print(" TEST COMPLETE")
    print("=" * 55)

if __name__ == "__main__":
    test_self_healing()
