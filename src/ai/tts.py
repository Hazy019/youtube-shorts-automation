"""
tts.py — Text-to-Speech Engine v12
------------------------------------
PRIMARY:  Edge-TTS (free, unlimited, high-speed)
FALLBACK: ElevenLabs (paid, high-fidelity)

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

# ── Edge-TTS voice pool (best-sounding, anti-detection) ─────────────────────
# REMOVED: GuyNeural — most recognizable/robotic AI voice on YouTube. Huge mistake.
# ADDED:   SteffanNeural, DavisNeural, TonyNeural, JasonNeural — sound closest to human.
#
# Tuning philosophy:
#   Rate:  Slower speech = sounds more human. AI defaults are too fast.
#   Pitch: Slightly lower = warmer, less sharp/synthetic.
EDGE_TTS_VOICES = [
    {"name": "en-US-SteffanNeural",  "rate": "-5%",  "pitch": "-3Hz"},  # BEST: deep, warm storyteller
    {"name": "en-US-DavisNeural",    "rate": "-3%",  "pitch": "-4Hz"},  # authoritative, dramatic
    {"name": "en-US-TonyNeural",     "rate": "-5%",  "pitch": "-2Hz"},  # conversational, natural
    {"name": "en-US-JasonNeural",    "rate": "+2%",  "pitch": "-1Hz"},  # energetic, punchy — gaming
    {"name": "en-US-AndrewNeural",   "rate": "-3%",  "pitch": "-2Hz"},  # warm backup
    {"name": "en-US-BrianMultilingualNeural", "rate": "-5%", "pitch": "-2Hz"},  # deliberate, clear
]


async def _generate_edge_tts_async(text: str, output_file: str, voice_config: dict) -> list:
    """
    Generate Edge-TTS audio using streaming mode.
    Captures WordBoundary events to get precise per-word timestamps.
    Returns: list of {word, start, duration} in seconds — powers karaoke captions.
    """
    communicate = edge_tts.Communicate(
        text,
        voice_config["name"],
        rate=voice_config["rate"],
        pitch=voice_config["pitch"],
    )
    word_boundaries = []
    with open(output_file, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # Edge-TTS offset is in 100-nanosecond ticks → convert to seconds
                word_boundaries.append({
                    "word":     chunk["text"],
                    "start":    round(chunk["offset"]   / 10_000_000, 3),
                    "duration": round(chunk["duration"] / 10_000_000, 3),
                })
    return word_boundaries


def _pick_edge_voice(category: str) -> dict:
    """
    Pick the best Edge-TTS voice for the category.
    Prioritizes the most human-sounding voices per content type.
    Gaming: energetic (Jason). General/Science: deep storytelling (Steffan, Davis).
    US-Centric: dramatic and authoritative (Davis, Tony).
    """
    if category == "us-centric":
        # Davis is authoritative and dramatic — matches the Breaking News style
        pool = [v for v in EDGE_TTS_VOICES if "Davis" in v["name"] or "Tony" in v["name"]]
    else:
        # Steffan is the best for warm, believable fact-based storytelling
        pool = [v for v in EDGE_TTS_VOICES if "Steffan" in v["name"] or "Tony" in v["name"] or "Brian" in v["name"]]

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
        else:
            print(f"  ElevenLabs quota check failed (HTTP {r.status_code}). Switching to fallback.")
            return 1.0  # Treat any error as "quota exhausted" to trigger fallback safely
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

    Returns: (url: str | None, duration_seconds: float, word_timestamps: list, error: str | None)
    word_timestamps is a list of {word, start, duration} dicts for karaoke captions.
    Always unpack all four values.
    """
    api_key    = os.getenv("ELEVENLABS_API_KEY")
    local_file = f"temp_voice_{int(time.time())}.mp3"
    use_fallback = False
    word_timestamps = []  # populated by Edge-TTS WordBoundary events

    # ── Primary: Edge-TTS (Free & Unlimited) ───────────────────────────
    voice_config = _pick_edge_voice(category)
    # Let the voice pool handle pacing — do NOT override rate here.
    # The tuned pool uses -3% to -5% rate (slower = more human).
    print(f"  Edge-TTS Primary: {voice_config['name']} rate={voice_config['rate']} pitch={voice_config['pitch']}")

    tts_error = None

    def _run_tts():
        nonlocal tts_error, word_timestamps
        try:
            word_timestamps = asyncio.run(
                _generate_edge_tts_async(script_text, local_file, voice_config)
            )
            print(f"  Edge-TTS: captured {len(word_timestamps)} word timestamps for karaoke.")
        except Exception as e:
            tts_error = e

    t = threading.Thread(target=_run_tts)
    t.start()
    t.join(timeout=120)

    if t.is_alive():
        print("  Edge-TTS timed out. Checking ElevenLabs fallback...")
        use_fallback = True
    elif tts_error:
        print(f"  Edge-TTS error: {tts_error}. Checking ElevenLabs fallback...")
        use_fallback = True
    else:
        print(f"  Edge-TTS success!")

    # ── Fallback: ElevenLabs (Only if Edge-TTS fails) ──────────────────────
    if use_fallback:
        print("  ElevenLabs fallback initiated...")
        usage = check_elevenlabs_quota(api_key)
        if usage >= 0.98:
            return None, 0, [], "All TTS options exhausted (ElevenLabs quota full)"
        
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
                "stability":        0.45,
                "similarity_boost": 0.80,
                "style":            0.30,
                "use_speaker_boost": True,
            },
        }
        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=60)
            if resp.status_code == 200:
                with open(local_file, "wb") as f:
                    f.write(resp.content)
                print(f"  ElevenLabs Fallback: voice_id={voice_id[:8]}... OK")
            else:
                return None, 0, [], f"ElevenLabs fallback failed ({resp.status_code}): {resp.text[:100]}"
        except requests.RequestException as e:
            return None, 0, [], f"ElevenLabs fallback network error: {e}"

    # ── Validate file exists ──────────────────────────────────────────────
    if not os.path.exists(local_file) or os.path.getsize(local_file) < 1000:
        return None, 0, [], "Audio file missing or too small after TTS generation"

    # ── Normalize audio ───────────────────────────────────────────────────
    _normalize_audio(local_file)

    # ── Get duration ──────────────────────────────────────────────────────
    try:
        audio_info       = MP3(local_file)
        duration_seconds = audio_info.info.length
        print(f"  Audio duration: {duration_seconds:.1f}s")
    except Exception as e:
        os.remove(local_file)
        return None, 0, [], f"Failed to read audio duration: {e}"

    # ── Upload to S3 ──────────────────────────────────────────────────────
    try:
        s3      = boto3.client("s3", region_name="us-east-1")
        s3_key  = f"voiceovers/voice_{int(time.time())}_{random.randint(1000,9999)}.mp3"
        s3.upload_file(local_file, BUCKET_NAME, s3_key, ExtraArgs={"ContentType": "audio/mpeg"})
        presigned_url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": BUCKET_NAME, "Key": s3_key},
            ExpiresIn=172800,  # 48h — consistent with all other S3 URLs
        )
    except Exception as e:
        os.remove(local_file)
        return None, 0, [], f"S3 upload failed: {e}"
    finally:
        if os.path.exists(local_file):
            os.remove(local_file)

    return presigned_url, duration_seconds, word_timestamps, None