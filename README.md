# Hazy Chanel Automator
**Professional Short-Form Video Factory for YouTube Shorts & Meta Reels**

Hazy Chanel Automator is a state-of-the-art, fully automated video production pipeline. It integrates cutting-edge AI (Gemini, Edge-TTS) with cloud-scale rendering (AWS Lambda, Remotion) to produce high-retention (45–60s) short-form content with zero human intervention.

This system is built to produce videos for **two independent brands simultaneously**:
1. **Hazy Insight (General)** — Deeply obscure and mind-blowing science, history, and psychology.
2. **Hazy US (US-Centric)** — High-energy US-centric facts, cultural anomalies, and American history.

---

## The Tech Stack (What powers this?)

To achieve 100% automation without melting your local laptop, this pipeline uses a highly specialized cloud architecture:

### 1. The "Brain" (Google Gemini 3 Flash)
- We use **Gemini API** as the creative director. We feed it strict prompt engineering to force it to write accurate, highly-specific scripts.
- **Why no "AI Slop"?** We enforce an "Anti-Hallucination Protocol" and strict JSON schema rules so Gemini never generates repetitive, boring lists.

### 2. The "Voice" (Microsoft Edge-TTS)
- We use **Edge-TTS** (a reverse-engineered Microsoft Azure Neural API) because it provides premium, ultra-realistic voices (like *Steffan* and *Davis*) completely for free, with no character limits.
- **ElevenLabs** is included only as a safety net (fallback) if Edge-TTS servers ever go offline.

### 3. The "Editor" (Remotion + AWS Lambda)
- Video rendering is the heaviest part of any pipeline. Instead of rendering locally, we use **Remotion**, which turns React code into MP4 videos.
- We deploy this to **AWS Lambda**. When the bot says "Dispatching to Lambda", it's renting Amazon's massive cloud servers for 60 seconds to stitch the video together at lightning speed.
- This allows us to render 2, 5, or 10 videos simultaneously without your PC breaking a sweat.

### 4. The "Orchestrator" (Python ThreadPoolExecutor)
- The core Python script uses a **Thread Pool** (similar to what you called a heap map) to run tasks sequentially or in parallel. 
- We execute channels **sequentially** (`max_workers=1`) to prevent hitting AWS Lambda's maximum concurrency limits. This guarantees perfect stability.

### 5. The "Database & Queue" (Supabase)
- We use **Supabase** (a cloud PostgreSQL database) to track which videos have been uploaded to YouTube, and to queue them up for cross-posting to Facebook and Instagram.

---

## Setup & Installation

### Step 1 — Clone & Install Dependencies
```bash
git clone https://github.com/Hazy019/youtube-shorts-automator.git
cd youtube-shorts-automator
pip install -r requirements.txt
```

### Step 2 — Configure Environment Variables
Create a `.env` file in the project root.
```env
# ── AI Services ──────────────────────────────
GEMINI_API_KEY="your_gemini_api_key_here"
PEXELS_API_KEY="your_pexels_api_key_here"
# ElevenLabs is optional fallback only
ELEVENLABS_API_KEY="your_elevenlabs_api_key_here"

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
SFX_FOLDER_ID="your_sfx_folder_id"
GENERAL_BGM_FOLDER_ID="your_general_bgm_folder_id"
SCIENCE_BROLL_FOLDER_ID="your_science_broll_folder_id"
HISTORY_BROLL_FOLDER_ID="your_history_broll_folder_id"
```

### Step 3 — GitHub Actions (Autopilot)
The pipeline is designed to run automatically via **GitHub Actions**.
1. Go to your repository settings on GitHub.
2. Under **Secrets and variables → Actions**, add all your `.env` variables as Repository Secrets.
3. Add your `token_youtube_hazy.json` and `token_youtube_us.json` contents as secrets `TOKEN_YOUTUBE_HAZY` and `TOKEN_YOUTUBE_US`.
4. The GitHub cron job will now wake up automatically at 6:30 AM and 6:30 PM Eastern Time to produce and schedule your videos.

---

## Operational Workflow

### Run the Factory Locally
```bash
python run_factory.py
```
1. **API Pre-Flight**: Validates all secrets and quotas (aborts instantly if Pexels is dead).
2. **Sequential Production**: Processes `Hazy Insight` completely, then processes `Hazy US`.
3. **Cloud Render**: Renders the video on AWS Lambda.
4. **YouTube Scheduled Upload**: Uploads the video as *Private* with a `publishAt` timestamp (7:00 AM/PM ET) so the algorithm hits it right at prime time.
5. **Meta Cross-Post**: Publishes the video directly to Facebook and Instagram Reels.
6. **Discord Alert**: Pings your phone with the success metrics and links.

---

## System Resilience (v14 Parallel Architecture)
- **Pre-Flight Gatekeeper**: If critical APIs are broken, the system terminates in <1s before wasting any cloud rendering budget.
- **Stitch-Free Assembly**: The 45-60s videos are assembled flawlessly in the cloud to prevent dropped frames.
- **Cost-Efficiency**: Replaced paid APIs (like ElevenLabs) with premium free alternatives (Edge-TTS) as primary drivers.

**Version 14 (Multi-Channel Automation)** — *Solo Project by Hazy.*
