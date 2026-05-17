'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import ChatBot from '@/components/ChatBot';

const ANIM_BLUR_UP = { initial: { opacity: 0, y: 50, filter: 'blur(10px)' }, whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: "-100px" }, transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] } };
const ANIM_SLIDE_LEFT = { initial: { opacity: 0, x: -60, filter: 'blur(12px)' }, whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: "-100px" }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } };
const ANIM_SLIDE_RIGHT = { initial: { opacity: 0, x: 60, filter: 'blur(12px)' }, whileInView: { opacity: 1, x: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: "-100px" }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } };
const ANIM_SCALE_IN = { initial: { opacity: 0, scale: 0.9, filter: 'blur(10px)' }, whileInView: { opacity: 1, scale: 1, filter: 'blur(0px)' }, viewport: { once: true, margin: "-100px" }, transition: { duration: 1, ease: [0.16, 1, 0.3, 1] } };
const ANIM_RISE = { initial: { opacity: 0, y: 100, rotateX: 15, filter: 'blur(8px)' }, whileInView: { opacity: 1, y: 0, rotateX: 0, filter: 'blur(0px)' }, viewport: { once: true, margin: "-50px" }, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } };
const STAGGER_PARENT = { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true, margin: "-100px" }, transition: { staggerChildren: 0.12, delayChildren: 0.2 } };

