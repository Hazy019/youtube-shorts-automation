import os
import re
import json
import time
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

# ══════════════════════════════════════════════════════════════════
# VERIFIED MODEL IDs — from your Google AI Studio dashboard
# (Hazy-chanel-bot project, April 2026 screenshot)
#
# ACTIVE models on your account:
#   gemini-3-flash-preview        →  5 RPM,  20 RPD  (best quality)
#   gemini-2.5-flash              →  5 RPM,  20 RPD  (great quality)
#   gemini-2.5-flash-lite          → 10 RPM,  20 RPD  (good quality)
#   gemini-3.1-flash-lite-preview → 15 RPM, 500 RPD  (best fallback volume)
#
# DEAD models on your account (limit: 0 — never call these):
#   ✗ gemini-2.0-flash
#   ✗ gemini-2.0-flash-lite
# ══════════════════════════════════════════════════════════════════
MODELS = [
    "gemini-3-flash-preview",          # best quality,  5 RPM,  20 RPD
    "gemini-2.5-flash",                # great quality, 5 RPM,  20 RPD
    "gemini-2.5-flash-lite",           # good quality, 10 RPM,  20 RPD
    "gemini-3.1-flash-lite-preview",   # 500 RPD — high-volume last-resort
]

RPM_RETRIES_PER_MODEL = 3   # max waits on RPM before moving to next model
MAX_503_RETRIES       = 3   # max retries on 503 (capacity) before skipping model
BASE_503_WAIT         = 20  # seconds — doubles each retry: 20, 40, 80


def _parse_retry_delay(err_str: str) -> int:
    """Extract retryDelay from Gemini error body. Default 65s."""
    m = re.search(r"retryDelay[': ]+([0-9]+)s", err_str)
    return int(m.group(1)) + 5 if m else 65


def _is_daily_quota_exhausted(err_str: str) -> bool:
    """
    True when the daily quota is genuinely gone — meaning waiting won't help.

    Two cases:
      1. 'limit: 0'      → model is deprecated/disabled on this account.
      2. PerDay violation with retryDelay > 3600s → quota resets tomorrow.

    A short retryDelay (seconds) with a 429 = RPM hit only. That IS
    recoverable by waiting, so we return False for those.
    """
    has_zero_limit = "limit: 0" in err_str
    has_per_day    = "PerDay" in err_str or "per_day" in err_str.lower()
    delay          = _parse_retry_delay(err_str)
    return has_zero_limit or (has_per_day and delay > 3600)


_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise EnvironmentError("GEMINI_API_KEY not found in environment.")
client = genai.Client(api_key=_api_key)

_supabase = None


def _get_supabase():
    global _supabase
    if _supabase is None:
        try:
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_KEY")
            if url and key:
                _supabase = create_client(url, key)
        except Exception as e:
            print(f"Supabase init failed (non-fatal): {e}")
    return _supabase


def with_supabase_retry(operation, max_attempts=3):
    """Wrapper to handle transient network issues with Supabase."""
    for attempt in range(max_attempts):
        try:
            return operation.execute()
        except Exception as e:
            if attempt == max_attempts - 1:
                raise e
            print(f"  Supabase error (attempt {attempt+1}/{max_attempts}): {e}. Retrying...")
            time.sleep(2)



