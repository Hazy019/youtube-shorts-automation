import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def list_pending_videos():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        print("❌ Supabase credentials missing.")
        return

    supabase: Client = create_client(url, key)
    
    print("🔍 FETCHING PENDING/FAILED TOPICS FROM BRAIN...")
    print("=" * 60)
    
    try:
        # Fetch videos that don't have a YouTube ID yet
        # These are topics that were generated but failed during render/upload
        response = supabase.table("videos").select("id, topic, title, created_at")\
            .is_("youtube_id", "null")\
            .order("created_at", desc=True)\
            .limit(10).execute()

        if not response.data:
            print("✨ No failed topics found! Everything seems to be published.")
            return

        print(f"{'ID':<5} | {'DATE':<12} | {'TOPIC'}")
        print("-" * 60)
        for row in response.data:
            date_str = row['created_at'][:10]
            topic = row['topic'][:40] + "..." if len(row['topic']) > 40 else row['topic']
            print(f"{row['id']:<5} | {date_str:<12} | {topic}")
            
        print("\n💡 To recover a specific topic, you can modify run_factory.py to target its ID,")
        print("   or I can build you a 'Resume' script if you'd like to automate the fix!")

    except Exception as e:
        print(f"💥 Error querying Supabase: {e}")

if __name__ == "__main__":
    list_pending_videos()