// Split text animation variant for premium typography reveals
const splitWordVariant = {
  initial: { y: "120%", opacity: 0, rotateZ: 5 },
  whileInView: { y: 0, opacity: 1, rotateZ: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

// Helper component for Lusion-style text reveals
const RevealText = ({ text, style }: { text: string; style?: React.CSSProperties }) => {
  return (
    <motion.div variants={STAGGER_PARENT} initial="initial" whileInView="whileInView" viewport={{ once: true, margin: "-100px" }} style={{ display: 'inline-flex', flexWrap: 'wrap', ...style }}>
      {text.split(' ').map((word, i) => (
        <span key={i} style={{ overflow: 'hidden', display: 'inline-block', marginRight: '0.25em' }}>
          <motion.span variants={splitWordVariant} style={{ display: 'inline-block', transformOrigin: 'bottom left' }}>
            {word}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
};

const PIPELINE_STEPS = [
  { num: '01', title: 'Ingestion', desc: 'Supabase state management. Topics are queued, deduplicated, and prioritized.', icon: '⚡' },
  { num: '02', title: 'Synthesis', desc: 'Gemini generates human-sounding scripts using anti-slop protocols.', icon: '🧠' },
  { num: '03', title: 'Voice', desc: 'Edge-TTS neural speech with millisecond word-boundary mapping.', icon: '🎙️' },
  { num: '04', title: 'Render', desc: 'React Remotion stitches cinematic B-roll via serverless AWS Lambda.', icon: '🎬' },
  { num: '05', title: 'Syndicate', desc: 'Parallel upload streams to YouTube, Meta, and TikTok.', icon: '🚀' },
  { num: '06', title: 'CI/CD', desc: 'GitHub Actions orchestrates the full pipeline — triggered on schedule or push.', icon: '⚙️' },
];

const INTEGRITY_CARDS = [
  { stat: '< 5ms', label: 'Subtitle Sync Drift', sub: 'Word-boundary tokens ensure audio and caption frames align precisely.', note: 'Measured via Edge-TTS word events' },
  { stat: '0', label: 'Duplicate Uploads', sub: 'Supabase state machine with idempotency keys prevents re-posting.', note: 'Self-healing queue with recovery logic' },
  { stat: '100%', label: 'Serverless Render', sub: 'Zero local hardware. Every render runs on AWS Lambda inside Remotion.', note: 'No local GPU or CPU required' },
];

const SHOWCASE_VIDEOS = [
  { id: 't8_WYIEzPPI', title: 'The Lake That Killed 1700 People in Their Sleep', label: 'Science' },
  { id: 'BiRAyUvX9Bw', title: "The Soviet Navy's Deepest Secret", label: 'History' },
  { id: 'ejRl1Um4fFI', title: 'The Love Glitch in Your Brain', label: 'Psychology' },
];

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactState, setContactState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [starCount, setStarCount] = useState<string>('...');
  const [activeVideo, setActiveVideo] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Initialize theme from storage
  useEffect(() => {
    const saved = localStorage.getItem('hazy-theme');
    if (saved === 'dark' || saved === 'light') setTheme(saved);
  }, []);

  // Apply theme and save
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hazy-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);

    // Fetch GitHub stars
    fetch('https://api.github.com/repos/Hazy019/youtube-shorts-automator')
      .then(res => res.json())
      .then(data => {
        if (data.stargazers_count !== undefined) {
          const count = data.stargazers_count;
          setStarCount(count > 999 ? (count / 1000).toFixed(1) + 'k' : count.toString());
        }
      })
      .catch(() => setStarCount('1.7k'));

    return () => window.removeEventListener('scroll', h);
  }, []);

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 250]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const glowYLeft = useTransform(scrollYProgress, [0, 1], [0, 400]);
  const glowYRight = useTransform(scrollYProgress, [0, 1], [0, -200]);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactState === 'loading') return;
    setContactState('loading');
    const form = e.target as HTMLFormElement;
    const data = new FormData(form);
    try {
      const res = await fetch('https://formspree.io/f/meedjlpe', {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setContactState('done');
        form.reset();
      } else {
        setContactState('idle');
      }
    } catch {
      setContactState('idle');
    }
  };

  return (
    <main ref={containerRef} style={{ position: 'relative', backgroundColor: 'var(--background)', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      {/* ─── NAV ─── */}
      <motion.nav
        initial={{ y: -80, x: '-50%', opacity: 0 }}
        animate={{ y: 0, x: '-50%', opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="pill-nav"
        style={{
          position: 'fixed', top: '1.5rem', left: '50%', zIndex: 50,
          padding: '0.65rem 1.25rem', width: '92%', maxWidth: '980px',
          opacity: isScrolled ? 0.88 : 1, transition: 'opacity 0.3s ease',
        }}
      >
        {/* Logo */}
        <div className="display-font" style={{ color: 'var(--foreground)', fontSize: '1.1rem', letterSpacing: '-0.02em', fontWeight: 900, flexShrink: 0 }}>HAZY.</div>

        {/* Center links */}
        <div className="nav-links hide-mobile">
          <a href="#about" className="nav-link">Philosophy</a>
          <a href="#integrity" className="nav-link">Integrity</a>
          <a href="#work" className="nav-link">Output</a>
          <a href="#machine" className="nav-link">Pipeline</a>
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
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"/>
                    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                  </svg>
                </motion.span>
              ) : (
                <motion.span key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.25, ease: 'easeInOut' }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* CTA */}
          <a href="#contact" className="nav-cta hide-mobile">Scale Together</a>

          {/* Mobile Menu Toggle — visibility controlled by CSS media query, not inline style */}
          <button 
            className="mobile-menu-toggle" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
            style={{ 
              background: 'transparent', border: 'none', color: 'var(--foreground)',
              cursor: 'pointer', padding: '0.25rem' 
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isMobileMenuOpen ? (
                <><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></>
              ) : (
                <><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></>
              )}
            </svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Menu Dropdown */}
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
              border: '1px solid var(--card-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
            }}
          >
            <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Philosophy</a>
            <a href="#integrity" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Integrity</a>
            <a href="#work" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Output</a>
            <a href="#machine" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pipeline</a>
            <a href="/docs" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Docs</a>
            <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="nav-link" style={{ fontSize: '1.1rem', fontWeight: 600 }}>Contact</a>
            
            <div style={{ height: '1px', background: 'var(--card-border)', margin: '0.5rem 0' }} />
            
            <a href="https://github.com/Hazy019/youtube-shorts-automator" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--foreground-muted)' }}>
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" /></svg>
              GitHub ({starCount})
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── HERO ─── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <motion.div style={{ y: glowYLeft, position: 'absolute', top: '15%', left: '10%', width: '500px', height: '500px', backgroundColor: 'rgba(147,51,234,0.18)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
        <motion.div style={{ y: glowYRight, position: 'absolute', bottom: '15%', right: '10%', width: '600px', height: '600px', backgroundColor: 'rgba(217,70,239,0.15)', borderRadius: '50%', filter: 'blur(140px)', pointerEvents: 'none' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, textAlign: 'center', zIndex: 10, width: '100%', padding: '0 clamp(1rem, 4vw, 2rem)' }}>
          <motion.div
            initial={{ opacity: 0, y: 20, letterSpacing: '0.6em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.3em' }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 'clamp(0.65rem, 1.8vw, 0.85rem)', fontWeight: 600, marginBottom: '1.5rem' }}
          >
            Cloud-Native Autonomous Media
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 40, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.3, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="display-font hero-title"
            style={{ fontSize: 'clamp(3rem, 13vw, 10rem)', lineHeight: 0.88, color: 'var(--foreground)', letterSpacing: '-0.05em', margin: 0 }}
          >
            WE BUILD<br /><span className="text-gradient-primary">MACHINES.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginTop: '2.5rem', color: 'var(--foreground-muted)', maxWidth: '34rem', margin: '2.5rem auto 0', fontSize: 'clamp(1rem,2.5vw,1.2rem)', fontWeight: 300, lineHeight: 1.7 }}>
            Not just another content generator. We engineer intelligent, high-retention video systems that operate 24/7 — without local hardware or human intervention.
          </motion.p>
        </motion.div>
      </section>

      {/* ─── TICKER ─── */}
      <div style={{ padding: '1.75rem 0', borderTop: '1px solid var(--card-border)', borderBottom: '1px solid var(--card-border)', overflow: 'hidden', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', zIndex: 20, position: 'relative' }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexShrink: 0, paddingRight: '3rem' }}>
              {['YouTube Shorts', 'TikTok', 'Meta Reels', 'AWS Lambda', 'Gemini AI', 'GitHub Actions', 'Supabase'].map((t, j) => (
                <span key={j} className="display-font" style={{ fontSize: '2rem', color: 'var(--foreground-subtle)', textTransform: 'uppercase', letterSpacing: '-0.04em', flexShrink: 0 }}>
                  {t}&nbsp;<span style={{ opacity: 0.5 }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ padding: '12rem 1.5rem', maxWidth: '1400px', margin: '0 auto', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          
          {/* Sticky Left Column for '01' — position:sticky disabled on mobile via CSS */}
          <div className="philosophy-num-col" style={{ position: 'sticky', top: '25vh', zIndex: 0 }}>
            <motion.div {...ANIM_SLIDE_LEFT}>
              <span className="display-font text-gradient" style={{ fontSize: 'clamp(8rem,20vw,16rem)', lineHeight: 0.8, letterSpacing: '-0.05em', marginLeft: '-1rem', display: 'block', opacity: 0.2 }}>01</span>
              <div style={{ width: '100px', height: '4px', background: 'linear-gradient(90deg, #8b5cf6, transparent)', marginTop: '2rem' }} />
            </motion.div>
          </div>

          {/* Scrolling Right Column text */}
          <motion.div
            initial={{ opacity: 0, y: 60, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, margin: "-150px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ paddingTop: '2rem', zIndex: 10, position: 'relative' }}
          >
            <div className="display-font" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: 'var(--foreground)', lineHeight: 1.15, marginBottom: '1.75rem' }}>
              <RevealText text="We removed the human bottleneck from production." />
            </div>
            <p style={{ fontSize: '1.3rem', color: 'var(--foreground-muted)', maxWidth: '40rem', fontWeight: 300, lineHeight: 1.7 }}>
              The Hazy Factory researches, writes, voices, renders, and distributes content entirely autonomously. It is not a tool. It is a highly scalable, serverless digital studio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── INTEGRITY ─── */}
      <section id="integrity" style={{ padding: '9rem 1.5rem', backgroundColor: 'var(--background)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-10%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.07)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div {...ANIM_SLIDE_RIGHT} style={{ marginBottom: '5rem' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>( System Integrity )</span>
            <div className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'var(--foreground)', marginBottom: '1.25rem' }}>
              <RevealText text="Verifiable Precision." />
            </div>
            <p style={{ color: 'var(--foreground-muted)', maxWidth: '38rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Every claim here is backed by observable system behaviour — not marketing copy. These are measurable properties of the pipeline, not projections.
            </p>
          </motion.div>

          <div className="pipeline-grid">
            {INTEGRITY_CARDS.map((card, i) => (
              <motion.div key={i}
                {...ANIM_SCALE_IN}
                transition={{ ...ANIM_SCALE_IN.transition, delay: i * 0.1 }}
                className="glass hover-glow group" style={{ padding: '2.5rem 2rem', borderRadius: '1.25rem' }}>
                <div className="display-font text-gradient-primary" style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem' }}>{card.stat}</div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--foreground)', marginBottom: '0.5rem', fontWeight: 600 }}>{card.label}</h3>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>{card.sub}</p>
                <div style={{ fontSize: '0.75rem', color: 'rgba(139,92,246,0.7)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderTop: '1px solid var(--card-border)', paddingTop: '0.75rem' }}>
                  ↳ {card.note}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── RESULTS ─── */}
      <section id="work" style={{ padding: '9rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '300px', background: 'rgba(139,92,246,0.06)', filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', marginBottom: '5rem' }}
          >
            <span style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.15em', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>( Live Output )</span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'var(--foreground)', marginBottom: '1rem' }}>The Results.</h2>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '1.05rem', maxWidth: '30rem', margin: '0 auto', lineHeight: 1.7 }}>
              Real videos. Real views. Machine-authored, machine-rendered, machine-uploaded.
            </p>
          </motion.div>

          {/* ── 3-Video Portrait Showcase ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem', alignItems: 'end', maxWidth: '960px', margin: '0 auto' }} className="video-showcase-grid">
            {/* Left support video */}
            <motion.div
              {...ANIM_RISE}
              transition={{ ...ANIM_RISE.transition, delay: 0.15 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--card-border)', background: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', aspectRatio: '9/16' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${SHOWCASE_VIDEOS[1].id}?rel=0&modestbranding=1`}
                  title={SHOWCASE_VIDEOS[1].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{SHOWCASE_VIDEOS[1].label}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{SHOWCASE_VIDEOS[1].title}</p>
              </div>
            </motion.div>

            {/* ★ Center "Star of the Show" — featured video */}
            <motion.div
              {...ANIM_RISE}
              transition={{ ...ANIM_RISE.transition, delay: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div style={{ position: 'relative' }}>
                {/* Glow halo under the star video */}
                <div style={{ position: 'absolute', inset: '-12px', borderRadius: '1.5rem', background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(217,70,239,0.2))', filter: 'blur(20px)', zIndex: 0 }} />
                <div style={{ position: 'relative', borderRadius: '1.25rem', overflow: 'hidden', border: '1.5px solid rgba(139,92,246,0.4)', background: '#000', boxShadow: '0 32px 80px rgba(139,92,246,0.25), 0 8px 30px rgba(0,0,0,0.6)', aspectRatio: '9/16', zIndex: 1 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${SHOWCASE_VIDEOS[0].id}?rel=0&modestbranding=1`}
                    title={SHOWCASE_VIDEOS[0].title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                  />
                </div>
              </div>
              <div style={{ padding: '0 0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--secondary)', fontWeight: 700 }}>{SHOWCASE_VIDEOS[0].label}</span>
                  <span style={{ fontSize: '0.6rem', padding: '0.15rem 0.5rem', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.05em' }}>★ FEATURED</span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--foreground)', marginTop: '0.1rem', lineHeight: 1.4, fontWeight: 600 }}>{SHOWCASE_VIDEOS[0].title}</p>
              </div>
            </motion.div>

            {/* Right support video */}
            <motion.div
              {...ANIM_RISE}
              transition={{ ...ANIM_RISE.transition, delay: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}
            >
              <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--card-border)', background: '#000', boxShadow: '0 20px 60px rgba(0,0,0,0.4)', aspectRatio: '9/16' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${SHOWCASE_VIDEOS[2].id}?rel=0&modestbranding=1`}
                  title={SHOWCASE_VIDEOS[2].title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                />
              </div>
              <div style={{ padding: '0 0.25rem' }}>
                <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>{SHOWCASE_VIDEOS[2].label}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--foreground-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{SHOWCASE_VIDEOS[2].title}</p>
              </div>
            </motion.div>
          </div>

          {/* Channel link */}
          <motion.div
            {...ANIM_BLUR_UP}
            transition={{ ...ANIM_BLUR_UP.transition, delay: 0.4 }}
            style={{ textAlign: 'center', marginTop: '3rem' }}
          >
            <a
              href="https://www.youtube.com/@Hazy_Insight/shorts"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--foreground-muted)', border: '1px solid var(--card-border)', padding: '0.6rem 1.4rem', borderRadius: '999px', transition: 'all 0.25s ease', background: 'var(--card-bg)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(139,92,246,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--foreground-muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--card-border)'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              View all Shorts on YouTube
            </a>
          </motion.div>
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section id="machine" style={{ padding: '9rem 1.5rem', backgroundColor: 'var(--card-bg)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '20%', left: '-5%', width: '400px', height: '400px', background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(90px)' }} />
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem', gap: '2rem' }}>
            <motion.h2 {...ANIM_SLIDE_LEFT} className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'var(--foreground)', margin: 0 }}>
              The <br /><span className="text-gradient">Pipeline</span>
            </motion.h2>
            <motion.p {...ANIM_SLIDE_RIGHT} transition={{ ...ANIM_SLIDE_RIGHT.transition, delay: 0.1 }} style={{ color: 'var(--foreground-muted)', maxWidth: '22rem', fontSize: '1.1rem', margin: 0 }}>
              Six discrete stages. Zero human touch. Triggered by GitHub Actions on a schedule or push.
            </motion.p>
          </div>

          <div className="pipeline-grid">
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div key={i}
                {...ANIM_RISE}
                transition={{ ...ANIM_RISE.transition, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="glass group hover-glow"
                style={{ padding: '2rem 1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--background)', position: 'relative', cursor: 'default' }}>
                <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{step.icon}</div>
                <div className="display-font group-hover-primary" style={{ color: 'var(--foreground-subtle)', fontSize: '1rem', transition: 'color 0.3s' }}>{step.num}</div>
                <h3 className="display-font" style={{ fontSize: '1.4rem', color: 'var(--foreground)', margin: 0 }}>{step.title}</h3>
                <p style={{ color: 'var(--foreground-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── METRICS ─── */}
      <section style={{ padding: '9rem 0', borderTop: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '280px', background: 'rgba(217,70,239,0.05)', filter: 'blur(90px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {[
            { value: '24', accent: '/', suffix: '7', label: 'Autonomous Production', color: 'var(--primary)' },
            { value: '0', accent: '.', suffix: '0', label: 'Local Hardware Required', color: 'var(--secondary)' },
          ].map((m, i) => (
            <motion.div key={i}
              {...ANIM_RISE}
              transition={{ ...ANIM_RISE.transition, delay: i * 0.2 }}
              style={{ transformPerspective: 800 }}
            >
              <div className="display-font" style={{ fontSize: 'clamp(4rem,10vw,7.5rem)', color: 'var(--foreground)', letterSpacing: '-0.05em' }}>
                {m.value}<span style={{ color: m.color }}>{m.accent}</span>{m.suffix}
              </div>
              <div style={{ color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.75rem' }}>{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ padding: '9rem 1.5rem', backgroundColor: 'var(--background)', borderTop: '1px solid var(--card-border)', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '30%', right: '-5%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div className="contact-grid">

            {/* ── LEFT — Info Panel ── */}
            <motion.div {...ANIM_SLIDE_LEFT} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '1.25rem' }}>( Start a Conversation )</span>
              <h2 className="display-font" style={{ fontSize: 'clamp(2.8rem,5vw,4.5rem)', color: 'var(--foreground)', marginBottom: '1.25rem', lineHeight: 1.05 }}>
                Scale Your <br /><span className="text-gradient-primary">Vision.</span>
              </h2>
              <p style={{ color: 'var(--foreground-muted)', fontSize: '1.1rem', maxWidth: '26rem', lineHeight: 1.7, marginBottom: '2.5rem' }}>
                Have a content goal, a project idea, or want to understand how the Factory works? Send a message — Kyrell responds within 24 hours.
              </p>

              {/* Feature chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { icon: '⚡', label: '24/7 Autonomous Production', sub: 'Zero human intervention after setup' },
                  { icon: '🌍', label: 'Multi-Platform Distribution', sub: 'YouTube · TikTok · Meta Reels simultaneously' },
                  { icon: '☁️', label: '100% Serverless Rendering', sub: 'AWS Lambda — no local hardware needed' },
                  { icon: '📬', label: 'Response within 24 hours', sub: 'Direct line to the creator' },
                ].map((feat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}
                  >
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                      background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                    }}>{feat.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--foreground)', marginBottom: '0.1rem' }}>{feat.label}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--foreground-muted)' }}>{feat.sub}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── RIGHT — Form Panel ── */}
            <motion.div {...ANIM_SLIDE_RIGHT}>
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
                <div
                  className="glass hover-glow"
                  style={{ padding: '2.5rem', borderRadius: '1.5rem', height: '100%', boxSizing: 'border-box' }}
                >
                  <h3 className="display-font" style={{ fontSize: '1.25rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Send a Message</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--foreground-muted)', marginBottom: '1.75rem', lineHeight: 1.6 }}>Fill in the form and I&apos;ll get back to you shortly.</p>
                  <form onSubmit={handleContact} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--foreground-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Name</label>
                      <input
                        type="text" name="name" required
                        placeholder="e.g. Kyrell Santillan"
                        style={{ padding: '0.9rem 1.1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', width: '100%' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--foreground-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Your Message</label>
                      <textarea
                        name="message" required rows={5}
                        placeholder="Tell us what you're building, your content goal, or what you need help with..."
                        style={{ padding: '0.9rem 1.1rem', borderRadius: '0.75rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '0.95rem', outline: 'none', transition: 'all 0.2s', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.65, minHeight: '130px', width: '100%' }}
                        onFocus={e => { e.target.style.borderColor = 'rgba(139,92,246,0.6)'; e.target.style.background = 'rgba(0,0,0,0.3)'; }}
                        onBlur={e => { e.target.style.borderColor = 'var(--card-border)'; e.target.style.background = 'rgba(0,0,0,0.2)'; }}
                      />
                    </div>
                    <motion.button type="submit"
                      whileHover={{ scale: 1.02, boxShadow: '0 10px 36px rgba(139,92,246,0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                      disabled={contactState === 'loading'}
                      style={{
                        marginTop: '0.5rem',
                        padding: '1rem 2rem', borderRadius: '0.75rem',
                        background: contactState === 'loading' ? 'var(--foreground-subtle)' : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white', fontWeight: 700, fontSize: '1rem',
                        border: 'none', cursor: contactState === 'loading' ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                        transition: 'background 0.3s', width: '100%',
                      }}>
                      {contactState === 'loading' ? (
                        <><span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Sending...</>
                      ) : 'Send Inquiry →'}
                    </motion.button>
                  </form>
                </div>
              )}
            </motion.div>

          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: '0', borderTop: '1px solid var(--card-border)' }}>
        {/* Kyrell identity strip */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', background: 'rgba(139,92,246,0.03)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--foreground-subtle)', letterSpacing: '0.04em', textAlign: 'center', lineHeight: 1.5 }}>
            Engineered by{' '}
            <a href="https://github.com/Hazy019" target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--primary)', fontWeight: 600, transition: 'opacity 0.2s' }}
              onMouseEnter={e => ((e.target as HTMLElement).style.opacity = '0.75')}
              onMouseLeave={e => ((e.target as HTMLElement).style.opacity = '1')}
            >Kyrell Santillan</a>
            {' '}·{' '}
            <span style={{ color: 'var(--foreground-muted)' }}>Aspiring Web Developer & Tech Generalist</span>
          </span>
        </div>
        {/* Main footer row */}
        <div style={{ padding: '1.75rem 1.5rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground-muted)', fontSize: '0.85rem', gap: '1rem' }}>
          <div className="display-font" style={{ fontSize: '1.2rem', color: 'var(--foreground-muted)' }}>HAZY.</div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="/docs" className="nav-link" style={{ fontSize: '0.8rem' }}>Documentation</a>
            <p style={{ margin: 0 }}>© 2026 Designed for scale. Built for performance.</p>
          </div>
        </div>
      </footer>

      <ChatBot />
    </main>
  );
}
