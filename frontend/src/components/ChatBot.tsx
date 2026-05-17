'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Zap, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = { role: 'user' | 'bot'; text: string };

const MAX_CHARS = 350;
const SUGGESTED_PROMPTS = [
  'How does the pipeline work?',
  'What platforms does it post to?',
  'How are videos rendered?',
  'How can we collaborate?',
];

const formatMessage = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isHint = line.trim().startsWith('→');
    const lineContent = line.split(/(\*\*.*?\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
    
    return (
      <span key={i} style={isHint ? { color: 'var(--primary)', fontWeight: 600 } : undefined}>
        {lineContent}
        {i < lines.length - 1 && '\n'}
      </span>
    );
  });
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: "Hi, I'm Hazy AI — ask me about the pipeline, the tech, or how the Factory can scale your content." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Hide suggestions after first user message
  useEffect(() => {
    if (messages.some(m => m.role === 'user')) {
      setShowSuggestions(false);
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || isLoading || isCooldown || isRateLimited) return;
    if (trimmed.length > MAX_CHARS) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);
    setIsCooldown(true);
    
    // Release cooldown after 2 seconds to prevent spam
    setTimeout(() => setIsCooldown(false), 2000);

    try {
      // Skip the initial bot greeting (index 0) — Gemini requires history to start with 'user'
      // Only send last 6 messages after the greeting to control token usage
      const history = messages.slice(1).slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history })
      });

      const data = await res.json();

      if (res.status === 429 || data.rateLimited) {
        setIsRateLimited(true);
        setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
        return;
      }

      if (data.remaining !== undefined) setRemaining(data.remaining);
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const charsLeft = MAX_CHARS - input.length;
  const isNearLimit = charsLeft <= 60;
  const isOverLimit = charsLeft < 0;

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="trigger"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            whileHover={{ scale: 1.1, boxShadow: '0 12px 40px rgba(139,92,246,0.6)' }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem',
              height: '56px', borderRadius: '28px', padding: '0 20px',
              background: 'linear-gradient(135deg, #8b5cf6, #d946ef)',
              color: 'white', border: 'none',
              boxShadow: '0 8px 28px rgba(139,92,246,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              cursor: 'pointer', zIndex: 100,
            }}
          >
            <Zap size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }} className="hide-mobile">Hazy AI</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Chat Window ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chatwindow"
            initial={{ opacity: 0, y: 32, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem',
              width: 'min(380px, calc(100vw - 2rem))',
              height: '540px',
              display: 'flex', flexDirection: 'column',
              zIndex: 101, borderRadius: '1.25rem', overflow: 'hidden',
              background: 'var(--nav-bg)',
              border: '1px solid var(--card-border)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 60px rgba(139,92,246,0.1)',
              backdropFilter: 'blur(28px)',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '0.875rem 1.125rem',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'var(--background)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Zap size={14} color="white" />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 0, right: '-1px',
                    width: '9px', height: '9px', borderRadius: '50%',
                    background: '#22c55e', border: '2px solid var(--background)',
                    boxShadow: '0 0 6px rgba(34,197,94,0.8)',
                  }} />
                </div>
                <div>
                  <h3 className="display-font" style={{ fontSize: '0.95rem', color: 'var(--foreground)', margin: 0 }}>Hazy AI</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    Factory Intelligence · Online
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    setMessages([{ role: 'bot', text: "Hi, I'm Hazy AI — ask me about the pipeline, the tech, or how the Factory can scale your content." }]);
                    setRemaining(null);
                    setShowSuggestions(true);
                  }}
                  style={{
                    background: 'transparent', border: 'none',
                    fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  New Chat
                </button>
                {remaining !== null && remaining <= 3 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    {remaining} left
                  </span>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  style={{
                    background: 'var(--card-bg)', border: '1px solid var(--card-border)',
                    borderRadius: '8px', padding: '0.375rem',
                    color: 'var(--foreground-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '0.875rem',
              display: 'flex', flexDirection: 'column', gap: '0.625rem',
            }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}
                >
                  <div style={{
                    padding: '0.6rem 0.9rem',
                    borderRadius: msg.role === 'user' ? '14px 14px 3px 14px' : '3px 14px 14px 14px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                      : 'var(--card-bg)',
                    color: msg.role === 'user' ? 'white' : 'var(--foreground)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--card-border)',
                    fontSize: '0.845rem', lineHeight: 1.55,
                    boxShadow: msg.role === 'user' ? '0 4px 15px rgba(139,92,246,0.3)' : 'none',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}>
                    {formatMessage(msg.text)}
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ alignSelf: 'flex-start' }}
                >
                  <div style={{
                    padding: '0.7rem 1rem', borderRadius: '3px 14px 14px 14px',
                    background: 'var(--card-bg)',
                    border: '1px solid var(--card-border)',
                    display: 'flex', gap: '4px', alignItems: 'center',
                  }}>
                    {[0, 1, 2].map(d => (
                      <motion.div
                        key={d}
                        animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: d * 0.18, ease: 'easeInOut' }}
                        style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--primary)' }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '0.75rem 1.125rem', borderTop: '1px solid var(--card-border)', flexShrink: 0, position: 'relative' }}>
              {showSuggestions && messages.length < 2 && (
                <div style={{ position: 'absolute', bottom: '100%', left: '0.75rem', right: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {SUGGESTED_PROMPTS.map(p => (
                    <button key={p} onClick={() => handleSend(p)} style={{ fontSize: '0.72rem', padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--foreground-muted)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
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
                        minHeight: '38px', maxHeight: '90px',
                        overflow: 'hidden',
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
                  {isNearLimit && (
                    <div style={{
                      fontSize: '0.68rem', textAlign: 'right',
                      color: isOverLimit ? '#ef4444' : 'var(--foreground-muted)',
                      transition: 'color 0.2s',
                    }}>
                      {charsLeft} characters remaining
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
