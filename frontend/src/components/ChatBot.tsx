'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = { role: 'user' | 'bot'; text: string };

const SYSTEM_PROMPT = `You are Hazy AI — the intelligent assistant for the Hazy Content Factory, a fully automated, cloud-native video production pipeline. You are professional, concise, and technical when needed.

The Hazy Factory:
- Automatically generates short-form video content for YouTube Shorts, TikTok, and Meta Reels
- Uses Gemini 3.1 for script synthesis with anti-AI-slop protocols
- Uses Edge-TTS for neural voice synthesis with precise word-boundary tracking
- Renders videos using React Remotion on AWS Lambda (serverless, no local hardware)
- Syndicates to all platforms autonomously via a CI/CD pipeline (GitHub Actions)
- Tracks state and recovery with Supabase
- Is 24/7 autonomous — zero human intervention needed

Keep answers short (2-4 sentences). Do not make up specific numbers you aren't sure of. Be confident and professional. If someone asks to collaborate or scale, direct them to the contact section.`;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hi, I\'m Hazy AI. Ask me anything about the Hazy Factory — the pipeline, the tech, or how we can scale your content.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history })
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'I\'m having trouble connecting right now. Please try again in a moment.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ opacity: isOpen ? 0 : 1 }}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem',
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          color: 'white', border: 'none',
          boxShadow: '0 8px 32px rgba(139,92,246,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 100,
          pointerEvents: isOpen ? 'none' : 'auto'
        }}
      >
        <Zap size={22} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.93 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.93 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed', bottom: '2rem', right: '2rem',
              width: '360px', height: '520px',
              display: 'flex', flexDirection: 'column',
              zIndex: 101, borderRadius: '1.25rem', overflow: 'hidden',
              background: 'rgba(8, 8, 12, 0.92)',
              border: '1px solid rgba(139,92,246,0.2)',
              boxShadow: '0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
              backdropFilter: 'blur(24px)'
            }}
          >
            {/* Header */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(139,92,246,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Zap size={16} color="white" />
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, right: 0, width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', border: '2px solid rgba(8,8,12,0.9)', boxShadow: '0 0 6px #22c55e' }}></div>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>Hazy AI</div>
                  <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>Factory Intelligence</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '0.4rem', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}
                >
                  <div style={{
                    padding: '0.65rem 1rem', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: '0.875rem', lineHeight: 1.5, color: 'white'
                  }}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: 'flex-start' }}>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map(d => (
                      <motion.div key={d} animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: d * 0.2 }}
                        style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '0.875rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about the pipeline..."
                disabled={isLoading}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '0.65rem 0.875rem', color: 'white', outline: 'none', fontSize: '0.875rem', transition: 'border-color 0.2s' }}
              />
              <motion.button
                onClick={handleSend}
                whileTap={{ scale: 0.93 }}
                disabled={isLoading || !input.trim()}
                style={{ background: isLoading || !input.trim() ? 'rgba(139,92,246,0.3)' : 'var(--primary)', color: 'white', border: 'none', borderRadius: '10px', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <Send size={16} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
