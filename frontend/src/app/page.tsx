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

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end end'] });
  const [isScrolled, setIsScrolled] = useState(false);
  const [contactState, setContactState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [email, setEmail] = useState('');
  const [latestVideoId, setLatestVideoId] = useState<string | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [starCount, setStarCount] = useState<string>('...');

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
    
    // Fetch the latest video from our dynamic API route
    fetch('/api/latest-video')
      .then(res => res.json())
      .then(data => {
        if (data.videoId) setLatestVideoId(data.videoId);
      })
      .catch(err => console.error('Failed to load latest video:', err));

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
  
  // Results section parallax scale down
  const resultsScale = useTransform(scrollYProgress, [0.3, 0.6], [1, 0.92]);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Open mailto with the user's email pre-filled
    const subject = encodeURIComponent('Collaboration Inquiry — Hazy Content Factory');
    const body = encodeURIComponent(`Hi,\n\nI'm interested in learning more about the Hazy Content Factory and potential collaboration.\n\nReach me at: ${email}\n\nLooking forward to hearing from you.`);
    window.open(`mailto:hazyinsight@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setContactState('done');
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
          <a href="#contact" className="nav-cta">Scale Together</a>
        </div>
      </motion.nav>

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
          
          {/* Sticky Left Column for '01' */}
          <div style={{ position: 'sticky', top: '25vh' }}>
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
            style={{ paddingTop: '2rem' }}
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
      <section id="work" style={{ padding: '9rem 0', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
          <motion.div
            initial={{ opacity: 0, letterSpacing: '0.4em' }}
            whileInView={{ opacity: 1, letterSpacing: '0em' }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            style={{ textAlign: 'center', marginBottom: '4rem' }}
          >
            <span style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>( Output )</span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'var(--foreground)' }}>The Results.</h2>
          </motion.div>
          
          {/* Scroll-linked scale parallax for video container */}
          <motion.div
            style={{ 
              scale: resultsScale,
              borderRadius: '1.5rem', overflow: 'hidden', padding: 'clamp(1rem,3vw,2rem)', 
              aspectRatio: '16/9', maxWidth: '56rem', margin: '0 auto', 
              boxShadow: '0 0 80px rgba(139,92,246,0.15)',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              backdropFilter: 'blur(20px)'
            }}>
            <iframe width="100%" height="100%"
              src={latestVideoId ? `https://www.youtube.com/embed/${latestVideoId}` : "https://www.youtube.com/embed/videoseries?list=UUize2SQoXPI6RFQYbIGemIg"}
              title="Hazy Insight Videos" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ borderRadius: '0.75rem', background: 'rgba(0,0,0,0.5)' }} />
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
      <section id="contact" style={{ padding: '9rem 1.5rem', backgroundColor: 'var(--background)', borderTop: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div {...ANIM_BLUR_UP}>
            <h2 className="display-font" style={{ fontSize: 'clamp(3rem,8vw,5rem)', color: 'var(--foreground)', marginBottom: '1.25rem', lineHeight: 1 }}>
              Scale Your <br /><span className="text-gradient-primary">Vision.</span>
            </h2>
            <p style={{ color: 'var(--foreground-muted)', fontSize: '1.15rem', maxWidth: '30rem', margin: '0 auto 3rem', lineHeight: 1.7 }}>
              Stop managing creators. Start managing infrastructure. Enter your email and click the button — it will open your mail client with a pre-filled message sent directly to us.
            </p>

            {contactState === 'done' ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: '1.1rem', fontWeight: 600 }}>
                ✓ Received. We'll be in touch shortly.
              </motion.div>
            ) : (
              <form onSubmit={handleContact} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <motion.input
                  whileFocus={{ scale: 1.02, borderColor: 'rgba(139,92,246,0.5)', boxShadow: '0 0 0 4px rgba(139,92,246,0.1)' }}
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ flex: '1 1 220px', maxWidth: '320px', padding: '0.875rem 1.25rem', borderRadius: '999px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground)', fontSize: '1rem', outline: 'none', transition: 'all 0.2s ease' }}
                />
                <motion.button type="submit"
                  whileHover={{ scale: 1.05, boxShadow: '0 8px 32px rgba(139,92,246,0.45)' }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  style={{
                    padding: '0.875rem 2.25rem', borderRadius: '999px',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    color: 'white', fontWeight: 800, fontSize: '0.95rem',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    boxShadow: '0 4px 20px rgba(139,92,246,0.3)',
                  }}>
                  Initialize Contact ↗
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: '2.5rem 1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', color: 'var(--foreground-muted)', fontSize: '0.85rem' }}>
        <div className="display-font" style={{ fontSize: '1.2rem', color: 'var(--foreground-muted)' }}>HAZY.</div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="/docs" className="nav-link" style={{ fontSize: '0.8rem' }}>Documentation</a>
          <p style={{ margin: 0 }}>© 2026 Designed for scale. Built for performance.</p>
        </div>
      </footer>

      <ChatBot />
    </main>
  );
}
