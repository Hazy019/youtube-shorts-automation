'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Send, Sparkles, MessageSquare } from 'lucide-react';

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({ name: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <section id="contact" className="relative py-24 lg:py-32 border-t border-white/10 bg-[#0B0F17]">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Side: Infrastructure Bullets */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 font-mono text-xs text-[#AAFF5E] mb-3">
              <span>▍</span>
              <span>SYSTEM ARCHITECTURE CONSULTATION</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">
              Scale Your Content Infrastructure
            </h2>

            <p className="font-sans text-base sm:text-lg text-slate-300 mb-8 leading-relaxed opacity-80">
              Deploy custom serverless render clusters tailored to your production pipeline with sub-millisecond subtitle timing and zero human edits.
            </p>

            {/* Acid-Lime Check Bullet Points */}
            <div className="space-y-4">
              
              <div className="chamfer-card flex items-start gap-4 p-4 bg-[#11161F] border border-white/10 hover:border-[#AAFF5E]/40 transition-colors group">
                <div className="p-2 chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E] shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle className="w-5 h-5 text-[#AAFF5E]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1">
                    Automated 24/7 Engine
                  </h3>
                  <p className="font-sans text-sm text-slate-300 opacity-75">
                    Scale your content output to an automated 24/7 serverless engine.
                  </p>
                </div>
              </div>

              <div className="chamfer-card flex items-start gap-4 p-4 bg-[#11161F] border border-white/10 hover:border-[#AAFF5E]/40 transition-colors group">
                <div className="p-2 chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E] shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle className="w-5 h-5 text-[#AAFF5E]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1">
                    Multi-Platform Dispatch
                  </h3>
                  <p className="font-sans text-sm text-slate-300 opacity-75">
                    Stream single-render videos concurrently to YouTube Shorts, TikTok, and Instagram Reels.
                  </p>
                </div>
              </div>

              <div className="chamfer-card flex items-start gap-4 p-4 bg-[#11161F] border border-white/10 hover:border-[#AAFF5E]/40 transition-colors group">
                <div className="p-2 chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E] shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle className="w-5 h-5 text-[#AAFF5E]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1">
                    Secure Webhook Integration
                  </h3>
                  <p className="font-sans text-sm text-slate-300 opacity-75">
                    Connect using signed HMAC webhooks for continuous trigger automation.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Right Side: Sleek Contact Form Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="chamfer-card bg-[#11161F] border border-white/15 p-8 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
                <div className="p-2.5 chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E]">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xl text-white">
                    Contact Architecture Team
                  </h3>
                  <p className="font-sans text-xs text-slate-400 opacity-70">
                    Get in touch for custom deployments, key quotas, or enterprise licensing.
                  </p>
                </div>
              </div>

              {submitted ? (
                <div className="chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 p-6 text-center space-y-3">
                  <CheckCircle className="w-10 h-10 text-[#AAFF5E] mx-auto" />
                  <h4 className="font-display font-bold text-lg text-white">Message Transmitted!</h4>
                  <p className="font-sans text-sm text-slate-300 opacity-80">
                    Thank you. Our systems architect will reply within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-2 text-xs font-mono text-[#AAFF5E] underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name Field */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#AAFF5E] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  {/* Subject Field */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                      Subject
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Enterprise Pipeline Licensing"
                      className="w-full bg-black/60 border border-white/10 focus:border-[#AAFF5E] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase tracking-wider">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Describe your content volume requirements or API integration needs..."
                      className="w-full bg-black/60 border border-white/10 focus:border-[#AAFF5E] rounded-lg px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="chamfer-btn w-full bg-[#AAFF5E] hover:bg-[#b8ff75] text-slate-950 font-bold py-3.5 shadow-[0_0_20px_rgba(170,255,94,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2 font-mono text-xs">
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Transmitting...
                      </span>
                    ) : (
                      <>
                        <span>Submit</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
