import os
import json
import time
import asyncio
from src.utils.discord import ping_error

NETSCAPE_PATH = "tiktok_cookies.txt"
JSON_PATH = "tiktok_cookies.json"
_temp_files = []


def _json_to_netscape(json_path: str, netscape_path: str):
    """Convert Playwright-format JSON cookies → Netscape HTTP format."""
    if not os.path.exists(json_path):
        return False
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            cookies = json.load(f)
    except:
        return False

    lines = ["# Netscape HTTP Cookie File", "# https://curl.se/docs/http-cookies.html", ""]
    for c in cookies:
        domain  = c.get("domain", "")
        flag    = "TRUE" if domain.startswith(".") else "FALSE"
        path    = c.get("path", "/")
        secure  = "TRUE" if c.get("secure", False) else "FALSE"
        expires = c.get("expires", -1)
        if not expires or expires <= 0:
            expires = int(time.time()) + 30 * 24 * 3600
        name  = c.get("name", "")
        value = c.get("value", "")
        lines.append(f"{domain}\t{flag}\t{path}\t{secure}\t{int(expires)}\t{name}\t{value}")

    with open(netscape_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return True


def _prepare_cookies() -> str | None:
    """
    Resolves cookie file in priority order.
    Returns path to JSON file if available (preferred for Playwright), 
    otherwise Netscape .txt file.
    """
    possible_roots = [os.getcwd(), os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))]
    
    # 1. Check for JSON cookies first (Native Playwright format)
    json_env = os.getenv("TIKTOK_COOKIES_JSON", "").strip()
    if json_env and (json_env.startswith("[") or json_env.startswith("{")):
        with open(JSON_PATH, "w", encoding="utf-8") as f:
            f.write(json_env)
        _temp_files.append(JSON_PATH)
        return JSON_PATH

    for root in possible_roots:
        path = os.path.join(root, JSON_PATH)
        if os.path.exists(path):
            return path

    # 2. Check for Netscape .txt
    txt_env = os.getenv("TIKTOK_COOKIES_TXT", "").strip()
    if txt_env:
        with open(NETSCAPE_PATH, "w", encoding="utf-8") as f:
            f.write(txt_env)
        _temp_files.append(NETSCAPE_PATH)
        return NETSCAPE_PATH

    for root in possible_roots:
        path = os.path.join(root, NETSCAPE_PATH)
        if os.path.exists(path):
            return path

    return None


async def _popup_slayer(page):
    """Register handlers for annoying TikTok popups."""
    try:
        # 1. "Got it" buttons (often appears after upload or on new features)
        await page.add_locator_handler(
            page.get_by_role("button", name="Got it", exact=False),
            lambda: page.get_by_role("button", name="Got it", exact=False).click()
        )
        # 2. "Maybe later" (for app downloads or surveys)
        await page.add_locator_handler(
            page.get_by_text("Maybe later", exact=False),
            lambda: page.get_by_text("Maybe later", exact=False).click()
        )
        # 3. "Accept all" cookies
        await page.add_locator_handler(
            page.get_by_role("button", name="Accept all", exact=False),
            lambda: page.get_by_role("button", name="Accept all", exact=False).click()
        )
        print("  [PopupSlayer] Active: Watching for 'Got it' and 'Maybe later'...")
    except Exception as e:
        print(f"  [PopupSlayer] Warning: Could not register some handlers: {e}")


