import os
import sys
import requests
from dotenv import load_dotenv

load_dotenv()

ALL_PASSED = True


def test_pexels():
    global ALL_PASSED
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        print("[FAIL] PEXELS_API_KEY missing - B-roll will FAIL. Aborting.")
        ALL_PASSED = False
        return False

    print(f"Testing Pexels: {api_key[:5]}...{api_key[-5:]}")
    try:
        resp = requests.get(
            "https://api.pexels.com/videos/search?query=nature&per_page=1&orientation=portrait",
            headers={"Authorization": api_key},
            timeout=10
        )
        if resp.status_code == 200 and resp.json().get("videos"):
            print("[OK] Pexels OK.")
            return True
        else:
            print(f"[FAIL] Pexels FAILED - Status {resp.status_code}: {resp.text[:200]}")
            ALL_PASSED = False
            return False
    except Exception as e:
        print(f"[FAIL] Pexels ERROR: {e}")
        ALL_PASSED = False
        return False


def test_pixabay():
    """Non-fatal — Pixabay is a fallback for Pexels, not required."""
    api_key = os.getenv("PIXABAY_API_KEY")
    if not api_key or "INSERT" in api_key:
        print("[WARN] Pixabay key not set - Pixabay fallback disabled (non-fatal, Pexels is primary).")
        return True

    print(f"Testing Pixabay: {api_key[:5]}...{api_key[-5:]}")
    try:
        resp = requests.get(
            f"https://pixabay.com/api/videos/?key={api_key}&q=nature&video_type=film&orientation=vertical",
            timeout=10
        )
        if resp.status_code == 200 and resp.json().get("hits"):
            print(f"[OK] Pixabay OK - {len(resp.json()['hits'])} results.")
            return True
        else:
            print(f"[WARN] Pixabay returned no results - Pexels will cover (non-fatal).")
            return True  # Still non-fatal
    except Exception as e:
        print(f"[WARN] Pixabay unreachable: {e} - non-fatal, Pexels covers.")
        return True


def test_elevenlabs():
    """
    Non-fatal — ElevenLabs is a fallback for Edge-TTS, not the primary engine.
    Edge-TTS (free, unlimited) runs first on every video.
    ElevenLabs only activates if Edge-TTS crashes.
    We warn on low quota but never block the run.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        print("[WARN] ELEVENLABS_API_KEY not set - ElevenLabs fallback disabled (non-fatal, Edge-TTS is primary).")
        return True

    print(f"Testing ElevenLabs: {api_key[:5]}...{api_key[-5:]}")
    try:
        resp = requests.get(
            "https://api.elevenlabs.io/v1/user/subscription",
            headers={"xi-api-key": api_key},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            limit = data.get("character_limit", 1)
            used  = data.get("character_count", 0)
            left  = limit - used
            print(f"[OK] ElevenLabs OK - {left:,} characters remaining.")
            if left < 5000:
                print(f"[WARN] WARNING: ElevenLabs quota very low ({left} left) - Edge-TTS will carry all production.")
            return True
        elif resp.status_code == 401:
            print("[WARN] ElevenLabs key invalid (401) - Edge-TTS will handle all TTS (non-fatal).")
            return True
        else:
            print(f"[WARN] ElevenLabs check returned {resp.status_code} - non-fatal, Edge-TTS covers.")
            return True
    except Exception as e:
        print(f"[WARN] ElevenLabs unreachable: {e} - non-fatal, Edge-TTS covers.")
        return True


if __name__ == "__main__":
    print("=" * 50)
    print("  HAZY API PRE-FLIGHT CHECK")
    print("=" * 50)
    print()
    print("--- Critical (blocks factory) ---")
    test_pexels()
    print()
    print("--- Non-fatal (warnings only) ---")
    test_pixabay()
    test_elevenlabs()
    print()
    print("=" * 50)
    if ALL_PASSED:
        print("[OK] All critical APIs verified - Factory cleared to launch.")
        sys.exit(0)
    else:
        print("[FAIL] Critical API failure - Aborting to save Gemini tokens and Lambda cost.")
        sys.exit(1)
