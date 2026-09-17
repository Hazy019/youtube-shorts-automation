"""
test_local_render.py — Zero-cost local render engine test.
--------------------------------------------------------
Tests Remotion CLI rendering locally without calling Gemini, Pexels,
or uploading anything to YouTube.
"""

import os
import sys
import subprocess
import shutil
import time

# Ensure workspace root is in sys.path
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.media.builder import make_cloud_video
from src.media.assets import _stage_local_asset

def run_test():
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    print("\n" + "="*60)
    print("[TEST] REMOTION LOCAL RENDER ENGINE TEST")
    print("="*60)

    # 1. Ensure public/media directory exists
    public_media = os.path.join(ROOT_DIR, "hazy-remotion-cloud", "public", "media")
    os.makedirs(public_media, exist_ok=True)

    temp_raw_vid = os.path.join(ROOT_DIR, "temp_test_raw.mp4")
    temp_raw_aud = os.path.join(ROOT_DIR, "temp_test_raw.mp3")

    try:
        # 2. Generate test assets matching the exact failed 31.4s duration (957 frames)
        print("\n1. Generating dummy video and audio via FFmpeg (31.4s / 957 frames)...")
        cmd_vid = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", "color=c=navy:s=1080x1920:d=33",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", temp_raw_vid
        ]
        cmd_aud = [
            "ffmpeg", "-y", "-f", "lavfi",
            "-i", "anullsrc=r=44100:cl=stereo", "-t", "33",
            "-q:a", "9", "-acodec", "libmp3lame", temp_raw_aud
        ]
        subprocess.run(cmd_vid, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        subprocess.run(cmd_aud, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # 3. Stage local assets using our updated asset pipeline
        print("2. Staging test assets into Remotion public directory...")
        staged_vid = _stage_local_asset(temp_raw_vid, "test_clip_01.mp4")
        staged_aud = _stage_local_asset(temp_raw_aud, "test_voice_01.mp3")

        print(f"   Staged Video URL: {staged_vid}")
        print(f"   Staged Audio URL: {staged_aud}")

        # 4. Trigger the actual local render via make_cloud_video
        print("\n3. Launching Remotion CLI render (957 frames / 31.4 seconds)...")
        os.environ["RENDER_MODE"] = "local"

        segments = [
            {
                "start": 0.0,
                "end": 15.0,
                "text": "SYSTEM TEST ONLINE",
                "text_effect": "pop",
                "position": "center",
                "highlight_word": "ONLINE"
            },
            {
                "start": 15.0,
                "end": 31.4,
                "text": "RENDER PIPELINE VERIFIED",
                "text_effect": "glow",
                "position": "center",
                "highlight_word": "VERIFIED"
            }
        ]

        out_path, err = make_cloud_video(
            voice_url=staged_aud,
            background_urls=[staged_vid],
            sfx_urls=[],
            bgm_url="",
            segments_data=segments,
            duration_seconds=31.4,
            category="general",
            render_seed=42,
            word_timestamps=[]
        )

        if err or not out_path or not os.path.exists(out_path):
            print(f"\n[FAIL] TEST FAILED: {err}")
            return False

        size_kb = os.path.getsize(out_path) / 1024
        print(f"\n[PASS] SUCCESS! Render complete: {out_path} ({size_kb:.1f} KB)")
        print("="*60)
        print("The local Remotion engine is 100% operational!")
        print("No 404 errors occurred — static files resolved correctly.")
        print("="*60)

        # Clean up output test video
        if os.path.exists(out_path):
            os.remove(out_path)
        return True

    finally:
        for f in [temp_raw_vid, temp_raw_aud]:
            if os.path.exists(f):
                try: os.remove(f)
                except: pass

if __name__ == "__main__":
    success = run_test()
    sys.exit(0 if success else 1)
