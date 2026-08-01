'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import MetricsSection from '@/components/MetricsSection';
import PipelineSection from '@/components/PipelineSection';
import DocsSection from '@/components/DocsSection';
import DocsModal from '@/components/DocsModal';
import PricingSection from '@/components/PricingSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import AIAssistantDrawer from '@/components/AIAssistantDrawer';
import FloatingWidget from '@/components/FloatingWidget';

export default function Home() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#0B0F17] text-[#94A3B8] selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-x-clip">
      {/* Top Fixed Navbar */}
      <Navbar
        onOpenAssistant={() => setIsAssistantOpen(true)}
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Hero Section */}
      <HeroSection
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Metrics & Proof Section */}
      <MetricsSection />

      {/* Live Pipeline Stages Section */}
      <PipelineSection />

      {/* Documentation & API Overview Section */}
      <DocsSection
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* 100% Free & Open Source Stack Section */}
      <PricingSection
        onOpenDocs={() => setIsDocsOpen(true)}
      />

      {/* Contact & Infrastructure Scale Form Section */}
      <ContactSection />

      {/* Footer */}
      <Footer />

      {/* Interactive AI Pipeline Q&A Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Floating AI Assistant Widget Button */}
      <FloatingWidget
        onOpenAssistant={() => setIsAssistantOpen(true)}
      />

      {/* Developer API & Architecture Docs Modal */}
      <DocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </main>
  );
}