def clean_json_response(text):
    text = text.strip()
    for prefix in ("```json", "```"):
        if text.startswith(prefix):
            text = text[len(prefix):]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def validate_full_package(data):
    required = ["topic", "search_keyword", "backup_keywords", "title",
                "description", "segments", "tags"]
    if not all(k in data for k in required):
        return False, f"Missing keys — found {list(data.keys())}"
    if not isinstance(data.get("backup_keywords", []), list):
        return False, "backup_keywords must be a list"
    if not isinstance(data["segments"], list) or len(data["segments"]) < 5:
        return False, f"Need >=5 segments, got {len(data.get('segments', []))}"
    seg_keys = ["start", "end", "text", "voiceover",
                "text_effect", "position", "highlight_word"]
    valid_effects = ("pop", "glitch", "typewriter")
    
    # ── Duration & Hook Validation ──────────────────────────────────────────
    for i, s in enumerate(data["segments"]):
        if not all(k in s for k in seg_keys):
            return False, f"Segment {i} missing keys: {list(s.keys())}"
        
        if s.get("text_effect") not in valid_effects:
            s["text_effect"] = "pop"

        # Force Hook constraints (Segment 0)
        if i == 0 and s.get("end", 99) > 3.5:
            s["end"] = 3.5
            if len(data["segments"]) > 1:
                data["segments"][1]["start"] = max(3.5, data["segments"][1].get("start", 3.5))

        # Force Shorts constraint (MAX 59.0s)
        # If any segment drifts past 59s, we truncate it and all subsequent segments.
        if s.get("start", 0) >= 59.0:
            print(f"  Warning: Truncating segment {i} (starts at {s['start']}s >= 59s)")
            data["segments"] = data["segments"][:i]
            break
        
        if s.get("end", 0) > 59.0:
            print(f"  Warning: Capping segment {i} end time at 59.0s (was {s['end']}s)")
            s["end"] = 59.0
            data["segments"] = data["segments"][:i+1] # This is the last valid segment
            break

    return True, None


def fetch_analytics_feedback():
    db = _get_supabase()
    if not db:
        return ""
    try:
        winners = (db.table("videos").select("topic, script")
                   .gte("avg_view_pct", 75)
                   .order("avg_view_pct", desc=True).limit(3).execute())
        losers  = (db.table("videos").select("topic, script")
                   .lt("avg_view_pct", 40)
                   .order("avg_view_pct", desc=False).limit(3).execute())
        feedback = ""
        if winners.data:
            feedback += f"\nHIGH RETENTION (emulate):\n{winners.data}"
        if losers.data:
            feedback += f"\nLOW RETENTION (avoid):\n{losers.data}"
        return feedback
    except Exception as e:
        print(f"Analytics feedback skipped: {e}")
        return ""


def fetch_used_topics():
    db = _get_supabase()
    if not db:
        return []
    try:
        rows = (db.table("videos").select("topic")
                .order("created_at", desc=True).limit(25).execute())
        return [v["topic"] for v in rows.data if v.get("topic")]
    except Exception as e:
        print(f"Topic fetch skipped: {e}")
        return []


# ══════════════════════════════════════════════════════════════════
# PROMPT SPLIT PATTERN — PREVENTS "Invalid format specifier" CRASH
#
# Python f-strings treat { } as format tokens. JSON uses { } for
# objects. Mixing them causes: Invalid format specifier '0.0, "end"...'
#
# Fix: _JSON_SCHEMA_EXAMPLE is a plain str constant — never inside
# an f-string. build_master_prompt() builds the dynamic f-string
# section, then concatenates the plain example at the end.
# The JSON can contain any { } and it will never crash Python.
# ══════════════════════════════════════════════════════════════════

_JSON_SCHEMA_EXAMPLE = """{
  "topic": "[DYNAMIC_TOPIC_HERE]",
  "search_keyword": "Parkour",
  "backup_keywords": ["Urban Freerunning", "City Rooftop"],
  "title": "[CATCHY_VIRAL_TITLE]",
  "description": "A long, SEO-optimized description that starts with a US-centric hook...",
  "tags": ["shorts","us-trends","gaming","facts","mind blown","actually crazy","retro gaming","history","explained"],
  "segments": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "THE HOOK",
      "voiceover": "[WRITE A SHOCKING 2-SECOND HOOK SPECIFIC TO THE TOPIC HERE. NEVER REPEAT OR REUSE OLD HOOKS.]",
      "text_effect": "pop",
      "position": "top",
      "highlight_word": "SECRET"
    },
    {
      "start": 2.5,
      "end": 7.0,
      "text": "STAY WATCHING",
      "voiceover": "[WRITE A RETENTION LINE HERE CONNECTING THE HOOK TO THE MAIN STORY. DO NOT USE GENERIC PHRASES.]",
      "text_effect": "typewriter",
      "position": "center",
      "highlight_word": "WATCHING"
    },
    {
      "start": 7.0,
      "end": 55.0,
      "text": "THE EVIDENCE",
      "voiceover": "[WRITE THE MAIN STORY/FACTS HERE. USE PUNCTUATION FOR BREATHING. BE HIGHLY SPECIFIC.]",
      "text_effect": "glitch",
      "position": "center",
      "highlight_word": "EVIDENCE"
    },
    {
      "start": 55.0,
      "end": 59.0,
      "text": "FOLLOW NOW",
      "voiceover": "[WRITE A QUICK OUTRO OR CALL TO ACTION RELEVANT TO THE TOPIC HERE.]",
      "text_effect": "pop",
      "position": "bottom",
      "highlight_word": "FOLLOW"
    }
  ]
}"""



