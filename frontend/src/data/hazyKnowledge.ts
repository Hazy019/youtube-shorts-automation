// ─── Hazy Factory Knowledge Base ─────────────────────────────────────────────
// Single source of truth for the Pipeline Assistant. Update this file to keep the chatbot accurate.
// The buildKnowledgeContext() function converts this into clean prose injected
// into every Gemini API call — no hallucinations, only verified facts.

export const HAZY_KNOWLEDGE_BASE = {
  system: {
    name: 'Hazy Content Factory',
    tagline: 'Fully automated, cloud-native short-form video production pipeline',
    status: 'Live and operational',
    uptime: '24/7 autonomous operation — zero human intervention after setup',
    website: 'https://hazyfactory.vercel.app',
    github: 'https://github.com/Hazy019/youtube-shorts-automator',
    youtube_channel: 'https://www.youtube.com/@Hazy_Insight/shorts',
  },

  creator: {
    name: 'Kyrell Santillan',
    alias: 'Hazy019',
    github: 'https://github.com/Hazy019',
    role: 'Aspiring Web Developer & Tech Generalist',
    contact_method: 'Use the "Scale Your Vision" contact form at the bottom of the website. Kyrell responds within 24 hours.',
  },

  pipeline: {
    overview: '6-stage, fully autonomous pipeline orchestrated by GitHub Actions — triggered on a schedule or code push. Zero human touchpoints after initialization.',
    stages: [
      {
        num: '01',
        name: 'Ingestion',
        tech: 'Supabase',
        detail: 'Topics are queued, deduplicated, and prioritized using Supabase as the state machine. Idempotency keys prevent any topic from being processed twice.',
      },
      {
        num: '02',
        name: 'Synthesis',
        tech: 'Google Gemini AI',
        detail: 'Gemini generates human-sounding video scripts using anti-AI-slop protocols — specific instructions that enforce natural, engaging writing rather than generic AI text.',
      },
      {
        num: '03',
        name: 'Voice',
        tech: 'Microsoft Edge-TTS',
        detail: 'Neural voice synthesis with millisecond word-boundary tracking. Every word is timestamped, enabling subtitle frames to sync with < 5ms drift.',
      },
      {
        num: '04',
        name: 'Render',
        tech: 'React Remotion v4 + AWS Lambda',
        detail: 'React Remotion stitches cinematic B-roll footage into the final video. Rendering runs entirely on AWS Lambda — serverless, with no local GPU or CPU required.',
      },
      {
        num: '05',
        name: 'Syndication',
        tech: 'YouTube API, TikTok API, Meta Graph API',
        detail: 'Parallel upload streams distribute the finished video to YouTube Shorts, TikTok, and Meta Reels simultaneously. A single render reaches all three platforms.',
      },
      {
        num: '06',
        name: 'CI/CD',
        tech: 'GitHub Actions',
        detail: 'GitHub Actions orchestrates the entire pipeline from ingestion to upload. It runs on a cron schedule or is triggered by a code push — the factory never stops.',
      },
    ],
  },

  tech_stack: {
    ai_model: 'Google Gemini 2.0 Flash (primary), with automatic fallback to Gemini 1.5-Flash and 1.5-Pro if the primary is unavailable',
    voice_engine: 'Microsoft Edge-TTS — free, neural-quality, with precise word-boundary event support',
    video_rendering: 'React Remotion v4 compiled and rendered on AWS Lambda (serverless). Frame-accurate animation, no local hardware needed.',
    database: 'Supabase (PostgreSQL-backed) — manages pipeline state, queue prioritization, deduplication, and recovery logic',
    cloud_storage: 'AWS S3 — stores video assets, Remotion render bundles, and intermediate files',
    ci_cd: 'GitHub Actions — cron-triggered and push-triggered workflows that run the full 6-stage pipeline',
    frontend: 'Next.js 14 (App Router) with Framer Motion animations, deployed on Vercel',
    chatbot_ai: 'Google Gemini API accessed via Next.js API route, with Upstash Redis rate limiting',
    platforms_supported: ['YouTube Shorts', 'TikTok', 'Meta Reels (Instagram)'],
  },

  verified_metrics: {
    subtitle_sync_drift: '< 5ms — achieved via Edge-TTS word-boundary token events mapped to Remotion animation frames',
    duplicate_uploads: '0 — Supabase state machine with idempotency keys prevents any content from being re-uploaded',
    local_hardware_required: 'None (0%) — every step from rendering to uploading is serverless and cloud-native',
    concurrent_platforms: '3 — YouTube Shorts, TikTok, and Meta Reels receive uploads in parallel',
    render_environment: '100% serverless — AWS Lambda with no local GPU or CPU dependency',
  },

  faqs: [
    {
      q: 'What is the Hazy Content Factory?',
      a: 'A fully automated, cloud-native video production pipeline that researches, writes scripts, generates voice-overs, renders videos, and uploads to multiple platforms — all without any human intervention after initial setup. It runs 24/7.',
    },
    {
      q: 'What platforms does it publish to?',
      a: 'YouTube Shorts, TikTok, and Meta Reels (Instagram). All three receive the video simultaneously via parallel upload streams.',
    },
    {
      q: 'How are the videos rendered without a local PC?',
      a: 'React Remotion v4 compiles the video as code, then AWS Lambda renders each frame in a serverless cloud environment. The final video is assembled without any local GPU or CPU.',
    },
    {
      q: 'How accurate are the subtitles?',
      a: 'Extremely accurate — Edge-TTS provides millisecond word-boundary events for every spoken word, which are mapped directly to Remotion frame timecodes. The drift is under 5ms.',
    },
    {
      q: 'How does the AI write the scripts?',
      a: 'Google Gemini generates scripts using custom anti-AI-slop protocols — system-level instructions that force natural pacing, varied sentence structure, and conversational tone instead of generic AI writing.',
    },
    {
      q: 'How do I collaborate with Kyrell or hire him?',
      a: 'Head to the "Scale Your Vision" contact section at the bottom of the website, fill in your name and message, and Kyrell will respond within 24 hours.',
    },
    {
      q: 'Is the code open source?',
      a: 'Yes. The full pipeline source code is available on GitHub at https://github.com/Hazy019/youtube-shorts-automator',
    },
    {
      q: 'What prevents videos from being uploaded twice?',
      a: 'Supabase acts as a state machine. Every content piece has a unique idempotency key and a tracked status (pending, processing, done, failed). The pipeline checks this before every action, making duplicate uploads impossible.',
    },
    {
      q: 'How does the pipeline get triggered?',
      a: 'GitHub Actions runs the pipeline on a cron schedule (automated, time-based) or whenever a code push is made to the repository. The entire 6-stage flow runs without any manual trigger.',
    },
    {
      q: 'What happens if a render fails?',
      a: 'The Supabase state machine tracks the failure. A self-recovery script can detect items stuck in "processing" and re-queue them, ensuring resilience against transient AWS Lambda or network errors.',
    },
  ],
};

