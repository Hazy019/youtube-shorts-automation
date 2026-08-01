'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, ArrowRight, ShieldCheck, CheckCircle2, Play, Copy, Check } from 'lucide-react';

interface DocsSectionProps {
  onOpenDocs: () => void;
}

const API_TABS = [
  {
    id: 'generate',
    method: 'POST',
    endpoint: '/api/v1/generate-script',
    title: 'Script Synthesis',
    desc: 'Synthesize viral short-form video script via Google Gemini 1.5 Flash.',
    responseJson: `{
  "status": "success",
  "topic": "Neural Render Engine",
  "script": {
    "hook": "What happens when 64 AWS Lambda workers render a video in 15 seconds?",
    "body": "Sub-5ms Edge-TTS voice sync guarantees zero caption drift across 60fps compositions.",
    "duration_sec": 42
  },
  "idempotency_key": "hash_89f02a3d91"
}`,
  },
  {
    id: 'render',
    method: 'POST',
    endpoint: '/api/v1/render-lambda',
    title: 'Serverless Parallel Render',
    desc: 'Dispatch 1800 frames across 64 concurrent AWS Lambda render workers.',
    responseJson: `{
  "status": "rendering",
  "render_id": "rnd_lambda_99a21b",
  "composition": "ShortVideo_60fps",
  "parallel_workers": 64,
  "estimated_completion_sec": 14.8,
  "output_resolution": "1080x1920"
}`,
  },
  {
    id: 'status',
    method: 'GET',
    endpoint: '/api/v1/pipeline-status',
    title: 'Live Telemetry & Dispatch',
    desc: 'Poll render progress and multi-platform syndication endpoints.',
    responseJson: `{
  "render_id": "rnd_lambda_99a21b",
  "progress": 1.0,
  "status": "completed",
  "dispatched_platforms": {
    "youtube_shorts": "https://youtube.com/shorts/v_9a82b",
    "tiktok": "https://tiktok.com/@hazy/video/71829",
    "instagram_reels": "https://instagram.com/reels/8821a"
  }
}`,
  },
];

export default function DocsSection({ onOpenDocs }: DocsSectionProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const currentTab = API_TABS[activeTab];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTab.responseJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="docs" className="relative py-24 lg:py-32 border-t border-white/10 bg-[#0B0F17] bg-grid-pattern">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#AAFF5E] mb-3">
            <span>▍</span>
            <span>DEVELOPER FIRST API &amp; SCROLL-STOP CODE PANEL</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Live Interactive API Telemetry
          </h2>
          <p className="font-sans text-slate-300 text-base sm:text-lg opacity-80 leading-relaxed">
            Integrate our autonomous video pipeline directly into your applications, CRMs, or scheduled cron bots.
          </p>
        </div>

        {/* Scroll-Stopping Live Code Window (Full Width Feature Card) */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="chamfer-card bg-[#11161F] border border-white/15 p-6 sm:p-8 max-w-5xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden"
        >
          {/* Top Acid Lime Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#AAFF5E]" />

          {/* Top Bar: Tabs & Action Button */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            {/* Method Tabs */}
            <div className="flex flex-wrap items-center gap-2">
              {API_TABS.map((tab, idx) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(idx)}
                  className={`chamfer-btn px-4 py-2 text-xs font-mono transition-all flex items-center gap-2 ${
                    activeTab === idx
                      ? 'bg-[#AAFF5E] text-slate-950 font-bold shadow-[0_0_15px_rgba(170,255,94,0.3)]'
                      : 'bg-black/60 text-slate-300 border border-white/10 hover:border-[#AAFF5E]/40'
                  }`}
                >
                  <span className="font-bold opacity-90">{tab.method}</span>
                  <span>{tab.title}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onOpenDocs}
              type="button"
              className="chamfer-btn bg-white/5 hover:bg-white/10 border border-white/15 text-[#AAFF5E] font-mono text-xs px-4 py-2 flex items-center gap-2 transition-all hover:border-[#AAFF5E]/40"
            >
              <span>View Full API Docs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Endpoint Details */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/60 border border-white/10 rounded-lg px-4 py-3 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-[#AAFF5E] bg-[#AAFF5E]/10 px-2 py-0.5 rounded border border-[#AAFF5E]/20">
                {currentTab.method}
              </span>
              <span className="text-white font-semibold">{currentTab.endpoint}</span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-slate-400 hover:text-[#AAFF5E] transition-colors text-[11px]"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#AAFF5E]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy JSON'}</span>
            </button>
          </div>

          {/* Syntax-Highlighted Real Telemetry Response Panel */}
          <div className="bg-black/90 border border-white/10 rounded-xl p-5 font-mono text-xs overflow-x-auto relative">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-3 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Terminal className="w-3.5 h-3.5 text-[#AAFF5E]" /> 200 OK — JSON Telemetry Payload
              </span>
              <span className="flex items-center gap-1 text-[#AAFF5E]">
                <Play className="w-3 h-3 fill-[#AAFF5E]" /> Live Server Response
              </span>
            </div>

            {/* Real Colored Syntax Token Renderer */}
            <pre className="text-slate-200 leading-relaxed font-mono">
              {currentTab.responseJson.split('\n').map((line, i) => {
                let styledLine = line;
                // Highlight keys
                styledLine = styledLine.replace(/"([^"]+)":/g, '<span class="text-[#AAFF5E] font-semibold">"$1"</span>:');
                // Highlight string values
                styledLine = styledLine.replace(/: "([^"]+)"/g, ': <span class="text-[#38BDF8]">"$1"</span>');
                // Highlight numbers
                styledLine = styledLine.replace(/: ([0-9.]+)/g, ': <span class="text-[#F59E0B] font-bold">$1</span>');
                // Highlight boolean/null
                styledLine = styledLine.replace(/: (true|false|null)/g, ': <span class="text-[#A855F7]">$1</span>');

                return (
                  <div key={i} className="flex gap-4">
                    <span className="text-slate-600 select-none w-6 text-right">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: styledLine }} />
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Bottom Security / Auth Banner */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#AAFF5E]" />
              <span>Bearer Token Auth &amp; Webhook Signatures</span>
            </div>
            <div className="flex items-center gap-4 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#AAFF5E]" /> 120 req/min
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-[#AAFF5E]" /> CORS enabled
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