def build_master_prompt(
    category: str,
    theme: str,
    examples: str,
    keyword_hint: str,
    sfx_style: str,
    pace_guide: str,
    forbidden_topics: str,
    analytics_feedback: str
) -> str:
    """
    Builds the Gemini prompt by concatenating an f-string (dynamic variables)
    with a plain string (JSON schema example). The plain string is never
    inside the f-string, so its curly braces cannot trigger format errors.
    """
    dynamic_section = f"""You are an expert YouTube Shorts scriptwriter and video producer.
Your job is to generate ONE complete production package as valid JSON.

CATEGORY: {category.upper()}
THEME: {theme}
SFX STYLE: {sfx_style}
PACING: {pace_guide}
TARGET: EXACTLY 45-50 second video for YouTube Shorts + TikTok. 
AUDIENCE: US-based (use US slang, US cultural references, and American-English).

ANALYTICS FEEDBACK:
{analytics_feedback if analytics_feedback else "No feedback yet — use YouTube Shorts best practices."}

DO NOT repeat these recent topics:
{forbidden_topics}

DO NOT USE THE "DOOM/MINECRAFT" TOPIC FROM THE EXAMPLE.

STYLE REFERENCE (match energy, do not copy topics):
{examples}

══════════════════════════════════════════════════════════
PART 1 — ANTI-HALLUCINATION PROTOCOL (HIGHEST PRIORITY)
══════════════════════════════════════════════════════════
This rule overrides everything else. Every single claim must be accurate.

P1. ONLY state facts you are certain are true. Zero invention, zero exaggeration.
P2. Every number, date, developer name, and game mechanic must be real and verifiable.
P3. If you are uncertain about a specific detail, OMIT it entirely. Do not guess.
P4. "Hidden", "secret", and "nobody knew" are only valid if the fact is genuinely obscure.
    Do not call mainstream knowledge obscure.
P5. Phonetic spelling for complex terms the AI voice may mispronounce:
    "May-lay" for Melee, "Zell-duh" for Zelda, "Rok-star" for Rockstar, etc.
    Include phonetic forms directly in the voiceover text.
P6. NO "AI SLOP". Do not write generic listicles or surface-level trivia that anyone could guess. Provide deep, specific context that shows real research. Respect the viewer's intelligence.

══════════════════════════════════════════════════════════
PART 2 — EDGE-TTS PUNCTUATION RULES (CRITICAL FOR VOICE)
══════════════════════════════════════════════════════════
The voiceover text is processed by an AI voice engine (Edge-TTS or ElevenLabs).
Heavy punctuation forces natural breathing and prevents robotic delivery.

V1. Use "..." (ellipsis) for dramatic pauses — 600ms of silence. Use 1-2 per segment.
V2. Use "," (comma) for natural breath pauses between thoughts.
V3. Use short sentence fragments for punch: "Nobody noticed. For two years."
    Edge-TTS handles fragments better than long compound sentences.
V4. NEVER write a sentence longer than 20 words without a comma or ellipsis inside it.
V5. Vary sentence length deliberately:
    GOOD: "Nobody knew. For exactly twenty years... a glitch sat inside the code, waiting."
    BAD:  "For a period of twenty years nobody discovered that a glitch existed inside the game's code."
V6. Use contractions always: "it's", "they've", "didn't", "can't", "you'd".
    Formal grammar sounds robotic. Contractions sound human.
V7. Include ONE colloquial phrase per video — naturally embedded, not forced:
    "and honestly, that's insane", "nobody talks about this", "wait, actually"
V8. NEVER start two consecutive sentences with the same word.

══════════════════════════════════════════════════════════
PART 3 — PRODUCTION RULES
══════════════════════════════════════════════════════════

R1.  topic ends in "..." — triggers curiosity or disbelief.
R2.  No emojis anywhere in the JSON.
R3.  description: 400+ words. Conversational opener first, then SEO. 3+ hashtags.
     ROTATE openers every video — never use the same opener twice.
R4.  tags: exactly 15 lowercase strings. At least 4 must be colloquial.
R5.  segments: EXACTLY 5 to 7 total. (Rejection if less than 5).
R6.  TOTAL WORD COUNT LIMIT: 100 to 115 words total across all segments.
     Duration calculation: Each ellipsis "..." adds 0.6s of silence. 
     Your target is EXACTLY 48.0 seconds. Do not exceed 115 words.
     Match start/end timing exactly. Each segment.end must equal next segment.start.
R7.  text (on-screen caption): 1-3 WORDS ONLY. Never a full sentence.
R8.  voiceover and text say DIFFERENT things. Caption = punchline/label. Voiceover = explanation.
R9.  text_effect: "pop" = confident reveal, "glitch" = shocking fact, "typewriter" = tension.
R10. position: "top" or "center" for body segments. "bottom" for CTA only.
R11. highlight_word: one exact word from text. Renders WHITE. Others render gold.
R12. SEGMENT 0 (Hook):
     - end <= 3.0s
     - text_effect = "pop", position = "top"
     - Voiceover max 15 words with an ellipsis mid-sentence for breath
     - MUST use ONE of these proven openers — ROTATE every video, never repeat:
       "Nobody noticed...", "For years...", "Hidden inside...",
       "This should be impossible...", "Wait, actually...",
       "They never told you...", "It happened overnight...",
       "Most people get this wrong...", "The government actually...",
       "Science just confirmed...", "Right before it disappeared...",
       "Everybody missed this..."
R13. SEGMENT 1 (Tease):
     - text_effect = "typewriter", position = "center"
     - Must contain "stay till the end" or equivalent retention phrase
     - Include ellipsis before the payoff.
R14. LAST SEGMENT (CTA):
     - end MUST BE 59.0
     - text_effect = "pop", position = "bottom"
     - ROTATE the CTA phrase.
R15. search_keyword: {keyword_hint}
R16. backup_keywords: list of 2 alternative Pexels search terms.
R17. TOPIC FORMULA — use one of these proven high-retention structures.

Return ONLY the JSON object. No preamble, no markdown, no explanation.
"""

    # Plain string concatenation — no f-string interpolation.
    # JSON curly braces are safe here.
    return dynamic_section + _JSON_SCHEMA_EXAMPLE


