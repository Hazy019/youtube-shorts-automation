'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, CheckCircle2, Code2, Mic, Layers, Cloud, Database, Send, Zap } from 'lucide-react';

const STAGES = [
  {
    step: '01',
    name: 'Scripting',
    icon: Code2,
    tech: 'Google Gemini 1.5 Flash',
    desc: 'Generates structured short-form viral scripts with custom hooks, pacing, and visual prompts.',
    terminal: `model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content(
  prompt=VIRAL_HOOK_PROMPT + topic,
  generation_config={"temperature": 0.85}
)`,
    featured: false,
  },
  {
    step: '02',
    name: 'TTS Voice',
    icon: Mic,
    tech: 'Neural Edge-TTS',
    desc: 'Synthesizes neural voice audio with word-boundary timestamp markers synced to subtitle frames.',
    terminal: `await edge_tts.Communicate(
  text=script_text,
  voice="en-US-AndrewMultilingualNeural"
).save("audio.mp3")`,
    featured: false,
  },
  {
    step: '03',
    name: 'Remotion React Render',
    icon: Layers,
    tech: 'React Compositions',
    desc: 'Builds dynamic 60fps vertical video compositions with kinetic captions and motion graphic overlays.',
    terminal: `export const HazyShort = () => (
  <Composition
    id="ShortVideo"
    component={VideoLayout}
    durationInFrames={1800}
    fps={60} width={1080} height={1920}
  />
);`,
    featured: false,
  },
  {
    step: '04',
    name: 'AWS Lambda Parallel Render',
    icon: Cloud,
    tech: 'Serverless Render Engine',
    desc: 'Distributes 1800 video frames across 64 parallel AWS Lambda workers in 15 seconds. Solves local hardware render bottlenecks.',
    terminal: `const { renderId } = await renderMediaOnLambda({
  region: "us-east-1",
  functionName: "remotion-render-v2",
  composition: "ShortVideo",
  framesPerLambda: 30,
});`,
    featured: true, // Spotlight Bento Tile
  },
  {
    step: '05',
    name: 'Supabase Log & Vault',
    icon: Database,
    tech: 'Postgres & Storage',
    desc: 'Stores video metadata, idempotency hashes, render logs, and downloadable MP4 artifacts.',
    terminal: `await supabase.from("renders").insert({
  id: renderId,
  topic: topic,
  status: "completed",
  video_url: publicUrl,
});`,
    featured: false,
  },
  {
    step: '06',
    name: 'Multi-Platform Dispatch',
    icon: Send,
    tech: 'YouTube · TikTok · Meta',
    desc: 'Dispatches finalized video in parallel to YouTube Shorts, TikTok API, and Instagram Reels.',
    terminal: `asyncio.gather(
  dispatch_youtube(video_url, title, tags),
  dispatch_tiktok(video_url, title, tags),
  dispatch_instagram_reels(video_url, caption)
);`,
    featured: false,
  },
];

export default function PipelineSection() {
  const [activeStage, setActiveStage] = useState(3);

  return (
    <section id="pipeline" className="relative py-24 lg:py-32 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-[#AAFF5E] mb-3">
            <span>▍</span>
            <span>END-TO-END AUTOMATION PIPELINE</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
            Live Pipeline Architecture
          </h2>
          <p className="font-sans text-slate-300 text-base sm:text-lg opacity-80 leading-relaxed">
            From prompt ingestion to multi-platform delivery in under 45 seconds. Zero manual editing required.
          </p>
        </div>

        {/* Varied Bento Box Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STAGES.map((stage, idx) => {
            const IconComponent = stage.icon;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                onClick={() => setActiveStage(idx)}
                className={`chamfer-card bg-[#11161F] border p-6 relative transition-all duration-300 cursor-pointer group flex flex-col justify-between ${
                  stage.featured
                    ? 'lg:col-span-2 border-[#AAFF5E]/60 shadow-[0_0_35px_rgba(170,255,94,0.15)] bg-[#11161F]'
                    : activeStage === idx
                    ? 'border-[#AAFF5E]/40 shadow-lg bg-[#11161F]'
                    : 'border-white/10 hover:border-[#AAFF5E]/30'
                }`}
              >
                <div>
                  {/* Top Bar inside Card */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-[#AAFF5E] bg-[#AAFF5E]/10 px-2.5 py-1 chamfer-card border border-[#AAFF5E]/20">
                      STAGE {stage.step}
                    </span>
                    {stage.featured && (
                      <span className="font-mono text-[11px] font-bold text-[#AAFF5E] flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-[#AAFF5E]" /> FEATURED BOTTLENECK SOLVER
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-mono opacity-70">{stage.tech}</span>
                  </div>

                  {/* Stage Icon + Title */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-[#AAFF5E] group-hover:bg-[#AAFF5E]/10 group-hover:border-[#AAFF5E]/30 transition-colors">
                      <IconComponent className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    <h3 className="font-display font-bold text-xl text-white group-hover:text-[#AAFF5E] transition-colors">
                      {stage.name}
                    </h3>
                  </div>

                  {/* Stage Description */}
                  <p className="font-sans text-sm text-slate-300 leading-relaxed mb-4 opacity-80">
                    {stage.desc}
                  </p>
                </div>

                {/* Embedded Monospace Terminal Snippet */}
                <div className="bg-black/70 border border-white/10 rounded-lg p-3.5 font-mono text-xs text-[#AAFF5E] overflow-x-auto">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 pb-1 border-b border-white/10 font-mono">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Terminal className="w-3 h-3 text-[#AAFF5E]" /> execution snippet
                    </span>
                    <span className="flex items-center gap-1 text-[#AAFF5E]">
                      <CheckCircle2 className="w-3 h-3" /> verified
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-[11px]">{stage.terminal}</pre>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
