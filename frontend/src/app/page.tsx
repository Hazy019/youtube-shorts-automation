'use client';

import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useInView,
} from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChatBot from '@/components/ChatBot';

const Core3D = dynamic(() => import('@/components/Core3D'), { ssr: false });

// ─── prefers-reduced-motion helper ───────────────────────────────────────────
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCounter(target: number, inView: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);
  useEffect(() => {
    if (!inView || hasRun.current) return;
    hasRun.current = true;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCount(Math.round((target / steps) * step));
      if (step >= steps) clearInterval(timer);
    }, interval);
    return () => clearInterval(timer);
  }, [inView, target, duration]);
  return count;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STAGES = [
  {
    num: '01',
    label: 'Ingestion',
    tech: 'Supabase',
    title: 'Topic Ingestion',
    desc: 'Topics queued, deduplicated, and prioritized. Idempotency keys prevent re-processing.',
    terminal: `supabase.table("topics")
  .select("*")
  .eq("status", "queued")
  .order("priority", desc=True)
  .limit(1)
  .execute()`,
  },
  {
    num: '02',
    label: 'Synthesis',
    tech: 'Google Gemini AI',
    title: 'Script Synthesis',
    desc: 'Anti-AI-slop protocols enforce natural, engaging scripts instead of generic output.',
    terminal: `model = genai.GenerativeModel("gemini-2.0-flash")
response = model.generate_content(
  ANTI_SLOP_PROMPT + topic,
  generation_config={"temperature": 0.9}
)`,
  },
  {
    num: '03',
    label: 'Voice',
    tech: 'Microsoft Edge-TTS',
    title: 'Neural Voice',
    desc: 'Neural voice synthesis with <5ms word-boundary sync to subtitle frames.',
    terminal: `await edge_tts.Communicate(
  text=script,
  voice="en-US-AndrewMultilingualNeural"
).save(output_path)
# Word-boundary events → subtitle JSON`,
  },
  {
    num: '04',
    label: 'Render',
    tech: 'AWS Lambda + Remotion',
    title: 'Cloud Render',
    desc: 'Serverless frame-accurate video rendering. No local GPU. 450 frames/Lambda.',
    terminal: `renderMediaOnLambda({
  composition: "HazyShort",
  framesPerLambda: 450,
  concurrencyPerLambda: 1,
  codec: "h264",
})`,
  },
  {
    num: '05',
    label: 'Syndication',
    tech: 'YouTube · TikTok · Meta',
    title: 'Multi-Platform Syndication',
    desc: 'Parallel upload streams. One render hits 3 platforms simultaneously.',
    terminal: `asyncio.gather(
  upload_youtube(video, metadata),
  upload_tiktok(video, metadata),
  upload_meta_reel(video, metadata),
)`,
  },
  {
    num: '06',
    label: 'CI/CD',
    tech: 'GitHub Actions',
    title: 'Autonomous Scheduling',
    desc: 'Cron-scheduled or push-triggered. The factory never stops.',
    terminal: `on:
  schedule:
    - cron: "30 10 * * *"  # 06:30 AM ET
    - cron: "30 22 * * *"  # 06:30 PM ET
  workflow_dispatch:`,
  },
];

const METRICS = [
  { value: 5, prefix: '< ', suffix: 'ms', label: 'Subtitle Sync Drift' },
  { value: 0, prefix: '', suffix: '', label: 'Duplicate Uploads' },
  { value: 3, prefix: '', suffix: '', label: 'Platforms Simultaneous' },
  { value: 100, prefix: '', suffix: '%', label: 'Serverless' },
];