def generate_full_package(category, local_excludes=None):
    """
    Generates a complete video production package via Gemini.

    Error handling strategy:
      503 UNAVAILABLE  → capacity overload, NOT quota. Retry same model
                         with exponential backoff up to MAX_503_RETRIES.
      429 RPM limit    → wait the suggested retryDelay, retry same model.
      429 daily quota  → skip to next model immediately (no wait will help).
      404 NOT_FOUND    → model string invalid, skip immediately.
      Auth error       → fatal, raise immediately.
    """
    used_topics = fetch_used_topics()
    if local_excludes:
        used_topics.extend(local_excludes)
    used_topics = used_topics[:20]
    feedback     = fetch_analytics_feedback()

    if category == "us-centric":
        theme        = "High-energy US-centric facts, cultural anomalies, and American history with relatable humor and slang."
        examples     = (
            "- The secret physics of the Great Molasses Flood that shut down Boston...\\n"
            "- Why the US government actually tried to outlaw pinball for 30 years...\\n"
            "- The hidden US law that makes it illegal to collect rainwater in some states...\\n"
            "- The American-centric hook: 'Imagine a sticky situation so bad, it shut down a whole city...'\\n"
            "- The untold story of why US milk cartons used to have missing person photos..."
        )
        keyword_hint = 'Return a 2-3 word Pexels/Pixabay search term matching a US city, landmark, cultural item, or historical setting (e.g., "Times Square Night", "American Flag", "Capitol Building", "New Orleans Jazz"). Be specific — avoid generic terms.'
        sfx_style    = "punchy, urban, modern US style — pop and whoosh"
        pace_guide   = "High energy. Use US slang and cultural references. Hook must be relatable to American experiences."
        
        # Inject the specific user feedback for US retention
        feedback += "\nUS RETENTION STRATEGY: Inject relatable US cultural references and language. Instead of generic hooks, tailor them to American experiences and humor. Use hooks like: 'Imagine a sticky situation so bad, it shut down a whole city... no, not rush hour traffic...'"
    else:
        theme        = "DEEPLY OBSCURE and MIND-BLOWING science, history, and psychology. NO SURFACE-LEVEL TRIVIA. The facts must be so niche and thoroughly researched that even experts would be surprised. DO NOT generate 'AI slop' listicles."
        examples     = (
            "- Why a 19th-century solar storm caused telegraph machines to send messages while completely unplugged...\\n"
            "- The classified Soviet project that accidentally created a lake so radioactive it could kill you in one hour...\\n"
            "- The bizarre psychological condition where the brain perceives loved ones as identical imposters (Capgras delusion)...\\n"
            "- How the CIA spent 20 million dollars training acoustic kitty spies, only for the first cat to be hit by a taxi...\\n"
            "- The physiological reason why human tears have different crystal structures depending on the emotion that caused them..."
        )
        keyword_hint = (
            "A STRICTLY RELEVANT 2-word Pexels video search term that visually matches the topic.\\n"
            "Space/astronomy -> 'Space Nebula'. Ocean -> 'Deep Ocean'. Brain -> 'Human Brain'.\\n"
            "History -> 'Ancient Ruins'. Biology -> 'Microscope Cell'. Abstract/Tech -> 'Abstract Data'.\\n"
            "DO NOT default to 'Parkour' or generic gameplay. The B-roll MUST visually represent the topic.\\n"
            "Return ONLY the 2-word keyword. Also provide 2 highly specific backup_keywords."
        )
        sfx_style    = "cinematic, atmospheric — riser, whoosh, and subtle heartbeat effects for tension"
        pace_guide   = "Build tension slowly but keep cuts fast. Drop the fact. Let voiceover breathe slightly, but maintain momentum."

    forbidden_str = str(used_topics) if used_topics else "[]"

    prompt = build_master_prompt(
        category=category,
        theme=theme,
        examples=examples,
        keyword_hint=keyword_hint,
        sfx_style=sfx_style,
        pace_guide=pace_guide,
        forbidden_topics=forbidden_str,
        analytics_feedback=feedback,
    )

    time.sleep(3)  # burst protection before first call
    last_err = "No attempts made"

    for model_id in MODELS:
        consecutive_503 = 0  # reset per model

        for rpm_attempt in range(RPM_RETRIES_PER_MODEL):
            try:
                if rpm_attempt == 0:
                    print(f"Brain [{model_id}]")
                else:
                    print(f"Brain [{model_id}] (RPM retry {rpm_attempt}/{RPM_RETRIES_PER_MODEL - 1})")

                response = client.models.generate_content(
                    model=model_id,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.85,
                        response_mime_type="application/json"
                    )
                )

                if not response or not response.text:
                    last_err = f"Empty/blocked response from {model_id}"
                    print(f"  Warning: {last_err} — trying next model")
                    break

                package = json.loads(clean_json_response(response.text))
                ok, reason = validate_full_package(package)
                if not ok:
                    last_err = f"Validation failed: {reason}"
                    print(f"  Warning: {last_err} — trying next model")
                    break

                # ── DOOM REPETITION SAFETY CHECK ────────────────────────────
                generated_topic = package.get("topic", "").lower()
                if "doom" in generated_topic and "minecraft" in generated_topic:
                    last_err = "Model returned the 'Doom/Minecraft' example topic."
                    print(f"  Warning: {last_err} — forcing retry with next model.")
                    # Add to excludes so it doesn't happen again
                    used_topics.append(package.get("topic"))
                    break

                # Persist to Supabase (non-fatal if it fails)
                db = _get_supabase()
                if db:
                    try:
                        full_script = " ".join(s["voiceover"] for s in package["segments"])
                        with_supabase_retry(
                            db.table("videos").insert({
                                "topic":  package["topic"],
                                "title":  package["title"],
                                "script": full_script,
                                "tiktok_status": "INITIALIZED", # Prevent auto-queuing before render
                            })
                        )
                    except Exception as e:
                        print(f"  Supabase insert skipped: {e}")

                print(f"  Topic: {package['topic'][:70]}")
                print(f"  B-roll keyword: {package.get('search_keyword', '?')}")
                return package  # ✅ SUCCESS

            except json.JSONDecodeError as e:
                last_err = f"JSON parse error: {e}"
                print(f"  {model_id}: Bad JSON — trying next model")
                break

            except Exception as e:
                last_err = str(e)
                upper    = last_err.upper()

                # ── Fatal auth errors — never retry ─────────────────────────
                if "API_KEY" in upper or "INVALID" in upper or "PERMISSION" in upper:
                    raise RuntimeError(f"Gemini auth error: {last_err}")

                # ── 503: Capacity overload — NOT a quota issue ───────────────
                # This model is busy, not out of quota. Retry with backoff.
                # Each 503 retry does NOT consume an rpm_attempt slot.
                if "503" in upper or "UNAVAILABLE" in upper:
                    consecutive_503 += 1
                    if consecutive_503 <= MAX_503_RETRIES:
                        wait = BASE_503_WAIT * (2 ** (consecutive_503 - 1))
                        print(f"  {model_id}: Overloaded (503) — waiting {wait}s, retry {consecutive_503}/{MAX_503_RETRIES}...")
                        time.sleep(wait)
                        continue  # retry same model without burning rpm_attempt
                    else:
                        print(f"  {model_id}: Still overloaded after {MAX_503_RETRIES} retries — trying next model.")
                        break

                # ── 429: Quota issues ────────────────────────────────────────
                if "429" in upper or "RESOURCE_EXHAUSTED" in upper:

                    # Daily/disabled quota: no wait will fix this today
                    if _is_daily_quota_exhausted(last_err):
                        print(f"  {model_id}: Daily quota exhausted or model disabled — trying next model.")
                        break

                    # RPM limit: wait the suggested delay and retry same model
                    wait = _parse_retry_delay(last_err)
                    if rpm_attempt < RPM_RETRIES_PER_MODEL - 1:
                        print(f"  {model_id}: RPM limit — waiting {wait}s then retrying...")
                        time.sleep(wait)
                        # loop continues to next rpm_attempt
                    else:
                        print(f"  {model_id}: RPM retries exhausted — trying next model.")
                        time.sleep(5)
                        break

                elif "404" in upper or "NOT_FOUND" in upper:
                    print(f"  {model_id}: Model not found (404) — trying next model.")
                    time.sleep(2)
                    break

                else:
                    print(f"  {model_id}: Unexpected error: {last_err[:120]} — trying next model.")
                    time.sleep(5)
                    break

    raise RuntimeError(f"Gemini: All models exhausted. Last error: {last_err}")