// ─── Context Builder ──────────────────────────────────────────────────────────
// Converts the knowledge base into clean, readable prose for Gemini injection.
// Prose format outperforms raw JSON for LLM comprehension and token efficiency.
export function buildKnowledgeContext(): string {
  const kb = HAZY_KNOWLEDGE_BASE;

  const pipelineStages = kb.pipeline.stages
    .map(s => `  Stage ${s.num} — ${s.name} (${s.tech}): ${s.detail}`)
    .join('\n');

  const metrics = Object.entries(kb.verified_metrics)
    .map(([key, val]) => `  • ${key.replace(/_/g, ' ')}: ${val}`)
    .join('\n');

  const faqs = kb.faqs
    .map(f => `  Q: ${f.q}\n  A: ${f.a}`)
    .join('\n\n');

  return `
=== KNOWLEDGE BASE — USE THIS AS GROUND TRUTH FOR ALL ANSWERS ===

SYSTEM OVERVIEW:
  Name: ${kb.system.name}
  Description: ${kb.system.tagline}
  Status: ${kb.system.status}
  Operation: ${kb.system.uptime}
  Website: ${kb.system.website}
  GitHub: ${kb.system.github}
  YouTube Channel: ${kb.system.youtube_channel}

CREATOR:
  Name: ${kb.creator.name} (handle: ${kb.creator.alias})
  Role: ${kb.creator.role}
  GitHub: ${kb.creator.github}
  How to contact: ${kb.creator.contact_method}

PIPELINE — ${kb.pipeline.overview}
${pipelineStages}

TECH STACK:
  AI Model: ${kb.tech_stack.ai_model}
  Voice Engine: ${kb.tech_stack.voice_engine}
  Video Rendering: ${kb.tech_stack.video_rendering}
  Database: ${kb.tech_stack.database}
  Cloud Storage: ${kb.tech_stack.cloud_storage}
  CI/CD: ${kb.tech_stack.ci_cd}
  Frontend: ${kb.tech_stack.frontend}
  Chatbot: ${kb.tech_stack.chatbot_ai}
  Platforms: ${kb.tech_stack.platforms_supported.join(', ')}

VERIFIED METRICS (cite these exactly when asked about performance):
${metrics}

FREQUENTLY ASKED QUESTIONS (use these answers directly):
${faqs}

=== END KNOWLEDGE BASE — Do not invent facts outside of what is stated above ===
`.trim();
}
