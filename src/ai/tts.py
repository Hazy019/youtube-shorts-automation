"""
tts.py — Text-to-Speech Engine v12
------------------------------------
PRIMARY:  ElevenLabs neural voice (broadcast quality, less detectable)
FALLBACK: Edge-TTS (free, local) — heavily tuned to avoid AI-detection

EDGE-TTS ANTI-DETECTION STRATEGY:
  1. Voice: AndrewNeural or GuyNeural — NOT ChristopherNeural (most flagged voice)
  2. Rate: +3% max — slower = more human cadence
  3. Pitch: -2Hz — slightly lower = warmer, less robotic
  4. Scripts MUST use punctuation to force breaths:
       ...  = 600ms pause (dramatic beat)
       ,    = 200ms breath (natural comma pause)
       .    = 400ms full stop
  5. Phonetic spelling in script: "May-lay" not "Melee", "Zell-duh" not "Zelda"
  6. Sentence fragments deliberately: "Nobody noticed. For two years."
     Edge-TTS handles fragments better than long compound sentences.

VOICE ROTATION (anti-detection):
  Rotating voices across videos prevents viewers from pattern-matching the AI voice.
  GuyNeural → AndrewNeural → RyanNeural → rotate for each video.
"""

import os
import time
import random
import requests
import boto3
import asyncio
import threading
import edge_tts
from mutagen.mp3 import MP3
from pydub import AudioSegment, effects
from dotenv import load_dotenv
from src.utils.discord import ping_error

load_dotenv()

BUCKET_NAME = os.getenv("BUCKET_NAME")

# ── ElevenLabs voice IDs (broadcast quality, harder to detect as AI) ─────────
ELEVENLABS_VOICE_IDS = [
    "IKne3meq5aSn9XLyUdCD",   # Adam — authoritative, good for gaming
    "pNInz6obpgDQGcFmaJgB",   # Antoni — warm, good for general facts
    "TX3LPaxmHKxFdv7VOQHJ",   # Liam — energetic, good for hooks
]

# ── Edge-TTS voice pool (anti-detection rotation) ────────────────────────────
# ChristopherNeural is excluded — it is the most recognizable AI voice.
# GuyNeural and AndrewNeural are significantly less flagged.
EDGE_TTS_VOICES = [
    {"name": "en-US-AndrewNeural",  "rate": "+2%",  "pitch": "-2Hz"},  # warm, natural
    {"name": "en-US-GuyNeural",     "rate": "+3%",  "pitch": "-1Hz"},  # neutral, clear
    {"name": "en-US-RyanMultilingualNeural", "rate": "+0%", "pitch": "+0Hz"},  # deliberate
    {"name": "en-GB-RyanNeural",    "rate": "+5%",  "pitch": "-2Hz"},  # British — stands out
    {"name": "en-US-EricNeural",    "rate": "+2%",  "pitch": "-1Hz"},  # calm, confident
]


async def _generate_edge_tts_async(text: str, output_file: str, voice_config: dict):
    """
    Generate Edge-TTS audio with specific voice, rate, and pitch.
    The voice_config dict controls rate and pitch for human-sounding output.
    """
    communicate = edge_tts.Communicate(
        text,
        voice_config["name"],
        rate=voice_config["rate"],
        pitch=voice_config["pitch"],
    )
    await communicate.save(output_file)


def _pick_edge_voice(category: str) -> dict:
    """
    Pick an Edge-TTS voice appropriate for the category.
    Rotates to prevent pattern-matching across videos.
    Gaming: prefer energetic voices. General: prefer warm/deliberate voices.
    """
    if category == "gaming":
        # Guy and Andrew work well for energetic gaming content
        pool = [v for v in EDGE_TTS_VOICES if "Guy" in v["name"] or "Andrew" in v["name"] or "Ryan" in v["name"]]
    else:
        # Eric and Andrew for calm factual content
        pool = [v for v in EDGE_TTS_VOICES if "Eric" in v["name"] or "Andrew" in v["name"]]

    return random.choice(pool if pool else EDGE_TTS_VOICES)


def check_elevenlabs_quota(api_key: str) -> float:
    """Returns usage ratio 0.0-1.0. Returns 0.0 (safe) on network error."""
    if not api_key:
        return 1.0  # treat missing key as quota exhausted → use fallback
    try:
        r = requests.get(
            "https://api.elevenlabs.io/v1/user/subscription",
            headers={"xi-api-key": api_key},
            timeout=10,
        )
        if r.status_code == 200:
            data = r.json()
            limit = data.get("character_limit", 1)
            return data.get("character_count", 0) / limit if limit else 1.0
    except Exception:
        pass
    return 0.0


