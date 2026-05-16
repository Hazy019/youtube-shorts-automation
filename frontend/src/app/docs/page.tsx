import React from 'react';

export default function DocsPage() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Left Sidebar */}
      <aside style={{ width: '260px', borderRight: '1px solid var(--card-border)', padding: '2rem 1.5rem', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div className="display-font" style={{ fontSize: '1.25rem', marginBottom: '2rem', color: 'var(--foreground)' }}>
          <a href="/">HAZY.</a>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
          <div style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginTop: '1rem' }}>Getting Started</div>
          <a href="#introduction" style={{ color: 'var(--foreground)' }}>Introduction</a>
          <a href="#installation" style={{ color: 'var(--muted)' }}>Installation</a>
          <a href="#configuration" style={{ color: 'var(--muted)' }}>Configuration</a>
          
          <div style={{ color: 'var(--muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', marginTop: '1.5rem' }}>Pipeline Architecture</div>
          <a href="#ingestion" style={{ color: 'var(--muted)' }}>Data Ingestion</a>
          <a href="#synthesis" style={{ color: 'var(--muted)' }}>Script Synthesis</a>
          <a href="#rendering" style={{ color: 'var(--muted)' }}>AWS Rendering</a>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem 4rem', maxWidth: '800px' }}>
        <h1 className="display-font" style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>Getting Started</h1>
        <p style={{ color: 'var(--muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          Welcome to the Hazy Content Factory documentation. This pipeline allows you to fully automate high-retention video production across YouTube, TikTok, and Meta.
        </p>

        <section id="introduction" style={{ marginBottom: '3rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Introduction</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
            Hazy is not just a script. It is a cloud-native, autonomous media generation engine. By leveraging Supabase for state management, Gemini for synthesis, and AWS Lambda for distributed rendering, it removes the human bottleneck entirely.
          </p>
          <div style={{ backgroundColor: 'var(--card-bg)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--card-border)' }}>
            <strong>Note:</strong> You must have valid API keys for OpenAI, Gemini, and AWS configured before running the pipeline.
          </div>
        </section>

        <section id="installation" style={{ marginBottom: '3rem' }}>
          <h2 className="display-font" style={{ fontSize: '1.75rem', marginBottom: '1rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>Installation</h2>
          <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: '1rem' }}>
            Clone the repository and install the dependencies. The project requires Node.js 18+ and Python 3.10+.
          </p>
          <pre style={{ backgroundColor: '#0a0a0a', color: '#f0f0f2', padding: '1rem', borderRadius: '0.5rem', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.1)' }}>
            <code>
{`git clone https://github.com/Hazy019/youtube-shorts-automator
cd youtube-shorts-automator

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install`}
            </code>
          </pre>
        </section>
      </main>

      {/* Right Table of Contents */}
      <aside style={{ width: '220px', padding: '3rem 1.5rem', position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="hide-mobile">
        <div style={{ color: 'var(--foreground)', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>On this page</div>
        <a href="#introduction" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Introduction</a>
        <a href="#installation" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Installation</a>
      </aside>
    </div>
  );
}
