'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const ANIM_BLUR_UP = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const STAGGER = { animate: { transition: { staggerChildren: 0.08 } } };

const NAV_SECTIONS = [
  {
    group: 'Getting Started',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'installation', label: 'Installation' },
      { id: 'configuration', label: 'Configuration' },
    ]
  },
  {
    group: 'Pipeline Architecture',
    items: [
      { id: 'ingestion', label: 'Data Ingestion' },
      { id: 'synthesis', label: 'Script Synthesis' },
      { id: 'rendering', label: 'AWS Rendering' },
      { id: 'distribution', label: 'Distribution' },
    ]
  }
];

export default function DocsPage() {
  const [activeId, setActiveId] = useState('introduction');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isClickingRef = useRef(false);

  // IntersectionObserver for active TOC link
  useEffect(() => {
    // Read theme from localStorage to stay in sync with the dashboard
    const savedTheme = localStorage.getItem('hazy-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const allIds = NAV_SECTIONS.flatMap(s => s.items.map(i => i.id));
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (isClickingRef.current) return;
        
        // Find the first intersecting entry instead of relying on the last one processed
        const intersecting = entries.find(e => e.isIntersecting);
        if (intersecting) {
           setActiveId(intersecting.target.id);
        }
      },
      { rootMargin: '-10% 0px -75% 0px' }
    );
    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    isClickingRef.current = true;
    setActiveId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Resume observer after smooth scroll completes
    setTimeout(() => {
      isClickingRef.current = false;
    }, 800);
  };

  return (
    <div className="docs-layout">
      {/* ── Left Sidebar ── */}
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="docs-sidebar">
        <a href="/" className="display-font" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', display: 'block', color: 'var(--foreground)', textDecoration: 'none' }}>HAZY.</a>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_SECTIONS.map(section => (
            <div key={section.group} style={{ marginBottom: '1rem' }}>
              {/* Group label — NOT a button or link */}
              <div style={{ color: 'var(--muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.75rem', marginBottom: '0.35rem' }}>
                {section.group}
              </div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`docs-nav-item ${activeId === item.id ? 'active' : ''}`}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
      </motion.aside>

      {/* ── Main Content ── */}
      <motion.main variants={STAGGER} initial="initial" animate="animate" className="docs-main">

        {/* Getting Started */}
        <motion.div variants={ANIM_BLUR_UP}>
          <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Getting Started</div>
          <h1 className="display-font" style={{ fontSize: '2.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>Introduction</h1>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '3rem' }}>
            Welcome to the Hazy Content Factory — a fully autonomous, cloud-native video production pipeline that creates, renders, and distributes short-form content across YouTube, TikTok, and Meta without human intervention.
          </p>
        </motion.div>

        <section id="introduction" style={{ marginBottom: '4rem' }}>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            Hazy is not just a script. It is a cloud-native, autonomous media generation engine. By leveraging Supabase for state management, Gemini for synthesis, and AWS Lambda for distributed rendering, it removes the human bottleneck entirely.
          </p>
          <div className="docs-callout">
            <strong>Important:</strong> You must have valid API keys for Gemini and AWS configured before running the pipeline. The factory relies on these external services for cognitive tasks and rendering.
          </div>
        </section>

        <section id="installation" style={{ marginBottom: '4rem', scrollMarginTop: '2rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>Installation</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            Clone the repository and install the dependencies. The project requires Node.js 18+ and Python 3.10+.
          </p>
          <div className="docs-code-block">
<pre><code>{`# Clone the repository
git clone https://github.com/Hazy019/youtube-shorts-automator.git
cd youtube-shorts-automator

# Install backend dependencies (Python)
pip install -r requirements.txt

# Install frontend dependencies (Next.js)
cd frontend && npm install`}</code></pre>
          </div>
        </section>

        <section id="configuration" style={{ marginBottom: '5rem', scrollMarginTop: '2rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>Configuration</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            Copy the <code>.env.example</code> to <code>.env</code> and populate your credentials.
          </p>
          <div className="docs-code-block">
<pre><code>{`GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1`}</code></pre>
          </div>
        </section>

        {/* Pipeline Architecture */}
        <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Pipeline Architecture</div>
        <h2 id="ingestion" className="display-font" style={{ fontSize: '2.5rem', marginBottom: '1.25rem', color: 'var(--foreground)', scrollMarginTop: '2rem' }}>Data Ingestion</h2>
        <p style={{ color: 'var(--foreground-muted)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '3rem' }}>
          The pipeline begins with topic ingestion via Supabase. Videos are queued, deduplicated by content hash, and prioritized by creation date (newest first) to prevent stale content flooding the platform.
        </p>

        <section style={{ marginBottom: '4rem' }}>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            The <code>videos</code> table in Supabase acts as the single source of truth. Each row tracks the full lifecycle — from <code>pending</code> through to <code>SUCCESS</code> or <code>FAILED</code>. An idempotency key prevents duplicate uploads even if the queue is re-triggered.
          </p>
          <div className="docs-callout">
            <strong>State Machine:</strong> <code>pending</code> → <code>script_ready</code> → <code>audio_ready</code> → <code>video_ready</code> → <code>SUCCESS</code>
          </div>
        </section>

        <section id="synthesis" style={{ marginBottom: '4rem', scrollMarginTop: '2rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>Script Synthesis</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            Scripts are generated using Google Gemini with a custom "anti-slop" system prompt that enforces factual accuracy, hooks in the first 3 seconds, and a 45–60 second target length. The output is post-processed to remove AI-isms and generic filler phrases.
          </p>
          <div className="docs-code-block">
<pre><code>{`# Script generation
python tools/generate_scripts.py

# The script engine uses:
# - Gemini 2.0 Flash (primary)
# - gemini-1.5-flash (fallback)
# Output is stored in Supabase videos.script column`}</code></pre>
          </div>
        </section>

        <section id="rendering" style={{ marginBottom: '4rem', scrollMarginTop: '2rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>AWS Rendering</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            Video rendering is fully serverless, powered by React Remotion on AWS Lambda. Each video is split into chunks (450 frames per Lambda) and rendered in parallel, then stitched server-side. No local GPU or CPU is required.
          </p>
          <div className="docs-callout">
            <strong>Configuration:</strong> Set <code>framesPerLambda: 450</code> in your Remotion config to balance concurrency and avoid rate limits. The default was 150 — this caused "Rate Exceeded" errors at scale.
          </div>
          <div className="docs-code-block" style={{ marginTop: '1.5rem' }}>
<pre><code>{`# Deploy the Remotion bundle to S3
npx remotion lambda sites create src/index.ts \\
  --site-name=hazy-factory

# Trigger a render
npx remotion lambda render hazy-factory \\
  --composition=VideoComposition \\
  --output-bucket=your-s3-bucket`}</code></pre>
          </div>
        </section>

        <section id="distribution" style={{ marginBottom: '4rem', scrollMarginTop: '2rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1.25rem', color: 'var(--foreground)' }}>Distribution</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
            Once rendered, the S3 video URL is passed to the distribution layer. The <code>bulk_tiktok_poster.py</code> and YouTube upload scripts run sequentially. After a successful upload, the S3 object is automatically deleted to avoid ongoing storage costs.
          </p>
          <div className="docs-callout">
            <strong>Recovery:</strong> If a TikTok upload fails (e.g., due to a UI overlay like <code>react-joyride</code>), the script pauses and prompts you to <strong>[R]etry</strong>, <strong>[S]kip</strong>, or <strong>[A]bort</strong> — no queue restart needed.
          </div>
        </section>

      </motion.main>

      {/* ── Right Table of Contents ── */}
      <motion.aside initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="docs-toc">
        <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>On this page</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {NAV_SECTIONS.flatMap(s => s.items).map(item => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                fontFamily: 'inherit', fontSize: '0.82rem', padding: '0.1rem 0',
                color: activeId === item.id ? 'var(--primary)' : 'var(--foreground-muted)',
                fontWeight: activeId === item.id ? 600 : 400,
                transition: 'color 0.2s',
                borderLeft: `2px solid ${activeId === item.id ? 'var(--primary)' : 'transparent'}`,
                paddingLeft: '0.6rem',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </motion.aside>
    </div>
  );
}
