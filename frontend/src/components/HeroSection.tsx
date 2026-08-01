'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Github } from 'lucide-react';

interface HeroSectionProps {
  onOpenAssistant?: () => void;
}

export default function HeroSection({ onOpenAssistant }: HeroSectionProps) {
  return (
    <section id="home" className="bg-[#0B0F17] bg-grid-pattern relative min-h-screen w-full overflow-hidden flex items-center justify-center p-6 pt-24 md:p-12 md:pt-28">
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">

        {/* 📄 LEFT COLUMN: CONTENT & ACTION MATRIX */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-start gap-6 max-w-xl z-10"
        >
          {/* Version Badge */}
          <div className="chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E] font-mono text-xs font-semibold px-3.5 py-1.5 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#AAFF5E] animate-pulse" />
            <span>AUTONOMOUS ENGINE V2.0</span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white tracking-tight leading-[1.08]">
            Zero Human Edit.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AAFF5E] via-lime-200 to-emerald-400 block sm:inline">
              Pure Content Scale.
            </span>
          </h1>

          {/* Subtitle Paragraph */}
          <p className="font-sans text-slate-300 text-base sm:text-lg leading-relaxed font-normal max-w-lg">
            A fully autonomous serverless video pipeline. Script, voice, render, and publish viral short-form content to YouTube 24/7.
          </p>

          {/* Action Button Group (Exactly 2 Buttons) */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {/* Primary CTA */}
            <a
              href="#contact"
              className="chamfer-btn bg-[#AAFF5E] hover:bg-[#b8ff75] text-slate-950 font-extrabold px-7 py-3.5 text-base shadow-[0_0_25px_rgba(170,255,94,0.35)] flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <Play className="w-4 h-4 fill-slate-950 group-hover:scale-110 transition-transform" />
              <span>Scale Together</span>
            </a>

            {/* Secondary CTA */}
            <a
              href="https://github.com/Hazy019/youtube-shorts-automator"
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn bg-[#11161F] hover:bg-[#1a202c] border border-white/10 text-white font-medium px-6 py-3.5 text-base transition-all hover:border-[#AAFF5E]/40 hover:scale-[1.02] active:scale-95 flex items-center gap-2"
            >
              <Github className="w-4 h-4" />
              <span>View GitHub Repo</span>
            </a>
          </div>

          {/* Supported Output Destinations with Active YouTube Channel Link */}
          <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-slate-400 w-full">
            <span className="font-mono text-slate-500 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <span className="text-[#AAFF5E]">▍</span> SUPPORTED PLATFORMS:
            </span>
            <div className="flex items-center gap-4 text-slate-300 font-medium">
              <a
                href="https://www.youtube.com/@Hazy_Insight"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors group"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 group-hover:scale-125 transition-transform" />
                <span className="underline decoration-red-500/50 underline-offset-2">YouTube Shorts</span>
              </a>
              <span className="flex items-center gap-1.5 opacity-80">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> TikTok
              </span>
              <span className="flex items-center gap-1.5 opacity-80">
                <span className="w-1.5 h-1.5 rounded-full bg-pink-500" /> Instagram Reels
              </span>
            </div>
          </div>
        </motion.div>

        {/* 📱 RIGHT COLUMN: RESPONSIVE HERO MOCKUP INTEGRATION WITH SVG ARCS & GLASS PILLS */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[480px] aspect-[5/6] flex items-center justify-center z-10 mx-auto select-none"
        >
          {/* Ambient Radial Backlight */}
          <div className="absolute -z-0 w-[80%] h-[80%] bg-[#AAFF5E]/30 blur-[100px] rounded-full pointer-events-none" />

          {/* Dynamically Scaling SVG Connecting Arcs */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
            viewBox="0 0 500 600"
            fill="none"
            preserveAspectRatio="xMidYMid meet"
          >
            <path
              d="M 45 75 Q 40 140 160 140"
              stroke="#AAFF5E"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.65"
            />
            <path
              d="M 355 260 C 500 290, 430 150, 440 120"
              stroke="#AAFF5E"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.65"
            />
            <path
              d="M 330 365 C 480 340, 450 380, 440 430"
              stroke="#AAFF5E"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.65"
            />
          </svg>

          {/* Phone Device Asset */}
          <img
            src="/Iphone Mockup.png"
            alt="Shorts Automation Hero Phone"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_25px_60px_rgba(0,0,0,0.95)] transform hover:scale-[1.01] transition-transform duration-500"
          />

          {/* Floating Glass Pills */}
          <div className="chamfer-card absolute top-[6%] left-[-4%] sm:left-[-10%] bg-[#11161F]/90 border border-white/15 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono text-slate-200 shadow-2xl z-30 pointer-events-auto hover:border-[#AAFF5E]/40 transition-colors whitespace-nowrap">
            AWS Lambda • Parallel Render
          </div>

          <div className="chamfer-card absolute top-[18%] right-[-4%] sm:right-[-10%] bg-[#11161F]/90 border border-white/15 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono text-slate-200 shadow-2xl z-30 pointer-events-auto hover:border-[#AAFF5E]/40 transition-colors whitespace-nowrap">
            Supabase • State Engine
          </div>

          <div className="chamfer-card absolute bottom-[22%] right-[-2%] sm:right-[-8%] bg-[#11161F]/90 border border-white/15 backdrop-blur-md px-3.5 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono text-slate-200 shadow-2xl z-30 pointer-events-auto hover:border-[#AAFF5E]/40 transition-colors whitespace-nowrap">
            Remotion • React Video
          </div>
        </motion.div>

      </div>
    </section>
  );
}
