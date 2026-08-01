'use client';

import React from 'react';
import LogoMark from './LogoMark';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0B0F17] py-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6">

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <LogoMark size={32} />
              <span className="font-display font-extrabold text-lg text-white tracking-tight">
                HAZY <span className="text-[#AAFF5E] mx-0.5">·</span> ShortsAutomation
              </span>
            </div>
            <p className="font-sans text-sm text-slate-300 max-w-sm leading-relaxed opacity-75">
              A fully autonomous serverless video pipeline. Script, voice, render, and publish short-form content to YouTube, TikTok, and Instagram 24/7.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#AAFF5E] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#AAFF5E] animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Navigation Links - Unified Vocabulary with Header */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="font-sans space-y-2 text-sm text-slate-300 opacity-80">
              <li>
                <a href="#pipeline" className="hover:text-[#AAFF5E] transition-colors">
                  Pipeline
                </a>
              </li>
              <li>
                <a href="#docs" className="hover:text-[#AAFF5E] transition-colors">
                  Docs
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-[#AAFF5E] transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-[#AAFF5E] transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Open Source / Community */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-xs text-white uppercase tracking-wider">
              Community &amp; Code
            </h4>
            <ul className="font-sans space-y-2 text-sm text-slate-300 opacity-80">
              <li>
                <a
                  href="https://github.com/Hazy019/youtube-shorts-automator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#AAFF5E] transition-colors flex items-center gap-2"
                >
                  <Github className="w-4 h-4" /> GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://hazy.cosedevs.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#AAFF5E] transition-colors"
                >
                  Architect Portfolio
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>
            &copy; {new Date().getFullYear()} HAZY · ShortsAutomation by Kyrell Santillan. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Security
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
