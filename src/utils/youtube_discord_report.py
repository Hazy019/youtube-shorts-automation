import os
import sys
import requests
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request

# Load environment variables
load_dotenv()

# We need the youtube.readonly scope to fetch channel and video statistics
SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly"
]

def authenticate_youtube():
    """Authenticates the user and returns the YouTube API service."""
    creds = None
    
    # The file token_youtube.json stores the user's access and refresh tokens.
    if os.path.exists("token_youtube.json"):
        creds = Credentials.from_authorized_user_file("token_youtube.json", SCOPES)
        
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            try:
                creds.refresh(Request())
            except Exception as e:
                print(f"Token refresh failed: {e}. Re-authenticating...")
                if os.path.exists("client_secrets.json"):
                    flow = InstalledAppFlow.from_client_secrets_file("client_secrets.json", SCOPES)
                    creds = flow.run_local_server(port=0)
                else:
                    print("Error: client_secrets.json is required for authentication.")
                    sys.exit(1)
        else:
            if os.path.exists("client_secrets.json"):
                flow = InstalledAppFlow.from_client_secrets_file("client_secrets.json", SCOPES)
                creds = flow.run_local_server(port=0)
            else:
                print("Error: client_secrets.json is required for authentication.")
                sys.exit(1)
                
        # Save the credentials for the next run
        with open("token_youtube.json", "w") as token:
            token.write(creds.to_json())
            
    return build("youtube", "v3", credentials=creds)

def send_daily_report():
    """Fetches YouTube channel analytics and sends a Discord webhook report."""
    
    webhook_url = os.getenv("WEBHOOK_INSIGHTS") or os.getenv("DISCORD_WEBHOOK_URL")
    if not webhook_url:
        print("Error: DISCORD_WEBHOOK_URL or WEBHOOK_INSIGHTS not found in .env")
        sys.exit(1)

    print("Authenticating with YouTube API...")
    youtube = authenticate_youtube()
    
    print("Fetching channel statistics...")
    # 1. Get channel statistics and the "uploads" playlist ID
    channel_response = youtube.channels().list(
        part="snippet,statistics,contentDetails",
        mine=True
    ).execute()
    
    if not channel_response.get("items"):
        print("Error: Could not retrieve channel data. Make sure you authenticated with a channel.")
        sys.exit(1)
        
    channel = channel_response["items"][0]
    channel_title = channel["snippet"]["title"]
    channel_thumbnail = channel["snippet"]["thumbnails"]["high"]["url"]
    
    stats = channel["statistics"]
    total_subs = stats.get("subscriberCount", "0")
    total_views = stats.get("viewCount", "0")
    
    uploads_playlist_id = channel["contentDetails"]["relatedPlaylists"]["uploads"]
    
    print("Fetching recent videos...")
    # 2. Get the 3 most recent videos from the uploads playlist
    playlist_response = youtube.playlistItems().list(
        part="snippet",
        playlistId=uploads_playlist_id,
        maxResults=3
    ).execute()
    
    video_items = playlist_response.get("items", [])
    video_ids = [item["snippet"]["resourceId"]["videoId"] for item in video_items]
    
    # 3. Get statistics for those specific videos
    videos_stats_response = youtube.videos().list(
        part="snippet,statistics",
        id=",".join(video_ids)
    ).execute()
    
    recent_videos = videos_stats_response.get("items", [])
    
    # 4. Professional AI Analysis
    print("Generating Professional AI Analysis...")
    try:
        from google import genai
        from google.genai import types
        
        gemini_client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        video_summaries = []
        for v in recent_videos:
            video_summaries.append(f"- {v['snippet']['title']}: {v['statistics'].get('viewCount', 0)} views, {v['statistics'].get('likeCount', 0)} likes")
        
        stats_context = "\n".join(video_summaries)
        
        prompt = (
            f"Analyze these YouTube statistics for the 'Hazy Insight' channel and provide a professional strategy.\n"
            f"Total Subs: {total_subs}\n"
            f"Total Channel Views: {total_views}\n"
            f"Recent Uploads:\n{stats_context}\n\n"
            "In 120 words, provide a professional analysis on why views might be fluctuating and "
            "give two concrete recommendations for future topics or hook improvements to maximize US-audience retention."
        )
        
        ai_resp = gemini_client.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.7),
        )
        professional_analysis = ai_resp.text.strip()
    except Exception as e:
        print(f"AI Analysis failed: {e}")
        professional_analysis = "AI analysis currently unavailable. Check recent video performance for hook patterns."

    # 5. Construct the Discord Embed Payload
    embed = {
        "title": f"📊 Daily Analytics Report: {channel_title}",
        "color": int("FF0000", 16),  # Sleek YouTube Red
        "thumbnail": {"url": channel_thumbnail},
        "fields": [
            {
                "name": "Total Subscribers",
                "value": f"**{int(total_subs):,}**",
                "inline": True
            },
            {
                "name": "Total Views",
                "value": f"**{int(total_views):,}**",
                "inline": True
            },
            {
                "name": "\u200b", # Spacing
                "value": "\u200b",
                "inline": False
            },
            {
                "name": "🎬 Recent Video Performance",
                "value": "Stats for your 3 most recent uploads:",
                "inline": False
            }
        ],
        "footer": {
            "text": "Automated YouTube Analytics • Powered by Xity Media Factory"
        }
    }
    
    # Add each video's stats to the embed
    for video in recent_videos:
        title = video["snippet"]["title"]
        v_stats = video["statistics"]
        views = v_stats.get("viewCount", "0")
        likes = v_stats.get("likeCount", "0")
        
        embed["fields"].append({
            "name": f"🎥 {title}",
            "value": f"👀 **{int(views):,}** Views | 👍 **{int(likes):,}** Likes",
            "inline": False
        })

    # Add the Professional Analysis Section
    embed["fields"].append({
        "name": "\u200b", # Spacing
        "value": "\u200b",
        "inline": False
    })
    embed["fields"].append({
        "name": "💡 Professional Analytic Insight",
        "value": f"*{professional_analysis}*",
        "inline": False
    })
        
    payload = {
        "embeds": [embed]
    }
    
    print("Sending payload to Discord...")
    # 6. Push data to Discord Webhook
    response = requests.post(webhook_url, json=payload)
    
    if response.status_code in [200, 204]:
        print("✅ Successfully sent daily report to Discord!")
    else:
        print(f"❌ Failed to send report. Status: {response.status_code}, Response: {response.text}")
        sys.exit(1)

if __name__ == "__main__":
    send_daily_report()
