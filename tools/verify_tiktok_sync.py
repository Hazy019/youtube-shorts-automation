import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import time
from dotenv import load_dotenv
from supabase import create_client, Client
from src.api.tiktok import _prepare_cookies, _validate_netscape, _cleanup

load_dotenv()

def get_db() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    return create_client(url, key)

def scan_and_sync():
    print("="*40)
    print("TIKTOK LIVE PROFILE SCANNER & SYNC")
    print("="*40)
    
    db = get_db()
    cookies_path = _prepare_cookies()
    
    if not cookies_path or not _validate_netscape(cookies_path):
        print("FATAL: Invalid or missing TikTok cookies.")
        return

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch(headless=False) # Keep False so user can see it work
        
        # Load cookies into context
        # tiktok-uploader uses netscape, but Playwright needs JSON.
        # We'll use the JSON file if it exists, otherwise we'd need to convert back.
        # Luckily _prepare_cookies ensures we have what we need.
        
        context = browser.new_context()
        
        # If we have tiktok_cookies.json, use it
        json_path = "tiktok_cookies.json"
        if os.path.exists(json_path):
            import json
            with open(json_path, 'r') as f:
                cookies = json.load(f)
                context.add_cookies(cookies)
        
        page = context.new_page()
        
        print("Navigating to TikTok profile...")
        page.goto("https://www.tiktok.com/@hazy.insight") # Adjusted for Hazy's profile
        time.sleep(5) # Wait for load
        
        # Scrape video titles (captions)
        # Selective: div[data-e2e="user-post-item-desc"]
        print("Extracting live video titles...")
        video_elements = page.query_selector_all('div[data-e2e="user-post-item-desc"]')
        live_titles = [el.inner_text() for el in video_elements]
        
        print(f"Found {len(live_titles)} videos on profile.")
        
        if not live_titles:
            print("Warning: No videos found. Is the profile correct or are cookies expired?")
            browser.close()
            return

        # Cross-reference with Supabase
        resp = db.table("videos").select("id, title, topic").eq("tiktok_status", "PENDING").execute()
        pending = resp.data
        
        matches = 0
        for item in pending:
            title = item.get("title", "")
            # Check if title (or part of it) exists in live captions
            if any(title.lower() in live.lower() for live in live_titles):
                print(f"  ✓ MATCH FOUND: {title} (ID: {item['id']})")
                db.table("videos").update({"tiktok_status": "SUCCESS"}).eq("id", item['id']).execute()
                matches += 1
        
        print(f"\nScan complete. Synchronized {matches} items to SUCCESS.")
        browser.close()

    _cleanup()

if __name__ == "__main__":
    scan_and_sync()
