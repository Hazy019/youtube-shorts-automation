'use client';

import React, { useState, useEffect } from 'react';
import LogoMark from './LogoMark';
import { Menu, X, Layers, BookOpen, DollarSign, Mail, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavbarProps {
  onOpenAssistant?: () => void;
  onOpenDocs?: () => void;
}

const SECTIONS = [
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'docs', label: 'Docs' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'contact', label: 'Contact' },
];

export default function Navbar({ onOpenDocs }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('pipeline');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#0B0F17]/90 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        
        {/* Left: Logo Mark + Brand Name: HAZY · ShortsAutomation */}
        <a href="#home" className="flex items-center gap-3 group focus:outline-none rounded-lg">
          <LogoMark size={32} className="group-hover:scale-105 transition-transform" />
          <span className="font-display font-extrabold text-lg sm:text-xl text-white tracking-tight group-hover:text-[#AAFF5E] transition-colors">
            HAZY <span className="text-[#AAFF5E] mx-0.5">·</span> ShortsAutomation
          </span>
        </a>

        {/* Center Links (Desktop Nav: Pipeline · Docs · Pricing · Contact) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {SECTIONS.map(({ id, label }) => {
            const isActive = activeSection === id;
            return (
              <a
                key={id}
                href={`#${id}`}
                className={`flex items-center gap-1.5 transition-colors font-sans ${
                  isActive ? 'text-[#AAFF5E] font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                <span
                  className={`text-xs transition-colors ${
                    isActive ? 'text-[#AAFF5E]' : 'text-slate-600'
                  }`}
                >
                  ▍
                </span>
                <span>{label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Action CTA: GitHub Repo */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/Hazy019/youtube-shorts-automator"
            target="_blank"
            rel="noopener noreferrer"
            className="chamfer-btn bg-[#AAFF5E] hover:bg-[#b8ff75] text-slate-950 font-bold px-5 py-2 text-sm transition-all shadow-[0_0_20px_rgba(170,255,94,0.3)] hover:scale-[1.02] flex items-center gap-2 active:scale-95"
          >
            <Github className="w-4 h-4 fill-slate-950" />
            <span>GitHub Repo</span>
          </a>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          type="button"
          aria-label="Toggle Navigation Menu"
          className="md:hidden p-2 text-slate-300 hover:text-white rounded-lg border border-white/10 bg-white/5"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden pt-4 pb-6 px-6 border-t border-white/10 bg-[#0B0F17]/95 flex flex-col gap-4 overflow-hidden font-medium"
          >
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/5 hover:text-[#AAFF5E]"
            >
              <Layers className="w-4 h-4 text-[#AAFF5E]" />
              <span>Pipeline</span>
            </a>
            <a
              href="#docs"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/5 hover:text-[#AAFF5E]"
            >
              <BookOpen className="w-4 h-4 text-[#AAFF5E]" />
              <span>Docs</span>
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/5 hover:text-[#AAFF5E]"
            >
              <DollarSign className="w-4 h-4 text-[#AAFF5E]" />
              <span>Pricing</span>
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-slate-200 hover:bg-white/5 hover:text-[#AAFF5E]"
            >
              <Mail className="w-4 h-4 text-[#AAFF5E]" />
              <span>Contact</span>
            </a>

            <div className="pt-2">
              <a
                href="https://github.com/Hazy019/youtube-shorts-automator"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="chamfer-btn bg-[#AAFF5E] text-slate-950 font-bold text-center py-2.5 rounded-xl text-sm shadow-[0_0_20px_rgba(170,255,94,0.3)] flex items-center justify-center gap-2 w-full"
              >
                <Github className="w-4 h-4" />
                <span>GitHub Repo</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Integrated Scroll Progress Indicator Bar */}
      <ScrollProgress />
    </header>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const totalHeight = h.scrollHeight - h.clientHeight;
      if (totalHeight > 0) {
        const scrolled = (h.scrollTop / totalHeight) * 100;
        setProgress(scrolled);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="h-[2px] w-full bg-white/5">
      <div
        className="h-full bg-[#AAFF5E] transition-[width] duration-150 ease-out shadow-[0_0_10px_rgba(170,255,94,0.5)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
