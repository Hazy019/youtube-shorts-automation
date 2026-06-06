'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = { role: 'user' | 'bot'; text: string };

const MAX_CHARS = 350;

// Suggestion pools by topic — rotate through these
const SUGGESTION_POOLS: string[][] = [
  [
    'How does the pipeline work?',
    'What platforms does it post to?',
    'How are videos rendered?',
    'How can we collaborate?',
  ],
  [
    'What technologies power the pipeline?',
    'How accurate are the subtitles?',
    'What prevents duplicate uploads?',
    'How does the AI write scripts?',
  ],
  [
    'How is the pipeline triggered?',
    'What happens if a render fails?',
    'Is the code open source?',
    'How fast does it produce content?',
  ],
];

// Extract the follow-up hint from the bot reply (text after "→ You might also ask:")
function extractHint(text: string): string | null {
  const match = text.match(/→\s*You might also ask:\s*(.+)/i);
  return match ? match[1].trim().replace(/["""]/g, '') : null;
}

// Strip the hint line from visible message text
function stripHint(text: string): string {
  return text.replace(/\n?→\s*You might also ask:.+/i, '').trim();
}

const formatMessage = (text: string) => {
  const cleaned = stripHint(text);
  const lines = cleaned.split('\n');
  return lines.map((line, i) => {
    const lineContent = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    return (
      <span key={i}>
        {lineContent}
        {i < lines.length - 1 && '\n'}
      </span>
    );
  });
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi, I'm the Pipeline Assistant — ask me about the pipeline, the tech, or how the Factory can scale your content." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [poolIndex, setPoolIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTION_POOLS[0]);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Rotate to the next suggestion pool, excluding the used question
  const rotateSuggestions = useCallback((usedQuestion: string) => {
    const nextPool = SUGGESTION_POOLS[(poolIndex + 1) % SUGGESTION_POOLS.length];
    // Filter out duplicates with the used question
    const filtered = nextPool.filter(q => q.toLowerCase() !== usedQuestion.toLowerCase());
    setSuggestions(filtered.slice(0, 4));
    setPoolIndex(prev => (prev + 1) % SUGGESTION_POOLS.length);
  }, [poolIndex]);

  const handleSend = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading || isCooldown || isRateLimited) return;
    if (trimmed.length > MAX_CHARS) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);
    setIsCooldown(true);
    setAiHint(null); // Clear previous hint
    rotateSuggestions(trimmed); // Rotate suggestions immediately on send

    setTimeout(() => setIsCooldown(false), 2000);

    try {
      const history = messages.slice(1).slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history })
      });

      if (res.status === 429) {
        const data = await res.json();
        setIsRateLimited(true);
        setMessages(prev => [...prev, {
          role: 'bot',
          text: data.reply ?? "⏱ You've hit the rate limit. Please wait a few minutes before chatting again.",
        }]);
        return;
      }

      if (res.status === 500 || !res.ok) {
        setMessages(prev => [...prev, {
          role: 'bot',
          text: "I'm having a brief connectivity issue on my end. Please try again in a moment.",
        }]);
        return;
      }

      const data = await res.json();
      if (data.remaining !== undefined) setRemaining(data.remaining);

      // Extract AI hint from response and show it as a clickable chip
      const hint = extractHint(data.reply);
      if (hint) setAiHint(hint);

      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: "Looks like there's a network issue. Check your connection and try again.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHintClick = () => {
    if (!aiHint) return;
    const q = aiHint;
    setAiHint(null);
    handleSend(q);
  };

  const charsLeft = MAX_CHARS - input.length;
  const isNearLimit = charsLeft <= 60;
  const isOverLimit = charsLeft < 0;

  return (
    <>
      <AnimatePresence>
        {/* ── Floating trigger button ── */}
        {!isOpen && (
          <motion.button
            key="trigger"
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            whileHover={{ scale: 1.05, boxShadow: '0 12px 40px rgba(139,92,246,0.65)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open Pipeline Assistant"
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100,
              height: '48px',
              paddingLeft: '1rem', paddingRight: '1.25rem',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #7c3aed, #c026d3)',
              border: '1px solid rgba(255,255,255,0.12)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              boxShadow: '0 8px 28px rgba(139,92,246,0.45), 0 2px 8px rgba(0,0,0,0.3)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              overflow: 'visible',
            }}
          >
            {/* Pulse ring */}
            <motion.span
              animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: 0, borderRadius: '999px',
                border: '2px solid rgba(192,38,211,0.5)', pointerEvents: 'none',
              }}
            />
            <Zap size={16} strokeWidth={2.5} />
            <span style={{ fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              Assistant
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className="glass"
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100,
              width: 'min(420px, calc(100vw - 2rem))',
              height: 'min(600px, calc(100vh - 4rem))',
              borderRadius: '1.25rem',
              display: 'flex', flexDirection: 'column',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px var(--card-border)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '1rem 1.25rem', borderBottom: '1px solid var(--card-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(217,70,239,0.06))',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                }}>
                  <Zap size={16} />
                </div>
                <div>
                  <h3 className="display-font" style={{ fontSize: '0.95rem', color: 'var(--foreground)', margin: 0 }}>Assistant</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                    Factory Intelligence · Online
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setMessages([{ role: 'bot', text: "Hi, I'm the Pipeline Assistant — ask me about the pipeline, the tech, or how the Factory can scale your content." }]);
                    setRemaining(null);
                    setSuggestions(SUGGESTION_POOLS[0]);
                    setPoolIndex(0);
                    setAiHint(null);
                    setIsRateLimited(false);
                  }}
                  style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem', borderRadius: '999px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
                >
                  New Chat
                </button>
                <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.125rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  <div style={{
                    maxWidth: '84%', padding: '0.75rem 1rem', borderRadius: msg.role === 'user' ? '1rem 1rem 0.2rem 1rem' : '1rem 1rem 1rem 0.2rem',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--card-bg)',
                    border: msg.role === 'bot' ? '1px solid var(--card-border)' : 'none',
                    color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                    fontSize: '0.875rem', lineHeight: 1.65, whiteSpace: 'pre-wrap',
                    boxShadow: msg.role === 'user' ? '0 4px 16px rgba(139,92,246,0.3)' : 'none',
                  }}>
                    {formatMessage(msg.text)}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '1rem 1rem 1rem 0.2rem', background: 'var(--card-bg)', border: '1px solid var(--card-border)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(j => (
                      <motion.div key={j} animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.15 }}
                        style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)' }} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AI hint as clickable chip — appears after bot response */}
              <AnimatePresence>
                {aiHint && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'flex-start' }}
                  >
                    <button
                      onClick={handleHintClick}
                      style={{
                        fontSize: '0.75rem', padding: '0.45rem 1rem', borderRadius: '999px',
                        background: 'rgba(139,92,246,0.12)',
                        border: '1px solid rgba(139,92,246,0.35)',
                        color: 'var(--primary)', cursor: 'pointer', fontWeight: 600,
                        transition: 'all 0.2s', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        maxWidth: '90%',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.22)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.6)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(139,92,246,0.12)';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.35)';
                      }}
                    >
                      <span style={{ opacity: 0.7 }}>→</span> {aiHint}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '0.75rem 1.125rem', borderTop: '1px solid var(--card-border)', flexShrink: 0, position: 'relative' }}>

              {/* Scrolling suggestion chips — always visible */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex', gap: '0.5rem', marginBottom: '0.65rem',
                    overflowX: 'auto', paddingBottom: '0.25rem',
                    scrollbarWidth: 'none', msOverflowStyle: 'none',
                  }}
                >
                  {suggestions.map((p, idx) => (
                    <motion.button
                      key={`${poolIndex}-${idx}`}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.04, duration: 0.25 }}
                      onClick={() => handleSend(p)}
                      disabled={isLoading || isRateLimited}
                      style={{
                        fontSize: '0.7rem', padding: '0.32rem 0.75rem', borderRadius: '999px',
                        background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                        color: 'var(--foreground-muted)', cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s', whiteSpace: 'nowrap', flexShrink: 0,
                        opacity: isLoading ? 0.4 : 1,
                      }}
                      onMouseEnter={e => {
                        if (!isLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(139,92,246,0.4)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--card-border)';
                      }}
                    >
                      {p}
                    </motion.button>
                  ))}
                </motion.div>
              </AnimatePresence>

              {isRateLimited ? (
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--secondary)', padding: '0.5rem' }}>
                  ⏱ Rate limit reached. Please wait a few minutes.
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <textarea
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask about the pipeline..."
                      disabled={isLoading}
                      rows={1}
                      maxLength={MAX_CHARS}
                      style={{
                        flex: 1, background: 'var(--card-bg)',
                        border: `1px solid ${isOverLimit ? '#ef4444' : 'var(--card-border)'}`,
                        borderRadius: '10px', padding: '0.6rem 0.8rem',
                        color: 'var(--foreground)', outline: 'none', fontSize: '0.845rem',
                        resize: 'none', lineHeight: 1.5, fontFamily: 'inherit',
                        transition: 'border-color 0.2s',
                        minHeight: '38px', maxHeight: '90px', overflow: 'hidden',
                      }}
                    />
                    <motion.button
                      onClick={() => handleSend()}
                      whileTap={{ scale: 0.9 }}
                      disabled={isLoading || isCooldown || !input.trim() || isOverLimit}
                      style={{
                        background: isLoading || isCooldown || !input.trim() || isOverLimit
                          ? 'var(--foreground-subtle)'
                          : 'linear-gradient(135deg, var(--primary), var(--secondary))',
                        color: 'white', border: 'none', borderRadius: '10px',
                        width: '38px', height: '38px', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: isLoading || isCooldown || !input.trim() || isOverLimit ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isLoading || isCooldown || !input.trim() ? 'none' : '0 4px 14px rgba(139,92,246,0.35)',
                      }}
                    >
                      <Send size={15} />
                    </motion.button>
                  </div>
                  <div style={{
                    fontSize: '0.66rem', marginTop: '0.35rem',
                    display: 'flex', justifyContent: 'space-between',
                    transition: 'color 0.2s',
                  }}>
                    <span style={{ color: 'var(--foreground-subtle)', opacity: 0.6 }}>
                      🛡 {remaining !== null ? remaining : 12} of 12 requests left
                    </span>
                    {isNearLimit && (
                      <span style={{ color: isOverLimit ? '#ef4444' : 'var(--foreground-muted)' }}>
                        {charsLeft} chars remaining
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
