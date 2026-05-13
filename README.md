# 🌌 Hazy Content Factory v14
**Enterprise-Grade Automated Video Production for Short-Form Media**

![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen)
![Tech](https://img.shields.io/badge/Stack-Python%20|%20Remotion%20|%20AWS%20|%20Gemini-blue)

Hazy Content Factory is a high-performance, cloud-native automated production pipeline. It leverages Large Language Models (LLMs) and distributed cloud rendering to syndicate high-retention (45–60s) video content across YouTube, TikTok, and Meta.

## 🚀 Key Features
*   **Multi-Channel Isolation**: Independent "Brain" logic for general science (Hazy Insight) and US-centric content (Hazy US).
*   **Self-Healing Pipeline**: Integrated Supabase recovery system that automatically resumes failed renders/uploads.
*   **Cinematic Rendering**: Dynamic Ken Burns engine with randomized zoom/drift and word-level karaoke captions.
*   **Anti-AI Slop Protocol**: Specialized prompt engineering to eliminate robotic vocabulary and repetitive hooks.
*   **Zero-Footprint Execution**: Serverless rendering via AWS Lambda—scale from 1 to 100 videos without local hardware.

## 🛠️ Tech Stack
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Orchestrator** | Python 3.12 | Threaded workflow management & API coordination |
| **Intelligence** | Google Gemini 3 Flash | Script synthesis & Metadata generation |
| **Audio** | Microsoft Edge-TTS | Ultra-realistic neural speech synthesis |
| **Graphics** | Remotion (React) | Programmatic video composition |
| **Infrastructure** | AWS Lambda / S3 | Distributed rendering & Asset storage |
| **Database** | Supabase (PostgreSQL) | State management & Recovery tracking |

## 📦 Installation
```bash
git clone https://github.com/Hazy019/youtube-shorts-automator.git
pip install -r requirements.txt
```

## ⚙️ Configuration
The system requires a `.env` file with the following keys:
*   `GEMINI_API_KEY`: LLM Access.
*   `SUPABASE_URL` / `KEY`: Persistence layer.
*   `AWS_ACCESS_KEY` / `SECRET`: Cloud rendering.
*   `PEXELS_API_KEY`: B-Roll sourcing.

## 🔄 Workflow
1.  **Ingestion**: Check Supabase for unrecovered/failed topics.
2.  **Synthesis**: Gemini generates a structured JSON "Viral Package."
3.  **Voiceover**: Neural TTS generation with word-boundary tracking.
4.  **B-Roll Sourcing**: Hierarchical search (Pexels -> Pixabay -> AI Archive).
5.  **Cloud Render**: Dispatch to AWS Lambda for React-based stitching.
6.  **Syndication**: Parallel upload to YouTube, TikTok, and Meta.
7.  **Telemetry**: Discord alert with performance metrics.

---
*Maintained by Hazy. Designed for scale.*
