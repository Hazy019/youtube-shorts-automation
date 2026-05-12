"""
tts.py — Text-to-Speech Engine v13 (Edge-TTS Only)
----------------------------------------------------
PRIMARY:  Edge-TTS (free, unlimited, high-speed) with voice retry
FALLBACK: None — ElevenLabs removed (no subscription)

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

RETRY LOGIC:
  If a voice returns "No audio was received", the engine will automatically
  retry with the next available voice in the pool (up to MAX_TTS_RETRIES).
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

# Maximum number of Edge-TTS voice retries before giving up
MAX_TTS_RETRIES = 3

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
    audio_bytes = 0
    with open(output_file, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
                audio_bytes += len(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                # Edge-TTS offset is in 100-nanosecond ticks → convert to seconds
                word_boundaries.append({
                    "word":     chunk["text"],
                    "start":    round(chunk["offset"]   / 10_000_000, 3),
                    "duration": round(chunk["duration"] / 10_000_000, 3),
                })

    if audio_bytes == 0:
        raise ValueError("No audio was received from Edge-TTS (0 bytes returned).")

    return word_boundaries


def _pick_edge_voice(category: str, exclude: list = None) -> dict:
    """
    Pick the best Edge-TTS voice for the category, excluding already-tried voices.
    Prioritizes the most human-sounding voices per content type.
    Gaming: energetic (Jason). General/Science: deep storytelling (Steffan, Davis).
    US-Centric: dramatic and authoritative (Davis, Tony).
    """
    exclude = exclude or []
    exclude_names = {v["name"] for v in exclude}

    if category == "us-centric":
        pool = [v for v in EDGE_TTS_VOICES if ("Davis" in v["name"] or "Tony" in v["name"]) and v["name"] not in exclude_names]
    else:
        pool = [v for v in EDGE_TTS_VOICES if ("Steffan" in v["name"] or "Tony" in v["name"] or "Brian" in v["name"]) and v["name"] not in exclude_names]

    # If preferred pool is exhausted, fall back to any remaining voice
    if not pool:
        pool = [v for v in EDGE_TTS_VOICES if v["name"] not in exclude_names]

    return random.choice(pool) if pool else None


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
    Generate a voiceover MP3 using Edge-TTS, upload to S3, and return a presigned URL.

    Returns: (url: str | None, duration_seconds: float, word_timestamps: list, error: str | None)
    word_timestamps is a list of {word, start, duration} dicts for karaoke captions.
    Always unpack all four values.

    Retry logic: if a voice fails with "No audio was received", the engine
    automatically retries with a different voice from the pool (up to MAX_TTS_RETRIES).
    """
    local_file = f"temp_voice_{int(time.time())}.mp3"
    word_timestamps = []  # populated by Edge-TTS WordBoundary events
    tried_voices = []
    last_error = None

    # ── Edge-TTS with retry on different voices ──────────────────────────────
    for attempt in range(1, MAX_TTS_RETRIES + 1):
        voice_config = _pick_edge_voice(category, exclude=tried_voices)
        if not voice_config:
            print(f"  Edge-TTS: All voices exhausted after {attempt - 1} attempt(s).")
            break

        tried_voices.append(voice_config)
        print(f"  Edge-TTS attempt {attempt}/{MAX_TTS_RETRIES}: {voice_config['name']} rate={voice_config['rate']} pitch={voice_config['pitch']}")

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
            last_error = f"Edge-TTS timed out on voice {voice_config['name']}."
            print(f"  ⚠ {last_error} Retrying with next voice...")
            # Kill dangling file if it exists
            if os.path.exists(local_file):
                try: os.remove(local_file)
                except: pass
            continue

        if tts_error:
            last_error = f"Edge-TTS voice {voice_config['name']} failed: {tts_error}"
            print(f"  ⚠ {last_error} Retrying with next voice...")
            if os.path.exists(local_file):
                try: os.remove(local_file)
                except: pass
            continue

        # Success — file written, break out of retry loop
        print(f"  Edge-TTS success on attempt {attempt} with voice {voice_config['name']}!")
        break

    else:
        # All retries exhausted
        err = f"Edge-TTS failed on all {MAX_TTS_RETRIES} attempts. Last error: {last_error}"
        print(f"\n  FATAL: {err}")
        ping_error(err, "Edge-TTS Engine")
        return None, 0, [], err

    # Final check: if file still doesn't exist after the loop
    if not os.path.exists(local_file):
        err = f"Edge-TTS failed on all {MAX_TTS_RETRIES} attempts. Last error: {last_error}"
        print(f"\n  FATAL: {err}")
        ping_error(err, "Edge-TTS Engine")
        return None, 0, [], err

    # ── Validate file size ────────────────────────────────────────────────
    if os.path.getsize(local_file) < 1000:
        return None, 0, [], "Audio file too small after TTS generation — likely an empty response."

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