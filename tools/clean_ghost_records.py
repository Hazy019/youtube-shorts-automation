import sys
import os
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timedelta

load_dotenv()

def purge_ghost_records():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("❌ Supabase credentials missing.")
        return

    supabase: Client = create_client(url, key)

    print("[SANITATION] DATABASE SANITATION: Purging ghost records...")
    print("-" * 50)

    # Define the threshold (records older than 24h)
    threshold = (datetime.now() - timedelta(hours=24)).isoformat()

    # ── STEP 1: Check which columns actually exist ────────────────────────────
    # We probe the table first with a minimal query to see what columns are available.
    try:
        probe = supabase.table("videos").select("id, youtube_id").limit(1).execute()
    except Exception as e:
        print(f"[ERROR] Cannot connect to Supabase: {e}")
        return

    # Check for optional columns by trying to select them
    has_payload  = _column_exists(supabase, "payload")
    has_category = _column_exists(supabase, "category")

    print(f"  Schema check → payload column: {'✅ EXISTS' if has_payload else '⚠️  MISSING'}")
    print(f"  Schema check → category column: {'✅ EXISTS' if has_category else '⚠️  MISSING'}")

    if not has_payload and not has_category:
        print()
        print("⚠️  ACTION REQUIRED: Your Supabase 'videos' table is missing the new columns.")
        print("   Please add them in the Supabase Dashboard (Table Editor → videos):")
        print("   1. 'payload'  → Type: jsonb,  Default: null")
        print("   2. 'category' → Type: text,   Default: null")
        print()
        print("   After adding the columns, run this script again.")
        print()
        print("📌 Falling back to SAFE MODE: Only purging records where youtube_id IS NULL")
        print("   AND tiktok_status is NOT SUCCESS and facebook_status is NOT SUCCESS...")
        _safe_purge_no_payload(supabase, threshold)
        return

    # ── STEP 2: Full purge with all safety checks ─────────────────────────────
    try:
        query = supabase.table("videos").delete()\
            .is_("youtube_id", "null")\
            .is_("payload", "null")\
            .not_.eq("tiktok_status", "SUCCESS")\
            .not_.eq("tiktok_status", "QUEUED")\
            .not_.eq("facebook_status", "SUCCESS")\
            .lt("created_at", threshold)

        response = query.execute()
        deleted_count = len(response.data) if response.data else 0
        print(f"\n[SUCCESS] FULL CLEANUP COMPLETE: Purged {deleted_count} ghost records.")
        print("[INFO] Gemini Brain is now clean. Failed topics are unlocked for reuse.")

    except Exception as e:
        print(f"[ERROR] Purge error: {e}")


def _safe_purge_no_payload(supabase: Client, threshold: str):
    """
    Fallback purge for when the 'payload' column doesn't exist yet.
    Extra conservative: only deletes records where ALL platforms failed.
    """
    try:
        response = supabase.table("videos").delete()\
            .is_("youtube_id", "null")\
            .eq("tiktok_status", "INITIALIZED")\
            .lt("created_at", threshold)\
            .execute()

        deleted_count = len(response.data) if response.data else 0
        print(f"\n[SUCCESS] SAFE PURGE COMPLETE: Purged {deleted_count} unfinished INITIALIZED records.")
        print("[INFO] Run this again after adding the Supabase columns for a full cleanup.")

    except Exception as e:
        print(f"[ERROR] Safe purge also failed: {e}")


def _column_exists(supabase: Client, column_name: str) -> bool:
    """Probe whether a column exists by attempting a minimal select."""
    try:
        supabase.table("videos").select(column_name).limit(1).execute()
        return True
    except Exception:
        return False


if __name__ == "__main__":
    purge_ghost_records()
