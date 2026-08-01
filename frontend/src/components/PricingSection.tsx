'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Github, BookOpen, Sparkles } from 'lucide-react';

interface PricingSectionProps {
  onOpenDocs?: () => void;
}

export default function PricingSection({ onOpenDocs }: PricingSectionProps) {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 bg-[#0B0F17] border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#AAFF5E] mb-3">
            <span>▍</span>
            <span>COMMUNITY FIRST ARCHITECTURE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            100% Free &amp; Open Source Stack
          </h2>
          <p className="font-sans text-slate-300 text-base sm:text-lg opacity-80 leading-relaxed">
            No monthly subscription fees, paywalls, or hidden charges. Built to run entirely on standard developer free tiers.
          </p>
        </div>

        {/* Prominent Single Showcase Card */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="chamfer-card bg-[#11161F] border border-[#AAFF5E]/40 p-8 sm:p-12 max-w-4xl mx-auto shadow-[0_0_40px_rgba(170,255,94,0.12)] relative overflow-hidden"
        >
          {/* Top Acid Lime Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#AAFF5E]" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center mb-10 pb-8 border-b border-white/10">
            <div className="lg:col-span-2">
              <div className="chamfer-card inline-block bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E] text-xs font-mono font-bold px-3.5 py-1 uppercase tracking-wider mb-3">
                LIFETIME OPEN SOURCE
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Zero Subscription Cost Engine
              </h3>
              <p className="font-sans text-sm text-slate-300 mt-2 leading-relaxed opacity-80">
                Run daily video automation using AWS Free Tier (1M requests/mo), Supabase Free Tier (500MB DB), and Edge-TTS neural voice synthesis.
              </p>
            </div>

            {/* Price Display */}
            <div className="chamfer-card bg-black/60 border border-white/10 p-6 text-center lg:text-right">
              <span className="font-display text-5xl sm:text-6xl font-extrabold text-[#AAFF5E] tracking-tight">
                $0
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-1 opacity-70">
                / month lifetime cost
              </span>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
            <div className="chamfer-card flex items-start gap-3 p-4 bg-black/40 border border-white/10">
              <div className="p-1 chamfer-card bg-[#AAFF5E]/20 text-[#AAFF5E] shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-white block">Full Codebase Access</span>
                <span className="text-xs text-slate-300 opacity-75">Complete Python &amp; Remotion source code repository.</span>
              </div>
            </div>

            <div className="chamfer-card flex items-start gap-3 p-4 bg-black/40 border border-white/10">
              <div className="p-1 chamfer-card bg-[#AAFF5E]/20 text-[#AAFF5E] shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-white block">Edge-TTS Neural Voice</span>
                <span className="text-xs text-slate-300 opacity-75">Sub-5ms word timing precision without paid API keys.</span>
              </div>
            </div>

            <div className="chamfer-card flex items-start gap-3 p-4 bg-black/40 border border-white/10">
              <div className="p-1 chamfer-card bg-[#AAFF5E]/20 text-[#AAFF5E] shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-white block">Multi-Platform Dispatch</span>
                <span className="text-xs text-slate-300 opacity-75">Direct YouTube Shorts &amp; TikTok single-channel posting.</span>
              </div>
            </div>

            <div className="chamfer-card flex items-start gap-3 p-4 bg-black/40 border border-white/10">
              <div className="p-1 chamfer-card bg-[#AAFF5E]/20 text-[#AAFF5E] shrink-0 mt-0.5">
                <Check className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <span className="font-bold text-white block">AWS Lambda Free Tier</span>
                <span className="text-xs text-slate-300 opacity-75">Parallel 64-worker serverless frame rendering.</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="https://github.com/Hazy019/youtube-shorts-automator"
              target="_blank"
              rel="noopener noreferrer"
              className="chamfer-btn bg-[#AAFF5E] hover:bg-[#b8ff75] text-slate-950 font-bold px-7 py-3.5 text-sm transition-all shadow-[0_0_25px_rgba(170,255,94,0.3)] flex items-center gap-2 active:scale-95"
            >
              <Github className="w-4 h-4" />
              <span>Clone on GitHub</span>
            </a>

            <button
              onClick={onOpenDocs}
              type="button"
              className="chamfer-btn bg-[#11161F] hover:bg-[#1a202c] text-slate-200 border border-white/15 px-6 py-3.5 text-sm transition-all flex items-center gap-2 hover:border-[#AAFF5E]/40 active:scale-95"
            >
              <BookOpen className="w-4 h-4 text-[#AAFF5E]" />
              <span>Read Self-Hosting Docs</span>
            </button>
          </div>

        </motion.div>

      </div>
    </section>
  );
}
