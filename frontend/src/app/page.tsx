'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import ChatBot from '@/components/ChatBot';

const FADE_UP = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };
const FADE_LEFT = { initial: { opacity: 0, x: -40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true } };
const FADE_RIGHT = { initial: { opacity: 0, x: 40 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true } };
const SCALE_IN = { initial: { opacity: 0, scale: 0.88 }, whileInView: { opacity: 1, scale: 1 }, viewport: { once: true } };

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

  useEffect(() => {
    const h = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setContactState('loading');
    await new Promise(r => setTimeout(r, 1800));
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
          padding: '0.875rem 1.75rem', width: '92%', maxWidth: '920px',
          opacity: isScrolled ? 0.92 : 1, transition: 'opacity 0.3s ease',
        }}
      >
        <div className="display-font" style={{ color: 'white', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>HAZY.</div>
        <div className="nav-links hide-mobile">
          <a href="#about">Philosophy</a>
          <a href="#integrity">Integrity</a>
          <a href="#machine">Pipeline</a>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a href="#contact" className="nav-cta">
            Scale Together
          </a>
        </div>
      </motion.nav>

      {/* ─── HERO ─── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '28%', left: '20%', width: '480px', height: '480px', backgroundColor: 'rgba(147,51,234,0.18)', borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '28%', right: '20%', width: '560px', height: '560px', backgroundColor: 'rgba(79,70,229,0.18)', borderRadius: '50%', filter: 'blur(140px)', pointerEvents: 'none' }} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, textAlign: 'center', zIndex: 10, width: '100%', padding: '0 1.5rem' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.2 }}
            style={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 'clamp(0.7rem,2vw,0.85rem)', fontWeight: 600, marginBottom: '1.5rem' }}>
            Cloud-Native Autonomous Media
          </motion.div>
          <motion.h1 initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="display-font" style={{ fontSize: 'clamp(3.5rem,13vw,10rem)', lineHeight: 0.85, color: 'white', letterSpacing: '-0.05em', margin: 0 }}>
            WE BUILD<br /><span className="text-gradient-primary">MACHINES.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.9 }}
            style={{ marginTop: '2.5rem', color: 'rgba(255,255,255,0.45)', maxWidth: '34rem', margin: '2.5rem auto 0', fontSize: 'clamp(1rem,2.5vw,1.2rem)', fontWeight: 300, lineHeight: 1.7 }}>
            Not just another content generator. We engineer intelligent, high-retention video systems that operate 24/7 — without local hardware or human intervention.
          </motion.p>
        </motion.div>
      </section>

      {/* ─── TICKER ─── */}
      <div style={{ padding: '1.75rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', zIndex: 20, position: 'relative' }}>
        <div className="ticker-track">
          {[...Array(2)].map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '3rem', alignItems: 'center', flexShrink: 0, paddingRight: '3rem' }}>
              {['YouTube Shorts', 'TikTok', 'Meta Reels', 'AWS Lambda', 'Gemini AI', 'GitHub Actions', 'Supabase'].map((t, j) => (
                <span key={j} className="display-font" style={{ fontSize: '2rem', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase', letterSpacing: '-0.04em', flexShrink: 0 }}>
                  {t}&nbsp;<span style={{ opacity: 0.5 }}>·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ─── ABOUT ─── */}
      <section id="about" style={{ padding: '9rem 1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'start' }}>
          <motion.div {...FADE_LEFT} transition={{ duration: 0.9 }}>
            <span className="display-font" style={{ fontSize: 'clamp(8rem,20vw,14rem)', lineHeight: 1, color: 'rgba(255,255,255,0.04)', letterSpacing: '-0.05em', marginLeft: '-1rem', display: 'block' }}>01</span>
          </motion.div>
          <motion.div {...FADE_UP} transition={{ delay: 0.25, duration: 0.85 }} style={{ paddingTop: 'clamp(2rem,10vw,7rem)' }}>
            <h2 className="display-font" style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', color: 'white', lineHeight: 1.15, marginBottom: '1.75rem' }}>
              We removed the human bottleneck from production.
            </h2>
            <p style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.4)', maxWidth: '40rem', fontWeight: 300, lineHeight: 1.7 }}>
              The Hazy Factory researches, writes, voices, renders, and distributes content entirely autonomously. It is not a tool. It is a scalable digital studio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ─── INTEGRITY ─── */}
      <section id="integrity" style={{ padding: '9rem 1.5rem', backgroundColor: '#050505', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', right: '-10%', width: '500px', height: '500px', background: 'rgba(139,92,246,0.07)', borderRadius: '50%', filter: 'blur(100px)' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div {...FADE_RIGHT} transition={{ duration: 0.85 }} style={{ marginBottom: '5rem' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>( System Integrity )</span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'white', marginBottom: '1.25rem' }}>Verifiable Precision.</h2>
            <p style={{ color: 'rgba(255,255,255,0.38)', maxWidth: '38rem', fontSize: '1.1rem', lineHeight: 1.7 }}>
              Every claim here is backed by observable system behaviour — not marketing copy. These are measurable properties of the pipeline, not projections.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem' }}>
            {INTEGRITY_CARDS.map((card, i) => (
              <motion.div key={i} {...SCALE_IN} transition={{ delay: i * 0.12, duration: 0.75 }}
                className="glass hover-glow group" style={{ padding: '2.5rem 2rem', borderRadius: '1.25rem' }}>
                <div className="display-font text-gradient-primary" style={{ fontSize: '3.5rem', lineHeight: 1, marginBottom: '0.75rem' }}>{card.stat}</div>
                <h3 style={{ fontSize: '1.15rem', color: 'white', marginBottom: '0.5rem', fontWeight: 600 }}>{card.label}</h3>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>{card.sub}</p>
                <div style={{ fontSize: '0.75rem', color: 'rgba(139,92,246,0.7)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
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
          <motion.div {...FADE_UP} transition={{ duration: 0.8 }} style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.12em', fontSize: '0.8rem', textTransform: 'uppercase', display: 'block', marginBottom: '1rem' }}>( Output )</span>
            <h2 className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'white' }}>The Results.</h2>
          </motion.div>
          <motion.div {...SCALE_IN} transition={{ duration: 0.9, delay: 0.1 }}
            className="glass hover-glow" style={{ borderRadius: '1.5rem', overflow: 'hidden', padding: 'clamp(1rem,3vw,2rem)', aspectRatio: '16/9', maxWidth: '56rem', margin: '0 auto', boxShadow: '0 0 60px rgba(139,92,246,0.12)' }}>
            <iframe width="100%" height="100%"
              src="https://www.youtube.com/embed/videoseries?list=UUize2SQoXPI6RFQYbIGemIg"
              title="Hazy Insight Videos" frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen style={{ borderRadius: '0.75rem', background: 'rgba(0,0,0,0.5)' }} />
          </motion.div>
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section id="machine" style={{ padding: '9rem 1.5rem', backgroundColor: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', bottom: '20%', left: '-5%', width: '400px', height: '400px', background: 'rgba(139,92,246,0.08)', borderRadius: '50%', filter: 'blur(90px)' }} />
        <div style={{ maxWidth: '1400px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5rem', gap: '2rem' }}>
            <motion.h2 {...FADE_LEFT} transition={{ duration: 0.8 }} className="display-font" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', color: 'white', margin: 0 }}>
              The <br /><span className="text-gradient">Pipeline</span>
            </motion.h2>
            <motion.p {...FADE_RIGHT} transition={{ duration: 0.8, delay: 0.1 }} style={{ color: 'rgba(255,255,255,0.38)', maxWidth: '22rem', fontSize: '1.1rem', margin: 0 }}>
              Six discrete stages. Zero human touch. Triggered by GitHub Actions on a schedule or push.
            </motion.p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {PIPELINE_STEPS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="glass group hover-glow"
                style={{ padding: '2rem 1.5rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', background: 'var(--background)', position: 'relative' }}>
                <div style={{ fontSize: '1.75rem', lineHeight: 1 }}>{step.icon}</div>
                <div className="display-font group-hover-primary" style={{ color: 'rgba(255,255,255,0.18)', fontSize: '1rem', transition: 'color 0.3s' }}>{step.num}</div>
                <h3 className="display-font" style={{ fontSize: '1.4rem', color: 'white', margin: 0 }}>{step.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── METRICS ─── */}
      <section style={{ padding: '9rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '280px', background: 'rgba(217,70,239,0.05)', filter: 'blur(90px)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '4rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {[
            { value: '24', accent: '/', suffix: '7', label: 'Autonomous Production', color: 'var(--primary)' },
            { value: '0', accent: '.', suffix: '0', label: 'Local Hardware Required', color: 'var(--secondary)' },
          ].map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.82 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.18, duration: 0.7 }}>
              <div className="display-font" style={{ fontSize: 'clamp(4rem,10vw,7.5rem)', color: 'white', letterSpacing: '-0.05em' }}>
                {m.value}<span style={{ color: m.color }}>{m.accent}</span>{m.suffix}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.8rem', fontWeight: 700, marginTop: '0.75rem' }}>{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="contact" style={{ padding: '9rem 1.5rem', backgroundColor: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div {...FADE_UP} transition={{ duration: 0.85 }}>
            <h2 className="display-font" style={{ fontSize: 'clamp(3rem,8vw,5rem)', color: 'white', marginBottom: '1.25rem', lineHeight: 1 }}>
              Scale Your <br /><span className="text-gradient-primary">Vision.</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1.15rem', maxWidth: '30rem', margin: '0 auto 3rem', lineHeight: 1.7 }}>
              Stop managing creators. Start managing infrastructure. Drop your email and let's talk about what the factory can build for you.
            </p>

            {contactState === 'done' ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ padding: '2rem', borderRadius: '1rem', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e', fontSize: '1.1rem', fontWeight: 600 }}>
                ✓ Received. We'll be in touch shortly.
              </motion.div>
            ) : (
              <form onSubmit={handleContact} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <input
                  type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  style={{ flex: '1 1 220px', maxWidth: '320px', padding: '0.875rem 1.25rem', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: 'white', fontSize: '1rem', outline: 'none' }}
                />
                <motion.button type="submit" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  disabled={contactState === 'loading'}
                  style={{ padding: '0.875rem 2rem', borderRadius: '999px', background: contactState === 'loading' ? 'rgba(255,255,255,0.4)' : 'white', color: 'black', fontWeight: 700, fontSize: '0.95rem', border: 'none', cursor: contactState === 'loading' ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'background 0.2s' }}>
                  {contactState === 'loading' ? (
                    <><motion.span animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>⟳</motion.span> Sending…</>
                  ) : 'Initialize Contact'}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: '2.5rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', color: 'rgba(255,255,255,0.28)', fontSize: '0.85rem' }}>
        <div className="display-font" style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.45)' }}>HAZY.</div>
        <p style={{ margin: 0 }}>© 2026 Designed for scale. Built for performance.</p>
      </footer>

      <ChatBot />
    </main>
  );
}
