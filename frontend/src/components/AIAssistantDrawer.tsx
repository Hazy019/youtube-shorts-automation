'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, RotateCcw, Bot } from 'lucide-react';
import LogoMark from './LogoMark';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type Message = {
  id: string;
  sender: 'bot' | 'user';
  text: string;
};

const MAX_CHARS = 350;

const SUGGESTION_POOLS: string[][] = [
  ['How does the pipeline work?', 'What platforms does it post to?', 'How do I self-host on free tier?'],
  ['How fast does AWS Lambda render a video?', 'How does Edge-TTS sync subtitle timestamps?', 'What API keys do I need in .env?'],
];

export default function AIAssistantDrawer({ isOpen, onClose }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "Hey — I'm the Pipeline Assistant. Ask me anything about how the Factory works, the tech behind it, or self-hosting it yourself.",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(12);
  const [poolIndex, setPoolIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>(SUGGESTION_POOLS[0]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend ?? input).trim();
    if (!query || isCooldown || isRateLimited || query.length > MAX_CHARS) return;

    // Immediately update UI with user message
    const userMsgId = Date.now().toString();
    setMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text: query }]);
    if (!textToSend) setInput('');

    setIsTyping(true);
    setIsCooldown(true);
    setTimeout(() => setIsCooldown(false), 1500);

    // Rotate suggestions pool
    const nextPoolIdx = (poolIndex + 1) % SUGGESTION_POOLS.length;
    setSuggestions(SUGGESTION_POOLS[nextPoolIdx]);
    setPoolIndex(nextPoolIdx);

    try {
      // Build past history (last 6 messages)
      const history = messages
        .slice(1)
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }],
        }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setIsRateLimited(true);
        setRemaining(0);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-bot',
            sender: 'bot',
            text: data.reply ?? "You've reached the hourly message limit on this demo. Please wait a bit before chatting again.",
          },
        ]);
        return;
      }

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + '-bot',
            sender: 'bot',
            text: "I'm having a brief connection issue. Try asking again in a moment.",
          },
        ]);
        return;
      }

      const data = await res.json();
      if (typeof data.remaining === 'number') {
        setRemaining(data.remaining);
        if (data.remaining <= 0) setIsRateLimited(true);
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + '-bot', sender: 'bot', text: data.reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + '-bot',
          sender: 'bot',
          text: "Network hiccup on my end — check your connection and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'bot',
        text: "Hey — I'm the Pipeline Assistant. Ask me anything about how the Factory works, the tech behind it, or self-hosting it yourself.",
      },
    ]);
    setSuggestions(SUGGESTION_POOLS[0]);
    setPoolIndex(0);
  };

  if (!isOpen) return null;

  const charsLeft = MAX_CHARS - input.length;
  const isOverCharLimit = charsLeft < 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />

        {/* Q&A Assistant Drawer Container */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed inset-y-0 right-0 w-full max-w-md bg-[#0B0F17] border-l border-white/10 z-50 p-6 shadow-2xl flex flex-col justify-between backdrop-blur-2xl text-slate-200"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 chamfer-card bg-gradient-to-tr from-[#AAFF5E] via-emerald-400 to-violet-500 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full bg-[#0B0F17] chamfer-card flex items-center justify-center">
                  <LogoMark size={22} />
                </div>
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">AI Copilot</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#AAFF5E] font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#AAFF5E] animate-pulse" />
                  <span>Factory Intelligence · Gemini 1.5 Flash</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleNewChat}
                type="button"
                className="chamfer-btn bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 px-3 py-1 flex items-center gap-1 transition-all"
              >
                <RotateCcw className="w-3 h-3 text-[#AAFF5E]" />
                <span>New Chat</span>
              </button>
              <button
                onClick={onClose}
                type="button"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Feed */}
          <div className="flex-1 my-4 overflow-y-auto space-y-4 pr-1">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 chamfer-card bg-[#AAFF5E]/20 border border-[#AAFF5E]/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4 text-[#AAFF5E]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] chamfer-card p-4 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-[#AAFF5E] text-slate-950 font-bold shadow-md'
                      : 'bg-[#11161F] border border-white/10 text-slate-200 shadow-lg'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center text-xs text-slate-400 font-mono">
                <div className="w-7 h-7 chamfer-card bg-[#AAFF5E]/20 border border-[#AAFF5E]/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-[#AAFF5E] animate-spin" />
                </div>
                <span className="animate-pulse">Assistant is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Dynamic Quick Action Prompt Pills */}
          {suggestions.length > 0 && !isRateLimited && (
            <div className="pt-2 pb-3 border-t border-white/10 space-y-1.5">
              <span className="text-[11px] text-slate-400 font-mono">Quick Questions:</span>
              <div className="flex flex-col gap-1.5">
                {suggestions.map((qText) => (
                  <button
                    key={qText}
                    onClick={() => handleSend(qText)}
                    disabled={isCooldown || isRateLimited}
                    className="chamfer-btn text-left text-xs bg-black/60 border border-white/10 hover:border-[#AAFF5E]/50 px-3.5 py-2 text-slate-300 hover:text-[#AAFF5E] transition-colors flex items-center justify-between group disabled:opacity-50"
                  >
                    <span>{qText}</span>
                    <span className="text-[#AAFF5E] font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                      Ask &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="pt-3 border-t border-white/10 space-y-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={
                  isRateLimited
                    ? 'Hourly rate limit reached.'
                    : 'Ask about the pipeline...'
                }
                disabled={isRateLimited || isCooldown}
                className="w-full bg-black/60 border border-white/10 focus:border-[#AAFF5E] rounded-lg pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={() => handleSend()}
                type="button"
                disabled={isRateLimited || isCooldown || !input.trim() || isOverCharLimit}
                className="chamfer-btn absolute right-2 p-2 bg-[#AAFF5E] hover:bg-[#b8ff75] text-slate-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
              <span className={isOverCharLimit ? 'text-red-400 font-bold' : ''}>
                {input.length}/{MAX_CHARS} chars
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border ${
                  !isRateLimited
                    ? 'bg-white/5 border-white/10 text-[#AAFF5E]'
                    : 'bg-red-500/10 border-red-500/30 text-red-400'
                }`}
              >
                {remaining !== null ? `${remaining} req left` : '12 req left'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