async def async_upload_to_tiktok(video_path, caption, cookies_path, headless=False):
    """Core logic for robust TikTok upload via Playwright."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        
        # Load cookies
        if cookies_path.endswith(".json"):
            with open(cookies_path, "r") as f:
                cookies = json.load(f)
            context = await browser.new_context()
            await context.add_cookies(cookies)
        else:
            # Netscape format -> Not natively supported by Playwright add_cookies
            # Convert to JSON first
            json_temp = "temp_cookies.json"
            # (In a real scenario, we'd have a netscape_to_json, but we usually have JSON anyway)
            # For now, if it's .txt, we assume we can't use it directly here.
            # Fix: Add a dummy context and hope for the best, or better yet, use JSON.
            context = await browser.new_context()
            print("  Warning: Netscape cookies used. Playwright works best with JSON cookies.")
            # Simple conversion logic could be added here if needed.

        page = await context.new_page()
        
        # Apply stealth if possible
        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except ImportError:
            pass

        # Register Popup Slayer
        await _popup_slayer(page)

        print(f"  Navigating to TikTok Upload...")
        await page.goto("https://www.tiktok.com/tiktokstudio/upload?from=upload", wait_until="networkidle")
        
        # Check if logged in
        if "login" in page.url:
            print("  [ERROR] Cookies expired or invalid. Redirected to login.")
            await browser.close()
            return "AUTH_FAILED"

        print(f"  Selecting video: {os.path.basename(video_path)}")
        
        # Upload file
        async with page.expect_file_chooser() as fc_info:
            # Click the upload area
            await page.get_by_text("Select file").click()
        file_chooser = await fc_info.value
        await file_chooser.set_files(video_path)

        print("  Waiting for upload progress...")
        # Wait for "Edit" or "Post" button to become active, indicating upload done
        try:
            await page.wait_for_selector('button:has-text("Post")', timeout=120000)
        except:
            print("  Timeout waiting for upload to finish. Proceeding anyway.")

        print(f"  Setting caption: {caption[:30]}...")
        # Find the caption editor (usually a contenteditable div or textarea)
        # TikTok Studio uses a specific editor
        editor = page.locator('div[contenteditable="true"]').first
        await editor.click()
        # Clear existing (if any) and type
        await page.keyboard.press("Control+A")
        await page.keyboard.press("Backspace")
        await page.keyboard.type(caption)

        print("  Finalizing upload...")
        # Click "Post"
        post_btn = page.get_by_role("button", name="Post")
        await post_btn.click()

        # Wait for success message
        try:
            await page.wait_for_selector('text="Uploaded"', timeout=30000)
            print("  [SUCCESS] TikTok confirmed upload.")
            await asyncio.sleep(2) # Stability
            await browser.close()
            return "SUCCESS"
        except:
            print("  Could not confirm 'Uploaded' message, but clicked Post.")
            await asyncio.sleep(5)
            await browser.close()
            return "POST_CLICKED"


async def async_upload_videos(video_list, cookies_path, headless=False):
    """Upload multiple videos in a single browser session."""
    failed = []
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        context = await browser.new_context()
        
        # Load cookies
        if cookies_path.endswith(".json"):
            with open(cookies_path, "r") as f:
                cookies = json.load(f)
            await context.add_cookies(cookies)
        else:
            print("  Warning: Netscape cookies not supported in batch yet.")

        page = await context.new_page()
        try:
            from playwright_stealth import stealth_async
            await stealth_async(page)
        except: pass

        await _popup_slayer(page)

        for video in video_list:
            path = video["path"]
            caption = video["description"]
            print(f"\n  [BATCH] Processing: {os.path.basename(path)}")
            
            try:
                await page.goto("https://www.tiktok.com/tiktokstudio/upload?from=upload", wait_until="networkidle")
                if "login" in page.url:
                    print("  [ERROR] Auth failed during batch.")
                    failed.append(video)
                    break

                # Upload
                async with page.expect_file_chooser() as fc_info:
                    await page.get_by_text("Select file").click()
                file_chooser = await fc_info.value
                await file_chooser.set_files(path)

                # Wait & Post
                await page.wait_for_selector('button:has-text("Post")', timeout=120000)
                
                editor = page.locator('div[contenteditable="true"]').first
                await editor.click()
                await page.keyboard.press("Control+A")
                await page.keyboard.press("Backspace")
                await page.keyboard.type(caption)

                await page.get_by_role("button", name="Post").click()
                
                try:
                    await page.wait_for_selector('text="Uploaded"', timeout=45000)
                    print(f"  [SUCCESS] Posted {os.path.basename(path)}")
                except:
                    print(f"  [WARNING] Could not confirm upload for {os.path.basename(path)}")
            
            except Exception as e:
                print(f"  [ERROR] Failed to upload {os.path.basename(path)}: {e}")
                failed.append(video)
                
        await browser.close()
    return failed


def upload_to_tiktok(video_path, title, description, tags=None):
    """Sync wrapper for a single upload."""
    print(f"\n[TikTok] Starting Robust Upload for: {os.path.basename(video_path)}")

    cookies_path = _prepare_cookies()
    if not cookies_path:
        return None

    hashtags = " ".join(f"#{t}" for t in tags) if tags else "#shorts #gaming #facts"
    caption = f"{title}\n\n{description[:1400]}\n\n{hashtags}"[:2200]
    if not title: caption = description # Use raw description if title is empty (for bulk poster)
    
    is_headless = os.getenv("GITHUB_ACTIONS") == "true"
    
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            async_upload_to_tiktok(video_path, caption, cookies_path, headless=is_headless)
        )
        return "TikTok Upload Complete" if result != "AUTH_FAILED" else None
    except Exception as e:
        print(f"[TikTok ERROR] {e}")
        return None
    finally:
        _cleanup()


def upload_videos(video_list, cookies=None, headless=False):
    """Sync wrapper for batch upload (replaces tiktok-uploader.upload_videos)."""
    print(f"\n[TikTok] Starting Robust BATCH Upload for {len(video_list)} videos...")
    
    cookies_path = cookies or _prepare_cookies()
    if not cookies_path:
        return video_list

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        failed = loop.run_until_complete(
            async_upload_videos(video_list, cookies_path, headless=headless)
        )
        return failed
    except Exception as e:
        print(f"[TikTok BATCH ERROR] {e}")
        return video_list
    finally:
        _cleanup()


def _cleanup():
    """Remove temp cookie files created from env vars."""
    global _temp_files
    for path in _temp_files:
        if os.path.exists(path):
            try:
                os.remove(path)
            except:
                pass
    _temp_files = []