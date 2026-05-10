import os
import time
import requests
from dotenv import load_dotenv

load_dotenv()

class MetaAPI:
    def __init__(self):
        # Brutally clean env parsing to prevent malformed URLs
        self.access_token = os.getenv("META_PAGE_ACCESS_TOKEN", "").strip(' \t\n\r"')
        self.page_id = os.getenv("META_PAGE_ID", "").strip(' \t\n\r"')
        self.ig_id = os.getenv("META_INSTAGRAM_ID", "").strip(' \t\n\r"')
        self.base_url = "https://graph.facebook.com/v25.0"

    def upload_facebook_reel(self, video_url, description):
        """
        Uploads a Reel to Facebook Page using the 3-step process.
        """
        print(f"🚀 Starting Facebook Reel upload: {description[:30]}...")
        
        # ---------------------------------------------------------
        # Step 1: Initialize
        # ---------------------------------------------------------
        init_url = f"{self.base_url}/{self.page_id}/video_reels"
        init_payload = {
            "upload_phase": "start",
            "access_token": self.access_token
        }
        print(f"DEBUG FB Init URL: {init_url}")
        
        init_req = requests.post(init_url, data=init_payload)
        init_res = init_req.json()
        
        if "video_id" not in init_res:
            print(f"❌ FB Init Failed: {init_res}")
            return None
        
        video_id = init_res["video_id"]
        upload_url = init_res.get("upload_url")
        print(f"✅ FB Init Success. Video ID: {video_id}")

        # ---------------------------------------------------------
        # Step 2: Upload Binary
        # ---------------------------------------------------------
        if not upload_url:
            print("❌ FB Upload URL missing from init response.")
            return None
            
        try:
            video_data = requests.get(video_url).content
            headers = {
                "Authorization": f"OAuth {self.access_token}",
                "offset": "0",
                "file_size": str(len(video_data)),
                "Content-Type": "application/octet-stream"
            }
            upload_res = requests.post(upload_url, data=video_data, headers=headers)
            upload_json = upload_res.json()
            
            if not upload_json.get("success"):
                print(f"❌ FB Binary Upload Failed: {upload_json}")
                return None
            print("✅ FB Binary Upload Success.")
        except Exception as e:
            print(f"❌ FB Upload Exception: {e}")
            return None

        # ---------------------------------------------------------
        # Step 3: Publish
        # ---------------------------------------------------------
        publish_url = f"{self.base_url}/{self.page_id}/video_reels"
        publish_payload = {
            "upload_phase": "finish",
            "video_id": video_id,
            "description": description,
            "video_state": "PUBLISHED",
            "access_token": self.access_token
        }
        publish_req = requests.post(publish_url, data=publish_payload)
        publish_res = publish_req.json()
        
        if publish_res.get("success"):
            print("🎉 Facebook Reel Published successfully!")
            return video_id
        else:
            print(f"❌ FB Publish Failed: {publish_res}")
            return None

    def upload_instagram_reel(self, video_url, caption):
        """
        Uploads a Reel to Instagram Business Account.
        Requires a public video_url (S3).
        """
        print(f"🚀 Starting Instagram Reel upload: {caption[:30]}...")
        
        # Step 1: Create Container
        container_url = f"{self.base_url}/{self.ig_id}/media"
        container_payload = {
            "media_type": "REELS",
            "video_url": video_url,
            "caption": caption,
            "access_token": self.access_token
        }
        container_req = requests.post(container_url, data=container_payload)
        container_res = container_req.json()
        
        if "id" not in container_res:
            print(f"❌ IG Container Creation Failed: {container_res}")
            return None
        
        creation_id = container_res["id"]
        print(f"✅ IG Container Created: {creation_id}. Waiting for processing...")

        # Step 2: Poll for status
        max_retries = 30
        status_url = f"{self.base_url}/{creation_id}"
        for i in range(max_retries):
            status_req = requests.get(status_url, params={"fields": "status_code", "access_token": self.access_token})
            status_res = status_req.json()
            status = status_res.get("status_code")
            
            if status == "FINISHED":
                print("✅ IG Processing Finished.")
                break
            elif status == "ERROR":
                print(f"❌ IG Processing Error: {status_res}")
                return None
            
            print(f"⏳ IG Status: {status}... ({i+1}/{max_retries})")
            time.sleep(10)
        else:
            print("❌ IG Status polling timed out.")
            return None

        # Step 3: Publish
        publish_url = f"{self.base_url}/{self.ig_id}/media_publish"
        publish_payload = {
            "creation_id": creation_id,
            "access_token": self.access_token
        }
        publish_req = requests.post(publish_url, data=publish_payload)
        publish_res = publish_req.json()
        
        if "id" in publish_res:
            print("🎉 Instagram Reel Published successfully!")
            return publish_res["id"]
        else:
            print(f"❌ IG Publish Failed: {publish_res}")
            return None

if __name__ == "__main__":
    client = MetaAPI()
    print("Meta API Client initialized.")
