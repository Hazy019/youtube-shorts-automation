# Hazy Chanel Automator
**Professional Short-Form Video Factory for YouTube Shorts (High-Concurrency Cloud Production)**

Hazy Chanel Automator is a state-of-the-art, fully automated video production pipeline. It integrates cutting-edge AI (Gemini, ElevenLabs) with cloud-scale rendering (AWS Lambda, Remotion) to produce high-retention (90–120s) YouTube Shorts and TikToks with zero human intervention.

> **See it in action**: [Hazy Chanel on YouTube](https://www.youtube.com/channel/UCize2SQoXPI6RFQYbIGemIg) — this channel is fully powered by this pipeline.

> **Privacy Notice**: This project requires API keys from multiple third-party services. Never expose your `.env` file or commit it to a public repository. Your `.env` is listed in `.gitignore` by default.

---

## The Anti-Detection Pipeline (v13)

Version 13 addresses viewer feedback regarding "AI voice" patterns and "horrible FPS". It implements a multi-layered anti-detection strategy and single-chunk rendering for maximum visual fluidity:

### 1. Anti-Detection Brain (`src/ai/brain.py`)
- **Anti-Hallucination Protocol**: Strict rules forcing Gemini to verify facts, numbers, and names. Zero invention allowed.
- **Phonetic Spelling**: Script-level phonetic overrides (e.g., "May-lay" for Melee) to ensure the AI voice never mispronounces industry terms.
- **Punctuation Orchestration**: Uses dramatic ellipses (`...`), breath-pause commas, and sentence fragments to break robotic speech patterns.
- **Opener & CTA Rotation**: Automatically rotates between 3+ templates for descriptions, hook openers, and call-to-action phrases to avoid platform pattern-matching.

### 2. Voice Rotation Pool (`src/ai/tts.py`)
- **Christopher Retired**: The "Standard AI Voice" (ChristopherNeural) is permanently retired.
- **Dynamic Pool**: Rotates between `AndrewNeural`, `GuyNeural`, `EricNeural`, and `RyanNeural` (British) based on video category.
- **Premium Tuning**: ElevenLabs stability lowered to 0.45 and style increased to 0.30 for natural human-like expressiveness.

### 3. Single-Chunk Fluidity (`src/media/builder.py`)
- **FPS Fix**: Moved from chunked rendering to single-shot assembly. The entire 90-120s video is rendered as one continuous frame sequence.
- **Stitch-Free**: Eliminates frame drops and "stuttering" previously caused by joining separate video chunks.
- **No-Timeout Logic**: Optimized for the 600s AWS Lambda hard limit, ensuring 120s videos render in ~180s.

---

## Prerequisites

Before getting started, ensure you have accounts and API keys for:

| Service | Purpose | Link |
| :--- | :--- | :--- |
| **Google AI Studio** | Gemini API for script generation | [aistudio.google.com](https://aistudio.google.com) |
| **ElevenLabs** | Premium neural text-to-speech | [elevenlabs.io](https://elevenlabs.io) |
| **Pexels** | Free stock footage API | [pexels.com/api](https://www.pexels.com/api/) |
| **AWS** | Lambda + S3 for cloud rendering | [aws.amazon.com](https://aws.amazon.com) |
| **Supabase** | Database for state and queue management | [supabase.com](https://supabase.com) |
| **Discord** | Webhook notifications | [discord.com/developers](https://discord.com/developers) |
| **Google Cloud** | YouTube Data API + Drive API | [console.cloud.google.com](https://console.cloud.google.com) |

You will also need:
- **Python 3.10+**
- **Node.js 18+** (for the Remotion cloud renderer)
- **AWS CLI** configured with IAM credentials that have S3 and Lambda permissions

---

## Setup & Installation

### Step 1 — Clone & Install Python Dependencies
```bash
git clone https://github.com/Hazy019/youtube-shorts-automator.git
cd youtube-shorts-automator
pip install -r requirements.txt
```

### Step 2 — Configure Environment Variables
Create a `.env` file in the project root. Copy the template below and fill in your own values:
```env
# ── AI Services ──────────────────────────────
GEMINI_API_KEY="your_gemini_api_key_here"
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"
PEXELS_API_KEY="your_pexels_api_key_here"

# ── AWS Rendering ─────────────────────────────
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
BUCKET_NAME="your_remotion_lambda_s3_bucket_name"
SERVE_URL="https://your-bucket.s3.your-region.amazonaws.com/sites/your-site/index.html"
FUNCTION_NAME="your_deployed_remotion_function_name"

# ── Database ──────────────────────────────────
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_KEY="your_supabase_public_key"

# ── Google Drive Asset Folders ────────────────
# These are the Folder IDs from the Google Drive URL of each asset folder
PARKOUR_FOLDER_ID="your_google_drive_parkour_folder_id"
SFX_FOLDER_ID="your_sfx_folder_id"
BGM_FOLDER_ID="your_bgm_folder_id"
GAMING_BGM_FOLDER_ID="your_gaming_bgm_folder_id"
GENERAL_BGM_FOLDER_ID="your_general_bgm_folder_id"

# ── Discord Webhooks ──────────────────────────
# Create separate webhooks in your Discord server settings for each channel:
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
WEBHOOK_LOGS="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
WEBHOOK_ERRORS="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
WEBHOOK_POSTS="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
WEBHOOK_INSIGHTS="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"
WEBHOOK_QUEUE="https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN"

# ── Discord Ping ──────────────────────────────
# Enable Developer Mode in Discord, then right-click your username → Copy User ID
DISCORD_PING_USER_ID="your_discord_numeric_user_id"
```

> **Never share your `.env` file.** It contains private API keys that grant full access to your cloud account, database, and social media platforms. It is already listed in `.gitignore` — keep it that way.

### Step 3 — Authenticate Google APIs
Run the following to generate your OAuth tokens for YouTube and Google Drive:
```bash
python tools/update_tokens.py
```
This will open a browser window asking you to authorize both the YouTube Data API and the Google Drive API. Two token files will be saved locally:
- `token_youtube.json` — used for video uploads and engagement comments.
- `token_drive.json` — used to fetch b-roll and audio assets from your Drive folders.

> These token files contain private OAuth credentials. Do not commit them to version control.

### Step 4 — Deploy the Remotion Lambda Function
Follow the [Remotion Lambda Setup Guide](https://www.remotion.dev/docs/lambda) to deploy your render function to AWS. Once deployed, paste the function name and S3 serve URL into your `.env`.

---

## Operational Workflow

### Step 1: Run the Production Factory
```bash
python run_factory.py
```
- The bot will select a daily category (Gaming or General).
- It will sync b-roll (showing **transfer progress %** and **MB sizes**).
- It will initiate the AWS Lambda render (tracking **real-time % progress** in your console).
- It will upload to YouTube with an SEO-optimized title, description, and tags.
- It will automatically post and pin an engagement comment on the video.
- It will **ping you on Discord** when the full cycle is complete.
- The video's S3 link and TikTok caption are saved to Supabase as `PENDING`.

### Step 2: Post to TikTok (Local)
Because TikTok uploads require a real browser session and captcha solving, the pipeline queues videos in Supabase instead of uploading from the cloud. When you're ready to post:
```bash
python tools/bulk_tiktok_poster.py
```
- Drains all `PENDING` videos from the Supabase queue one by one.
- Opens a local browser session (with captcha support) to complete the upload.
- Upon success, marks each video as `SUCCESS` in Supabase.
- Sends a **"Video Posted to TikTok"** ping to your Discord `#factory-queue` channel for each video.
- Sends a final **"Queue Fully Processed"** summary when done.

### Step 3: Run the Professional Daily Report
```bash
python -m src.utils.youtube_discord_report
```
- Fetches real-time channel statistics (Subscribers, Total Views).
- Pulls metrics for your 3 most recent uploads.
- **AI Professional Analysis**: Uses Gemini to analyze performance fluctuations and provides two concrete strategic recommendations for your next topics and hooks to maximize retention.

---

## Maintenance & Features

### Real-Time Transparency
The factory provides full feedback during the "Syncing" phase. You will see exactly how much data is being transferred and the % progress of each clip being mirrored from Google Drive to S3.

### Self-Recovery
If AWS Lambda is busy or your account hits a burst limit, the bot will notify you in the console, wait for a 60-second cooldown, and retry the entire render automatically (up to 4 times with exponential backoff).

### Discord Notifications
Monitor your production pipeline entirely through Discord. You will receive:
- 🏗️ **Factory Start** alerts — so you know production has begun.
- ✅ **Production Complete** summaries with a **direct ping** to notify you.
- 📊 **Professional Daily Analytics** with AI-driven topic and hook analysis.
- ✅ **Video Posted to TikTok** alerts from the bulk poster.
- 🚨 **Emergency Alerts** with full error tracebacks for any service failures.

---

## Project Structure

```
youtube-shorts-automator/
├── run_factory.py                  # Main orchestrator — run this to produce a video
├── run_analytics.py                # Deep-dive Weekly Analytics (Retention & Geo)
├── src/
│   ├── ai/
│   │   ├── brain.py                # Gemini script generation with model failover
│   │   └── tts.py                  # ElevenLabs TTS + Microsoft Edge Neural TTS fallback
│   ├── api/
│   │   ├── youtube.py              # YouTube upload, engagement commenting & pinning
│   │   └── tiktok.py               # TikTok cookie auth + upload wrapper
│   ├── media/
│   │   ├── assets.py               # 5-tier B-roll hierarchy + Drive/S3/Pexels sync
│   │   └── builder.py              # AWS Lambda render orchestrator + dynamic chunking
│   └── utils/
│       ├── discord.py              # All Discord notification webhook functions
│       ├── analytics_core.py       # Weekly analytics logic (Retention & US Geo)
│       └── youtube_discord_report.py # Professional Daily Report + AI Strategic Analysis
├── tools/
│   ├── bulk_tiktok_poster.py       # Local TikTok queue drainer (Threaded-Sync Edition)
│   ├── update_tokens.py            # Google OAuth token refresher
│   └── capture_tiktok_cookies.py   # TikTok browser session capture tool
├── hazy-remotion-cloud/            # React + Remotion video engine source code
├── .env                            # ⚠️ Your private secrets — NEVER commit this
├── .gitignore
└── requirements.txt
```

---

**Version 13 (Anti-Detection Edition)** — *Solo Project by [Hazy Chanel](https://www.youtube.com/channel/UCize2SQoXPI6RFQYbIGemIg).*