// ─── MetricCard sub-component ─────────────────────────────────────────────────
function MetricCard({ metric, index, reduced }: { metric: typeof METRICS[0]; index: number; reduced: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const count = useCounter(metric.value, inView);
  const displayVal = reduced ? metric.value : count;

  return (
    <motion.div
      ref={ref}
      initial={reduced ? false : { opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : (reduced ? {} : { opacity: 0, y: 40 })}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      className="glass hover-glow"
      style={{ borderRadius: '1.25rem', padding: '2rem 1.75rem', textAlign: 'center' }}
    >
      <div
        className="display-font"
        style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          color: '#10b981',
          lineHeight: 1,
          marginBottom: '0.6rem',
        }}
      >
        {metric.prefix}{displayVal}{metric.suffix}
      </div>
      <div style={{ fontSize: '0.9rem', color: 'var(--foreground-muted)', fontFamily: 'var(--font-inter)', fontWeight: 400 }}>
        {metric.label}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const reduced = usePrefersReducedMotion();

  // — State —
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [starCount, setStarCount] = useState('...');
  const [videoId, setVideoId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [contactState, setContactState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [activeStage, setActiveStage] = useState(0);

  // — Theme init & persist —
  useEffect(() => {
    const saved = localStorage.getItem('hazy-theme');
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hazy-theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  // — Scroll / Stars / Video fetch —
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);

    fetch('https://api.github.com/repos/Hazy019/youtube-shorts-automator')
      .then(r => r.json())
      .then(d => {
        if (d.stargazers_count !== undefined) {
          const c = d.stargazers_count;
          setStarCount(c > 999 ? (c / 1000).toFixed(1) + 'k' : String(c));
        }
      })
      .catch(() => setStarCount('★'));

    fetch('/api/latest-video')
      .then(r => r.json())
      .then(d => { if (d.videoId) setVideoId(d.videoId); })
      .catch(() => {})
      .finally(() => setVideoLoading(false));

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // — Hero parallax —
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });
  const headlineY = useTransform(heroScroll, [0, 1], ['0%', reduced ? '0%' : '-30%']);
  const coreOpacity = useTransform(heroScroll, [0, 0.6], [1, reduced ? 1 : 0]);

  // — Scrollytelling pipeline section —
  const pipelineRef = useRef<HTMLElement>(null);
  const { scrollYProgress: pipelineScroll } = useScroll({
    target: pipelineRef,
    offset: ['start start', 'end end'],
  });
  useEffect(() => {
    const unsub = pipelineScroll.on('change', v => {
      const idx = Math.min(5, Math.floor(v * 6));
      setActiveStage(idx);
    });
    return unsub;
  }, [pipelineScroll]);

  // — Contact form —
  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactState === 'loading') return;
    setContactState('loading');
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      // TODO: wire to your form endpoint (Formspree / custom API)
      const res = await fetch('https://formspree.io/f/meedjlpe', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) { setContactState('done'); form.reset(); }
      else setContactState('idle');
    } catch { setContactState('idle'); }
  };

  // — Blur-up variant factory —
  const blurUp = (delay = 0) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 20, filter: 'blur(8px)' },
          animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
          transition: { duration: 0.9, delay, ease: [0.16, 1, 0.3, 1] },
        };

  const inViewFade = (dir: 'left' | 'right' | 'up' = 'up', delay = 0) => {
    if (reduced) return {};
    const axis = dir === 'left' ? { x: -30 } : dir === 'right' ? { x: 30 } : { y: 30 };
    return {
      initial: { opacity: 0, ...axis },
      whileInView: { opacity: 1, x: 0, y: 0 },
      viewport: { once: true, amount: 0.2 as const },
      transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
    };
  };

  return (
    <main style={{ position: 'relative', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      {/* ─── NAVBAR ──────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pill-nav"
        style={{
          position: 'fixed', top: '1.5rem', left: '50%', zIndex: 50,
          padding: isScrolled ? '0.75rem 1.5rem' : '0.8rem 1.5rem',
          width: '92%', maxWidth: '980px',
          background: 'var(--nav-bg)', backdropFilter: 'blur(20px)',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          border: isScrolled ? '1px solid rgba(139,92,246,0.15)' : '1px solid var(--card-border)',
          boxShadow: isScrolled ? '0 10px 40px -10px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Logo */}
        <div className="display-font" style={{ color: 'var(--foreground)', fontSize: '1.1rem', letterSpacing: '-0.02em', fontWeight: 900, flexShrink: 0 }}>HAZY.</div>

        {/* Center links */}
        <div className="nav-links hide-mobile">
          <a href="#pipeline" className="nav-link">Pipeline</a>
          <a href="#metrics" className="nav-link">Metrics</a>
          <a href="#output" className="nav-link">Output</a>
          <a href="/docs" className="nav-link">Docs</a>
          <a href="#contact" className="nav-link">Contact</a>
        </div>

        {/* Right actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.6rem' }}>
          {/* GitHub Star */}
          <a
            href="https://github.com/Hazy019/youtube-shorts-automator"
            target="_blank" rel="noopener noreferrer"
            className="nav-star hide-mobile"
          >
            <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
            </svg>
            Star
            <span className="nav-star-count">{starCount}</span>
          </a>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle Theme">
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.span key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </motion.span>
              ) : (
                <motion.span key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* CTA */}
          <a href="#contact" className="nav-cta hide-mobile">Scale Together</a>

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              ) : (
                <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
              )}
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.2 }}
            className="glass"
            style={{
              position: 'fixed', top: '5rem', left: '4%', right: '4%', zIndex: 49,
              borderRadius: '1rem', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
              border: '1px solid var(--card-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            {['#pipeline', '#metrics', '#output', '/docs', '#contact'].map((href, i) => (
              <a key={i} href={href} onClick={() => setIsMobileMenuOpen(false)} className="nav-link"
                style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {['Pipeline', 'Metrics', 'Output', 'Docs', 'Contact'][i]}
              </a>
            ))}
            <div style={{ height: '1px', background: 'var(--card-border)', margin: '0.25rem 0' }} />
            <a href="https://github.com/Hazy019/youtube-shorts-automator" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              GitHub ({starCount})
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── SECTION 1: HERO ─────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        style={{ position: 'relative', height: '100svh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}
      >
        {/* Core3D background */}
        <motion.div style={{ opacity: coreOpacity, position: 'absolute', inset: 0, zIndex: 0 }}>
          <Core3D />
        </motion.div>

        {/* Gradient fade-out overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'linear-gradient(to bottom, transparent 60%, var(--background) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: '400px', height: '400px', background: 'rgba(139,92,246,0.12)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '25%', right: '10%', width: '500px', height: '500px', background: 'rgba(217,70,239,0.08)', borderRadius: '50%', filter: 'blur(140px)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Headline container — parallax */}
        <motion.div
          style={{ y: headlineY, textAlign: 'center', zIndex: 2, width: '100%', padding: '0 clamp(1rem, 4vw, 2rem)', position: 'relative' }}
        >
          {/* Line 1: ZERO */}
          <motion.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] } })}
            className="display-font"
            style={{
              fontSize: 'clamp(4rem, 11vw, 9rem)',
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              color: 'var(--foreground)',
            }}
          >
            ZERO
          </motion.div>

          {/* Line 2: HUMAN. — text-stroke outlined */}
          <motion.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20, filter: 'blur(8px)' }, animate: { opacity: 1, y: 0, filter: 'blur(0px)' }, transition: { duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] } })}
            className="display-font"
            style={{
              fontSize: 'clamp(4rem, 11vw, 9rem)',
              letterSpacing: '-0.05em',
              lineHeight: 0.9,
              WebkitTextStroke: '1.5px var(--primary)',
              color: 'transparent',
              marginBottom: '2.5rem',
            }}
          >
            HUMAN.
          </motion.div>

          {/* Stat pills sub-headline */}
          <motion.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] } })}
            style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '0.6rem', marginBottom: '2.5rem' }}
          >
            {[
              { num: '6', label: 'stages' },
              { num: '3', label: 'platforms' },
              { num: '0', label: 'touchpoints' },
            ].map(({ num, label }) => (
              <span key={label} style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--card-border)',
                borderRadius: '999px',
                padding: '0.35rem 1rem',
                fontSize: '0.85rem',
                fontFamily: 'var(--font-syne)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>{num}</span>
                <span style={{ color: 'rgba(240,240,242,0.55)' }}>{label}</span>
              </span>
            ))}
          </motion.div>

          {/* CTA row */}
          <motion.div
            {...(reduced ? {} : { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: 0.48, ease: [0.16, 1, 0.3, 1] } })}
            style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <motion.a
              href="#pipeline"
              className="nav-cta"
              whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
            >
              Watch the Pipeline →
            </motion.a>

            <motion.a
              href="https://github.com/Hazy019/youtube-shorts-automator"
              target="_blank" rel="noopener noreferrer"
              whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid var(--card-border)',
                borderRadius: '999px', padding: '0.5rem 1.25rem',
                fontSize: '0.82rem', fontWeight: 700, color: 'var(--foreground)',
                background: 'rgba(255,255,255,0.04)',
                textDecoration: 'none',
              }}
            >
              {/* Pulsing dot */}
              <span style={{
                width: '7px', height: '7px', borderRadius: '50%',
                background: '#10b981',
                boxShadow: '0 0 0 0 rgba(16,185,129,0.4)',
                animation: 'pulse-dot 1.8s ease-in-out infinite',
                display: 'inline-block',
                flexShrink: 0,
              }} />
              Star on GitHub ★
            </motion.a>
          </motion.div>
        </motion.div>
      </section>

      {/* Pulse dot keyframe via style tag */}
      <style>{`
        @keyframes pulse-dot {
          0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.8; }
        }
      `}</style>

      {/* ─── SECTION 2: PIPELINE TICKER ──────────────────────────────────────── */}
      <div style={{
        overflow: 'hidden',
        background: 'rgba(139,92,246,0.06)',
        borderTop: '1px solid var(--card-border)',
        borderBottom: '1px solid var(--card-border)',
        padding: '0.7rem 0',
        position: 'relative', zIndex: 5,
      }}>
        <div className="ticker-track">
          {[...Array(4)].map((_, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0', flexShrink: 0 }}>
              {['▶ INGEST', '→ SYNTHESIZE', '→ VOICE', '→ RENDER', '→ SYNDICATE', '→ CI/CD'].map((stage, j) => (
                <span key={j} className="display-font" style={{
                  fontSize: '0.78rem', letterSpacing: '0.12em', fontWeight: 700,
                  color: 'var(--foreground-subtle)', textTransform: 'uppercase',
                  padding: '0 1.5rem', whiteSpace: 'nowrap',
                }}>
                  {stage}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ─── SECTION 3: PIPELINE SCROLLYTELLING ──────────────────────────────── */}
      <section
        id="pipeline"
        ref={pipelineRef}
        style={{ position: 'relative', height: '600vh' }}
      >
        <div style={{
          position: 'sticky', top: 0, height: '100vh',
          display: 'flex', alignItems: 'center',
          willChange: 'transform', overflow: 'hidden',
        }}>
          {/* Ambient glow */}
          <div style={{ position: 'absolute', top: '40%', left: '20%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />

          <div style={{ width: '100%', maxWidth: '1300px', margin: '0 auto', padding: '0 clamp(1rem, 4vw, 3rem)', display: 'grid', gridTemplateColumns: '40% 60%', gap: '4rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

            {/* Left — Stage number */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage + '-num'}
                initial={reduced ? {} : { opacity: 0, scale: 0.85 }}
                animate={reduced ? {} : { opacity: 1, scale: 1 }}
                exit={reduced ? {} : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="display-font text-gradient-primary"
                  style={{ fontSize: 'clamp(6rem, 15vw, 14rem)', lineHeight: 0.85, letterSpacing: '-0.04em' }}
                >
                  {STAGES[activeStage].num}
                </div>
                <div style={{
                  fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em',
                  color: 'var(--foreground-muted)', textTransform: 'uppercase',
                  marginTop: '1.25rem', fontFamily: 'var(--font-syne)',
                }}>
                  {STAGES[activeStage].label}
                </div>
                {/* Progress dots */}
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '1.5rem' }}>
                  {STAGES.map((_, i) => (
                    <div key={i} style={{
                      width: i === activeStage ? '24px' : '6px',
                      height: '6px', borderRadius: '999px',
                      background: i === activeStage ? 'var(--primary)' : 'var(--card-border)',
                      transition: 'all 0.4s ease',
                    }} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right — Stage detail */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStage + '-detail'}
                initial={reduced ? {} : { opacity: 0, x: 20, filter: 'blur(6px)' }}
                animate={reduced ? {} : { opacity: 1, x: 0, filter: 'blur(0px)' }}
                exit={reduced ? {} : { opacity: 0, x: -20, filter: 'blur(6px)' }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Tech badge */}
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.25)',
                  borderRadius: '999px',
                  padding: '0.3rem 0.9rem',
                  fontSize: '0.72rem', fontWeight: 700,
                  color: 'var(--primary)', letterSpacing: '0.05em',
                  textTransform: 'uppercase', marginBottom: '1.25rem',
                }}>
                  {STAGES[activeStage].tech}
                </span>

                <h2 className="display-font" style={{
                  fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)',
                  color: 'var(--foreground)', marginBottom: '1rem', lineHeight: 1.15,
                }}>
                  {STAGES[activeStage].title}
                </h2>

                <p style={{
                  fontSize: '1.05rem', color: 'var(--foreground-muted)',
                  lineHeight: 1.75, marginBottom: '1.75rem', maxWidth: '40rem',
                }}>
                  {STAGES[activeStage].desc}
                </p>

                {/* Terminal block */}
                <div style={{
                  background: '#0a0a10',
                  border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: '0.875rem',
                  padding: '1.25rem 1.5rem',
                  fontFamily: "'Courier New', monospace",
                  fontSize: '0.8rem', lineHeight: 1.75,
                  color: '#c4c4d0', maxWidth: '480px',
                  transition: 'border-color 0.25s ease',
                  position: 'relative',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.4)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(139,92,246,0.15)'}
                >
                  {/* Terminal dot bar */}
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '0.9rem' }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map(c => (
                      <div key={c} style={{ width: '10px', height: '10px', borderRadius: '50%', background: c, opacity: 0.7 }} />
                    ))}
                  </div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    <code>{STAGES[activeStage].terminal}</code>
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: METRICS ──────────────────────────────────────────────── */}
      <section id="metrics" style={{ padding: '9rem 1.5rem', position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--card-border)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '60vw', height: '300px', background: 'rgba(217,70,239,0.05)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            {...(reduced ? {} : inViewFade('up', 0))}
            style={{ marginBottom: '4rem', textAlign: 'center' }}
          >
            <span style={{ color: '#10b981', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
              SYSTEM INTEGRITY
            </span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2.25rem, 5vw, 4rem)', color: 'var(--foreground)' }}>
              Verifiable Precision.
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {METRICS.map((m, i) => (
              <MetricCard key={i} metric={m} index={i} reduced={reduced} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: LIVE VIDEO ───────────────────────────────────────────── */}
      <section id="output" style={{ padding: '9rem 1.5rem', borderTop: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '40%', right: '-5%', width: '450px', height: '450px', background: 'rgba(139,92,246,0.07)', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '5rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          {/* Left copy */}
          <motion.div
            {...(reduced ? {} : inViewFade('left'))}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
          >
            <span style={{ color: '#10b981', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              LIVE OUTPUT
            </span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', color: 'var(--foreground)', lineHeight: 1.1 }}>
              The machine is already running.
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--foreground-muted)', lineHeight: 1.75, maxWidth: '36rem' }}>
              Every Short you see below was produced without a single human edit. Script, voice, render, upload — fully autonomous.
            </p>
            {/* Platform badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {['YouTube Shorts', 'TikTok', 'Meta Reels'].map(p => (
                <span key={p} style={{
                  border: '1px solid var(--card-border)',
                  borderRadius: '999px', padding: '0.3rem 0.85rem',
                  fontSize: '0.75rem', fontWeight: 600, color: 'var(--foreground-muted)',
                  background: 'var(--card-bg)',
                }}>
                  {p}
                </span>
              ))}
            </div>
            <a
              href="https://www.youtube.com/@Hazy_Insight/shorts"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--foreground-muted)', border: '1px solid var(--card-border)', padding: '0.6rem 1.4rem', borderRadius: '999px', background: 'var(--card-bg)', width: 'fit-content', transition: 'all 0.25s ease' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(139,92,246,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground-muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
              View all Shorts on YouTube
            </a>
          </motion.div>

          {/* Right — video embed */}
          <motion.div
            {...(reduced ? {} : inViewFade('right'))}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div
              className="glass"
              style={{
                borderRadius: '1.25rem', padding: '8px',
                boxShadow: '0 0 60px rgba(139,92,246,0.25)',
                width: '315px', flexShrink: 0,
              }}
            >
              {videoLoading ? (
                <div style={{
                  width: '315px', height: '560px', borderRadius: '1rem',
                  background: 'var(--card-bg)',
                  animation: 'skeleton-pulse 1.6s ease-in-out infinite',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--foreground-subtle)', fontSize: '0.8rem',
                }}>
                  Loading…
                </div>
              ) : videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                  title="Latest Hazy Short"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ width: '299px', height: '560px', borderRadius: '1rem', border: 'none', display: 'block' }}
                />
              ) : (
                <div style={{
                  width: '299px', height: '560px', borderRadius: '1rem',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  color: 'var(--foreground-muted)', fontSize: '0.85rem',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  <span>Video unavailable</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── SECTION 6: OPEN SOURCE CTA ──────────────────────────────────────── */}
      <section style={{
        padding: '8rem 2rem',
        background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)',
        borderTop: '1px solid var(--card-border)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <motion.div
          {...(reduced ? {} : {
            initial: { opacity: 0, scale: 0.94 },
            whileInView: { opacity: 1, scale: 1 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
          })}
          style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}
        >
          <span style={{ color: '#10b981', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            OPEN SOURCE
          </span>
          <h2 className="display-font" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', color: 'var(--foreground)', lineHeight: 1.1 }}>
            Fork it. Improve it. Run it.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--foreground-muted)', lineHeight: 1.75 }}>
            The full pipeline is on GitHub. Star it, fork it, or open a PR. Kyrell reads every issue.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem' }}>
            <motion.a
              href="https://github.com/Hazy019/youtube-shorts-automator"
              target="_blank" rel="noopener noreferrer"
              whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                border: '1px solid var(--primary)', borderRadius: '999px',
                padding: '0.6rem 1.5rem', fontSize: '0.88rem', fontWeight: 700,
                color: 'var(--primary)', background: 'rgba(139,92,246,0.06)',
                textDecoration: 'none',
              }}
            >
              View on GitHub →
            </motion.a>
            <motion.a
              href="/docs"
              whileHover={reduced ? {} : { scale: 1.04, y: -2 }}
              whileTap={reduced ? {} : { scale: 0.97 }}
              className="nav-cta"
            >
              Read the Docs →
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* ─── SECTION 7: CONTACT ──────────────────────────────────────────────── */}
      <section id="contact" style={{ padding: '9rem 1.5rem', borderTop: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', right: '-5%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="contact-grid">

            {/* Left */}
            <motion.div
              {...(reduced ? {} : inViewFade('left'))}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1.25rem' }}>
                ( Start a Conversation )
              </span>
              <h2 className="display-font" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: 'var(--foreground)', lineHeight: 1.05, marginBottom: '1.25rem' }}>
                Scale Your <br /><span className="text-gradient-primary">Vision.</span>
              </h2>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '1.05rem', maxWidth: '28rem', lineHeight: 1.75, marginBottom: '2.5rem' }}>
                Have a content goal, a project idea, or want to understand how the Factory works? Send a message — Kyrell responds within 24 hours.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: '⚡', label: '24/7 Autonomous Production', sub: 'Zero human intervention after setup' },
                  { icon: '🌍', label: 'Multi-Platform Distribution', sub: 'YouTube · TikTok · Meta Reels simultaneously' },
                  { icon: '☁️', label: '100% Serverless Rendering', sub: 'AWS Lambda — no local hardware needed' },
                  { icon: '📬', label: 'Response within 24 hours', sub: 'Direct line to the creator' },
                ].map((feat, i) => (
                  <motion.div key={i}
                    {...(reduced ? {} : { initial: { opacity: 0, x: -20 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] } })}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}
                  >
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                      {feat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.1rem' }}>{feat.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>{feat.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div {...(reduced ? {} : inViewFade('right'))}>
              {contactState === 'done' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ padding: '3rem 2.5rem', borderRadius: '1.5rem', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: '1.15rem', fontWeight: 600, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}
                >
                  <div style={{ fontSize: '2.5rem' }}>✓</div>
                  <div>Message received.</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(34,197,94,0.7)', fontWeight: 400 }}>Kyrell will be in touch within 24 hours.</div>
                </motion.div>
              ) : (
                <div className="glass hover-glow" style={{ padding: '2.5rem', borderRadius: '1.5rem' }}>
                  <h3 className="display-font" style={{ fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Send a Message</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>Fill in the form and I&apos;ll get back to you shortly.</p>
                  <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {[
                      { label: 'Your Name', name: 'name', type: 'text', placeholder: 'e.g. Kyrell Santillan', rows: undefined },
                      { label: 'Your Message', name: 'message', type: 'textarea', placeholder: 'Tell us what you\'re building, your content goal, or what you need help with...', rows: 5 },
                    ].map(field => (
                      <div key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--foreground-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {field.label}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            name={field.name} required rows={field.rows}
                            placeholder={field.placeholder}
                            style={{ padding: '0.9rem 1.1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.65, minHeight: '130px', width: '100%', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.boxShadow = 'none'; }}
                          />
                        ) : (
                          <input
                            type={field.type} name={field.name} required
                            placeholder={field.placeholder}
                            style={{ padding: '0.9rem 1.1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }}
                            onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)'; }}
                            onBlur={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.boxShadow = 'none'; }}
                          />
                        )}
                      </div>
                    ))}
                    <motion.button
                      type="submit"
                      whileHover={reduced ? {} : { scale: 1.02, boxShadow: '0 10px 36px rgba(139,92,246,0.45)' }}
                      whileTap={reduced ? {} : { scale: 0.97 }}
                      disabled={contactState === 'loading'}
                      style={{
                        marginTop: '0.5rem', padding: '1rem 2rem', borderRadius: '0.75rem',
                        background: contactState === 'loading' ? 'var(--foreground-subtle)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white', fontWeight: 700, fontSize: '1rem', border: 'none',
                        cursor: contactState === 'loading' ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: '0 4px 20px rgba(139,92,246,0.3)', width: '100%', fontFamily: 'inherit',
                      }}
                    >
                      {contactState === 'loading' ? (
                        <>
                          <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                          Sending...
                        </>
                      ) : 'Send Inquiry →'}
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--card-border)' }}>
        {/* Builder strip */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(139,92,246,0.03)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.5 }}>
            Engineered by{' '}
            <a href="https://github.com/Hazy019" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 600, transition: 'opacity 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.opacity = '0.75')}
              onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '1')}
            >Kyrell Santillan</a>
            {' '}·{' '}
            <span style={{ color: 'var(--foreground-muted)' }}>Aspiring Web Developer &amp; Tech Generalist</span>
          </span>
        </div>
        {/* Main footer row */}
        <div style={{ padding: '1.75rem 1.5rem', maxWidth: '1300px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground-muted)', fontSize: '0.82rem', gap: '1rem' }}>
          <div className="display-font" style={{ fontSize: '1.2rem', letterSpacing: '-0.02em' }}>HAZY.</div>
          <div style={{ display: 'flex', gap: '1.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/docs" className="nav-link" style={{ fontSize: '0.8rem' }}>Documentation</a>
            <a href="https://github.com/Hazy019/youtube-shorts-automator" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ fontSize: '0.8rem' }}>GitHub</a>
            <a href="https://www.youtube.com/@Hazy_Insight/shorts" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ fontSize: '0.8rem' }}>YouTube</a>
          </div>
          <span>© 2026 Designed for scale. Built for performance.</span>
        </div>
      </footer>

      {/* ─── ChatBot ─────────────────────────────────────────────────────────── */}
      <ChatBot />
    </main>
  );
}
