'use client';

import React, { useState } from 'react';
import LogoMark from './LogoMark';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface FloatingWidgetProps {
  onOpenAssistant: () => void;
}

export default function FloatingWidget({ onOpenAssistant }: FloatingWidgetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
      {/* Tooltip on Hover */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          className="bg-[#11161F] border border-white/15 text-white text-xs font-mono px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 pointer-events-none"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#AAFF5E]" />
          <span>AI Copilot (Cmd+K)</span>
        </motion.div>
      )}

      {/* Pure Circular Glass Button (No square clip-path, un-clipped indicator dot) */}
      <button
        onClick={onOpenAssistant}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        type="button"
        aria-label="Open AI Copilot"
        className="relative group w-12 h-12 rounded-full bg-[#11161F] backdrop-blur-xl border border-[#AAFF5E]/40 text-white shadow-[0_0_25px_rgba(170,255,94,0.35)] hover:border-[#AAFF5E] hover:scale-105 transition-all duration-300 active:scale-95 flex items-center justify-center overflow-visible"
      >
        <LogoMark size={24} className="drop-shadow-[0_0_10px_rgba(170,255,94,0.5)]" />

        {/* Pulsing indicator dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#AAFF5E] rounded-full border-2 border-[#0B0F17] shadow-[0_0_8px_rgba(170,255,94,0.8)] animate-pulse z-10" />
      </button>
    </div>
  );
}
