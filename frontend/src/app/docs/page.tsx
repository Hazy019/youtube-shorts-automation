'use client';

import React from 'react';
import { motion } from 'framer-motion';

const ANIM_BLUR_UP = {
  initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const STAGGER_CONTAINER = {
  animate: { transition: { staggerChildren: 0.08 } }
};

export default function DocsPage() {
  return (
    <div className="docs-layout">
      {/* Left Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="docs-sidebar hide-mobile"
      >
        <div className="display-font" style={{ fontSize: '1.25rem', marginBottom: '2.5rem', color: 'var(--foreground)' }}>
          <a href="/">HAZY.</a>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.5rem' }}>Getting Started</div>
          <a href="#introduction" className="docs-nav-item active">Introduction</a>
          <a href="#installation" className="docs-nav-item">Installation</a>
          <a href="#configuration" className="docs-nav-item">Configuration</a>
          
          <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>Pipeline Architecture</div>
          <a href="#ingestion" className="docs-nav-item">Data Ingestion</a>
          <a href="#synthesis" className="docs-nav-item">Script Synthesis</a>
          <a href="#rendering" className="docs-nav-item">AWS Rendering</a>
          <a href="#distribution" className="docs-nav-item">Distribution</a>
        </nav>
      </motion.aside>

      {/* Main Content */}
      <motion.main 
        variants={STAGGER_CONTAINER}
        initial="initial"
        animate="animate"
        className="docs-main"
      >
        <motion.div variants={ANIM_BLUR_UP} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Getting Started</motion.div>
        <motion.h1 variants={ANIM_BLUR_UP} className="display-font" style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>Introduction</motion.h1>
        <motion.p variants={ANIM_BLUR_UP} style={{ color: 'var(--foreground-muted)', fontSize: '1.15rem', lineHeight: 1.8, marginBottom: '3rem' }}>
          Welcome to the Hazy Content Factory documentation. This pipeline allows you to fully automate high-retention video production across YouTube, TikTok, and Meta without human intervention.
        </motion.p>

        <motion.section variants={ANIM_BLUR_UP} id="introduction" style={{ marginBottom: '4rem' }}>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            Hazy is not just a script. It is a cloud-native, autonomous media generation engine. By leveraging Supabase for state management, Gemini for synthesis, and AWS Lambda for distributed rendering, it removes the human bottleneck entirely.
          </p>
          
          <div className="docs-callout">
            <strong>Important:</strong> You must have valid API keys for OpenAI, Gemini, and AWS configured before running the pipeline. The factory relies heavily on these external services for cognitive tasks and heavy lifting.
          </div>
        </motion.section>

        <motion.section variants={ANIM_BLUR_UP} id="installation" style={{ marginBottom: '4rem' }}>
          <h2 className="display-font" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>Installation</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            Clone the repository and install the dependencies. The project requires Node.js 18+ and Python 3.10+.
          </p>
          
          <div className="docs-code-block">
<pre><code>{`# Clone the repository
git clone https://github.com/Hazy019/youtube-shorts-automator.git
cd youtube-shorts-automator

# Install backend dependencies (Python)
pip install -r requirements.txt

# Install frontend dependencies (Next.js)
cd frontend
npm install`}</code></pre>
          </div>
        </motion.section>

        <motion.section variants={ANIM_BLUR_UP} id="configuration" style={{ marginBottom: '4rem' }}>
          <h2 className="display-font" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'var(--foreground)' }}>Configuration</h2>
          <p style={{ color: 'var(--foreground-muted)', fontSize: '1.05rem', lineHeight: 1.75, marginBottom: '1.5rem' }}>
            Copy the <code>.env.example</code> file to <code>.env</code> and fill in your credentials. The factory needs access to your Supabase instance to track video states across the pipeline.
          </p>
        </motion.section>
      </motion.main>

      {/* Right Table of Contents */}
      <motion.aside 
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="docs-toc hide-mobile"
      >
        <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.85rem', marginBottom: '1rem' }}>On this page</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <a href="#introduction" style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}>Introduction</a>
          <a href="#installation" style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}>Installation</a>
          <a href="#configuration" style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', transition: 'color 0.2s' }}>Configuration</a>
        </div>
      </motion.aside>
    </div>
  );
}
