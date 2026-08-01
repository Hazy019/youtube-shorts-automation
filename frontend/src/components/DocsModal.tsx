'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, BookOpen, Code, Terminal, Shield } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ENDPOINTS_DOCS = [
  {
    method: 'POST',
    path: '/api/v1/generate-script',
    summary: 'Synthesize viral script via Gemini 1.5 Flash',
    requestBody: `{
  "topic": "Quantum Computing Innovations 2026",
  "target_duration_seconds": 60,
  "tone": "engaging_energetic",
  "anti_slop_mode": true
}`,
    responseBody: `{
  "status": "success",
  "script_id": "scr_98a7f12b",
  "hook": "What if quantum computers solve immortality in 5 years?",
  "paragraphs": [
    "Quantum processors now achieve 10,000 qubit coherence..."
  ],
  "estimated_read_time": "58s",
  "model_used": "gemini-1.5-flash"
}`,
    curl: `curl -X POST "https://shortsautomations.vercel.app/api/v1/generate-script" \\
  -H "Authorization: Bearer $HAZY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"topic": "Quantum Computing Innovations 2026", "target_duration_seconds": 60}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/render-lambda',
    summary: 'Trigger parallel serverless video rendering on AWS Lambda',
    requestBody: `{
  "script_id": "scr_98a7f12b",
  "composition": "HazyShortComposition",
  "resolution": "1080x1920",
  "fps": 60,
  "concurrency_workers": 64
}`,
    responseBody: `{
  "status": "queued",
  "render_id": "rnd_88192a0e",
  "estimated_completion_seconds": 18,
  "lambda_functions_spawned": 64,
  "storage_bucket": "s3://hazy-shorts-artifacts/renders/"
}`,
    curl: `curl -X POST "https://shortsautomations.vercel.app/api/v1/render-lambda" \\
  -H "Authorization: Bearer $HAZY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"script_id": "scr_98a7f12b", "concurrency_workers": 64}'`,
  },
  {
    method: 'POST',
    path: '/api/v1/pipeline-status',
    summary: 'Fetch real-time render progress and multi-platform upload status',
    requestBody: `{
  "render_id": "rnd_88192a0e"
}`,
    responseBody: `{
  "status": "completed",
  "progress_percentage": 100,
  "render_time_ms": 14200,
  "platforms": {
    "youtube_shorts": { "status": "published", "url": "https://youtube.com/shorts/..." },
    "tiktok": { "status": "published", "url": "https://tiktok.com/@hazy/video/..." },
    "instagram_reels": { "status": "published", "url": "https://instagram.com/reels/..." }
  }
}`,
    curl: `curl -X POST "https://shortsautomations.vercel.app/api/v1/pipeline-status" \\
  -H "Authorization: Bearer $HAZY_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"render_id": "rnd_88192a0e"}'`,
  },
];

