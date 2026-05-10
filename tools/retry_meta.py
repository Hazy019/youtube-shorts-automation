import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

# Add parent dir to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api.meta import MetaAPI
from src.utils.discord import ping_creator

load_dotenv()

def retry_meta_posting():
    print("="*50)
    print("META RECOVERY: RETRYING FAILED POSTS")
    print("="*50)

    # 1. Connect to Supabase
    supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
    
    # 2. Fetch the latest video that failed Meta posting
    print("🔍 Fetching latest failed record from Supabase...")
    res = supabase.table("videos")\
        .select("*")\
        .or_("facebook_status.eq.FAILED,instagram_status.eq.FAILED")\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()

    if not res.data:
        print("✅ No failed Meta posts found in the last batch.")
        return

    video = res.data[0]
    topic = video.get("topic", "Unknown Topic")
    video_url = video.get("s3_video_url")
    title = video.get("title", "No Title")
    
    # Reconstruct description (or use a default)
    # The factory uses: f"{viral_package['title']}\n\n{viral_package['description'][:1400]}\n\n{hashtags}"
    # Since we might not have the full description in the DB, we'll use title + topic
    description = f"{title}\n\nEnjoy this insight about {topic}!\n\n#shorts #facts #hazyinsight"

    if not video_url:
        print("❌ Error: s3_video_url missing in database record.")
        return

    print(f"📦 Retrying video: {title}")
    print(f"🔗 S3 URL: {video_url}")

    # 3. Initialize Meta API
    meta = MetaAPI()
    
    fb_status = video.get("facebook_status", "FAILED")
    ig_status = video.get("instagram_status", "FAILED")

    # Retry Facebook
    if fb_status == "FAILED":
        print("\n📘 Retrying Facebook...")
        try:
            fb_id = meta.upload_facebook_reel(video_url, description)
            if fb_id:
                fb_status = "SUCCESS"
                supabase.table("videos").update({"facebook_status": "SUCCESS"}).eq("id", video["id"]).execute()
                print("✅ Facebook Success!")
            else:
                print("❌ Facebook still failing. Check permissions.")
        except Exception as e:
            print(f"❌ Facebook Error: {e}")

    # Retry Instagram
    if ig_status == "FAILED":
        print("\n📸 Retrying Instagram...")
        try:
            ig_id = meta.upload_instagram_reel(video_url, description)
            if ig_id:
                ig_status = "SUCCESS"
                supabase.table("videos").update({"instagram_status": "SUCCESS"}).eq("id", video["id"]).execute()
                print("✅ Instagram Success!")
            else:
                print("❌ Instagram still failing. Check permissions.")
        except Exception as e:
            print(f"❌ Instagram Error: {e}")

    # 4. Final Notification
    if fb_status == "SUCCESS" or ig_status == "SUCCESS":
        print("\n🎉 Recovery successful! Sending Discord notification...")
        ping_creator("RECOVERY", "QUEUED", fb_status, ig_status, title)
    else:
        print("\n⚠️ Recovery failed. Please ensure the token has 'pages_manage_posts' and 'instagram_content_publish' scopes.")

    print("="*50)

if __name__ == "__main__":
    retry_meta_posting()
