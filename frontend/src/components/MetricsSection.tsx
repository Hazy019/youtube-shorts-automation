'use client';

import React from 'react';
import { motion } from 'framer-motion';

const METRICS_DATA = [
  {
    value: '< 5ms',
    label: 'Subtitle Sync Drift',
    desc: 'Neural word-boundary event mapping ensures zero caption lag.',
  },
  {
    value: '0',
    label: 'Duplicate Uploads',
    desc: 'Supabase idempotency key hashing guarantees single-dispatch.',
  },
  {
    value: '3',
    label: 'Platforms Streamed',
    desc: 'Parallel syndication to YouTube Shorts, TikTok, and IG Reels.',
  },
  {
    value: '100%',
    label: 'Serverless Stack',
    desc: 'AWS Lambda parallel workers spin up on-demand.',
  },
];

export default function MetricsSection() {
  return (
    <section id="metrics" className="relative py-12 border-y border-white/10 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Sleek 4-Column Proof Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {METRICS_DATA.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="chamfer-card bg-[#11161F] border border-white/10 p-5 relative hover:border-[#AAFF5E]/40 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  {/* Stat Number in Syne Display + Acid Lime */}
                  <span className="font-display text-3xl sm:text-4xl font-extrabold text-[#AAFF5E] tracking-tight">
                    {item.value}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#AAFF5E] opacity-80" />
                </div>

                {/* Stat Label */}
                <h3 className="font-display font-bold text-sm sm:text-base text-white">
                  {item.label}
                </h3>
              </div>

              {/* Description */}
              <p className="font-sans text-xs text-slate-300 leading-relaxed mt-2 pt-2 border-t border-white/5 opacity-75">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