export default function DocsModal({ isOpen, onClose }: DocsModalProps) {
  const [activeTab, setActiveTab] = useState<'endpoints' | 'env' | 'sdk'>('endpoints');
  const [selectedEndpointIndex, setSelectedEndpointIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentEndpoint = ENDPOINTS_DOCS[selectedEndpointIndex];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop Tint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Dialog Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="chamfer-card relative w-full max-w-5xl bg-[#0B0F17] border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden z-10 flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#11161F]">
            <div className="flex items-center gap-3">
              <div className="p-2 chamfer-card bg-[#AAFF5E]/10 border border-[#AAFF5E]/30 text-[#AAFF5E]">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-extrabold text-lg text-white">
                  Hazy Shorts Architecture &amp; API Documentation
                </h3>
                <p className="font-sans text-xs text-slate-400 opacity-70">
                  OpenAPI v3.1 REST Endpoints, Remotion Concurrency &amp; Webhook Specifications
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              type="button"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Tab Controls */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-white/10 bg-[#0B0F17]/90 text-sm font-mono">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`chamfer-btn px-4 py-1.5 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'endpoints'
                  ? 'bg-[#AAFF5E] text-slate-950 font-bold shadow-[0_0_15px_rgba(170,255,94,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>API Routes</span>
            </button>
            <button
              onClick={() => setActiveTab('env')}
              className={`chamfer-btn px-4 py-1.5 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'env'
                  ? 'bg-[#AAFF5E] text-slate-950 font-bold shadow-[0_0_15px_rgba(170,255,94,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Environment &amp; Secrets</span>
            </button>
            <button
              onClick={() => setActiveTab('sdk')}
              className={`chamfer-btn px-4 py-1.5 font-medium transition-all flex items-center gap-2 ${
                activeTab === 'sdk'
                  ? 'bg-[#AAFF5E] text-slate-950 font-bold shadow-[0_0_15px_rgba(170,255,94,0.3)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Python &amp; Node SDK</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto flex-1 text-slate-300 font-sans">
            {activeTab === 'endpoints' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Route Selector list */}
                <div className="space-y-3">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Select Route
                  </span>
                  {ENDPOINTS_DOCS.map((ep, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedEndpointIndex(idx)}
                      className={`chamfer-card w-full text-left p-3.5 border transition-all flex flex-col gap-1 ${
                        selectedEndpointIndex === idx
                          ? 'bg-[#11161F] border-[#AAFF5E]/60 shadow-[0_0_20px_rgba(170,255,94,0.1)]'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="bg-[#AAFF5E]/20 text-[#AAFF5E] px-2 py-0.5 rounded font-bold">
                          {ep.method}
                        </span>
                        <span className="text-slate-200 font-semibold truncate">{ep.path}</span>
                      </div>
                      <span className="text-xs text-slate-400 line-clamp-1 opacity-75">{ep.summary}</span>
                    </button>
                  ))}
                </div>

                {/* Right Endpoint Code Payload Inspector */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-[#AAFF5E] font-bold bg-[#AAFF5E]/10 px-2 py-0.5 rounded border border-[#AAFF5E]/20">
                        {currentEndpoint.method}
                      </span>
                      <span className="font-mono text-sm text-white ml-2 font-bold">
                        {currentEndpoint.path}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopy(currentEndpoint.curl)}
                      className="chamfer-btn flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#AAFF5E]/40 text-xs font-mono text-slate-300 transition-colors"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-[#AAFF5E]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Curl' : 'Copy Curl'}</span>
                    </button>
                  </div>

                  {/* cURL Command Box */}
                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-1">cURL Request Example</span>
                    <pre className="bg-black/70 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-[#AAFF5E] overflow-x-auto">
                      {currentEndpoint.curl}
                    </pre>
                  </div>

                  {/* Request Body Payload */}
                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-1">JSON Request Payload</span>
                    <pre className="bg-black/70 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-sky-300 overflow-x-auto">
                      {currentEndpoint.requestBody}
                    </pre>
                  </div>

                  {/* Response Body Payload */}
                  <div>
                    <span className="text-xs font-mono text-slate-400 block mb-1">200 OK Response Schema</span>
                    <pre className="bg-black/70 border border-white/10 rounded-xl p-3.5 font-mono text-xs text-purple-300 overflow-x-auto">
                      {currentEndpoint.responseBody}
                    </pre>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'env' && (
              <div className="space-y-6">
                <div className="chamfer-card bg-[#11161F] border border-white/10 p-5">
                  <h4 className="font-display font-bold text-lg text-white mb-2">
                    Required Environment Variables
                  </h4>
                  <p className="text-sm text-slate-300 mb-4 opacity-80">
                    Set these environment variables in your serverless host or local <code className="text-[#AAFF5E] font-mono">.env</code> file.
                  </p>
                  <pre className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-[#AAFF5E] leading-relaxed overflow-x-auto">
{`# Google Gemini AI Key
GEMINI_API_KEY=AIzaSyD...

# AWS Remotion Lambda Concurrency Credentials
REMOTION_AWS_ACCESS_KEY_ID=AKIA...
REMOTION_AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI...
REMOTION_AWS_REGION=us-east-1

# Supabase State Store
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Social API Credentials
YOUTUBE_CLIENT_SECRETS_FILE=client_secrets.json
TIKTOK_SESSION_COOKIE=tiktok_cookies.json`}
                  </pre>
                </div>
              </div>
            )}

            {activeTab === 'sdk' && (
              <div className="space-y-6">
                <div className="chamfer-card bg-[#11161F] border border-white/10 p-5">
                  <h4 className="font-display font-bold text-lg text-white mb-2">
                    Python Automation SDK
                  </h4>
                  <pre className="bg-black/80 border border-white/10 rounded-xl p-4 font-mono text-xs text-sky-300 leading-relaxed overflow-x-auto">
{`import requests

HAZY_ENDPOINT = "https://shortsautomations.vercel.app/api/v1"
API_KEY = "hazy_sec_991823a7"

def render_short(topic: str):
    response = requests.post(
        f"{HAZY_ENDPOINT}/generate-script",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={"topic": topic, "target_duration_seconds": 60}
    )
    script_data = response.json()
    print(f"Generated script ID: {script_data['script_id']}")

render_short("Autonomous AI Video Factories in 2026")`}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#11161F] flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Documentation Version 2.0.4 • Updated July 2026</span>
            <button
              onClick={onClose}
              className="chamfer-btn bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-1.5 transition-colors"
            >
              Close Viewer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