def _normalize_audio(local_file: str) -> bool:
    """Normalize audio to -3 LUFS headroom. Returns True on success."""
    try:
        raw  = AudioSegment.from_file(local_file)
        norm = effects.normalize(raw)
        # Export to temp then atomic replace (prevents partial-write corruption)
        tmp = local_file + ".tmp.mp3"
        norm.export(tmp, format="mp3", parameters=["-q:a", "0"])
        os.replace(tmp, local_file)
        return True
    except Exception as e:
        print(f"  Audio normalization warning: {e}")
        return False


def generate_voiceover(script_text: str, category: str = "general"):
    """
    Generate a voiceover MP3, upload to S3, and return a presigned URL.

    Returns: (url: str | None, duration_seconds: float, error: str | None)
    Always unpack all three values.

    Tries ElevenLabs first (better quality, harder to detect).
    Falls back to Edge-TTS with anti-detection voice selection.
    """
    api_key    = os.getenv("ELEVENLABS_API_KEY")
    local_file = f"temp_voice_{int(time.time())}.mp3"
    use_fallback = False

    # ── Try ElevenLabs ────────────────────────────────────────────────────
    usage = check_elevenlabs_quota(api_key)
    if usage >= 0.95:
        print(f"  ElevenLabs quota at {usage:.0%} — switching to Edge-TTS.")
        use_fallback = True
    else:
        voice_id = random.choice(ELEVENLABS_VOICE_IDS)
        url      = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers  = {
            "Accept":       "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key":   api_key or "",
        }
        payload = {
            "text":     script_text,
            "model_id": "eleven_turbo_v2",
            "voice_settings": {
                "stability":        0.45,   # slight instability = more human variation
                "similarity_boost": 0.80,
                "style":            0.30,   # adds expressiveness
                "use_speaker_boost": True,
            },
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                with open(local_file, "wb") as f:
                    f.write(resp.content)
                print(f"  ElevenLabs: voice_id={voice_id[:8]}... OK")
            else:
                print(f"  ElevenLabs error {resp.status_code}: {resp.text[:100]}")
                use_fallback = True
        except requests.RequestException as e:
            print(f"  ElevenLabs network error: {e}")
            use_fallback = True

    # ── Fallback: Edge-TTS with anti-detection tuning ─────────────────────
    if use_fallback:
        voice_config = _pick_edge_voice(category)
        print(f"  Edge-TTS fallback: {voice_config['name']} rate={voice_config['rate']} pitch={voice_config['pitch']}")
        ping_error(f"Edge-TTS fallback active ({voice_config['name']})", "ElevenLabs Quota")

        tts_error = None

        def _run_tts():
            nonlocal tts_error
            try:
                asyncio.run(_generate_edge_tts_async(script_text, local_file, voice_config))
            except Exception as e:
                tts_error = e

        t = threading.Thread(target=_run_tts)
        t.start()
        t.join(timeout=120)

        if t.is_alive():
            return None, 0, "Edge-TTS timed out after 120s"
        if tts_error:
            return None, 0, f"Edge-TTS error: {tts_error}"

    # ── Validate file exists ──────────────────────────────────────────────
    if not os.path.exists(local_file) or os.path.getsize(local_file) < 1000:
        return None, 0, "Audio file missing or too small after TTS generation"

    # ── Normalize audio ───────────────────────────────────────────────────
    _normalize_audio(local_file)

    # ── Get duration ──────────────────────────────────────────────────────
    try:
        audio_info       = MP3(local_file)
        duration_seconds = audio_info.info.length
        print(f"  Audio duration: {duration_seconds:.1f}s")
    except Exception as e:
        os.remove(local_file)
        return None, 0, f"Failed to read audio duration: {e}"

    # ── Upload to S3 ──────────────────────────────────────────────────────
    try:
        s3      = boto3.client("s3", region_name="us-east-1")
        s3_key  = f"voiceovers/voice_{int(time.time())}_{random.randint(1000,9999)}.mp3"
        s3.upload_file(local_file, BUCKET_NAME, s3_key, ExtraArgs={"ContentType": "audio/mpeg"})
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=7200,
        )
    except Exception as e:
        os.remove(local_file)
        return None, 0, f"S3 upload failed: {e}"
    finally:
        if os.path.exists(local_file):
            os.remove(local_file)

    return presigned_url, duration_seconds, None