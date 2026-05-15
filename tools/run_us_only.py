import os
import sys
import subprocess
import time
from dotenv import load_dotenv
from supabase import create_client, Client

def get_supabase():
    load_dotenv()
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    return create_client(url, key)

def get_pending_count():
    supabase = get_supabase()
    if not supabase:
        return 0
    try:
        # Check for videos in 'us-centric' category that have no youtube_id
        res = supabase.table("videos").select("id", count="exact")\
            .eq("category", "us-centric")\
            .is_("youtube_id", "null")\
            .execute()
        return res.count if res.count is not None else 0
    except Exception as e:
        print(f"⚠️  Recovery Check Warning: {e}")
        return 0

def run_us_factory():
    print("\n" + "═"*60)
    print("🚀 HAZY US CHANNEL: SELF-RECOVERY & PRODUCTION ORCHESTRATOR")
    print("═"*60)
    
    # 1. Check for pending videos
    pending_count = get_pending_count()
    
    if pending_count > 0:
        print(f"♻️  FOUND {pending_count} STUCK VIDEO(S) for Hazy US.")
        print(f"System will now attempt to recover and upload them sequentially.")
    else:
        print("✨ No stuck videos found. Proceeding with fresh production...")

    # Set the target environment variable for run_factory.py
    os.environ["SHIFT_CHANNEL"] = "Hazy US"
    
    # Define the command to run the factory
    cmd = [sys.executable, "run_factory.py"]
    
    # If we have multiple pending, we run the factory multiple times
    # Note: run_factory.py itself processes 1 video per run.
    runs_needed = max(1, pending_count)
    
    for i in range(runs_needed):
        if runs_needed > 1:
            print(f"\n📦 PROCESSING BATCH {i+1}/{runs_needed}...")
            
        try:
            # Run the process and stream output to console
            process = subprocess.Popen(
                cmd,
                env=os.environ.copy(),
                stdout=sys.stdout,
                stderr=sys.stderr,
                text=True
            )
            process.wait()
            
            if process.returncode == 0:
                print(f"\n✅ BATCH {i+1} COMPLETE!")
            else:
                print(f"\n❌ BATCH {i+1} FAILED (Exit Code: {process.returncode})")
                # If a recovery failed, we might want to stop or continue
                if pending_count > 0:
                    print("Stopping recovery loop due to error.")
                    break
            
            if i < runs_needed - 1:
                print("⏳ Cooling down for 10s before next batch...")
                time.sleep(10)
                
        except KeyboardInterrupt:
            print("\n🛑 Recovery aborted by user.")
            if 'process' in locals(): process.terminate()
            break
        except Exception as e:
            print(f"\n💥 Orchestrator Error: {e}")
            break

    print("\n" + "═"*60)
    print("🏁 US CHANNEL OPERATION COMPLETE")
    print("═"*60)

if __name__ == "__main__":
    # Ensure we are in the root directory
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root_dir)
    run_us_factory()
