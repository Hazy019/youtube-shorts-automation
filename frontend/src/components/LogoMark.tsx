'use client';

import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export default function LogoMark({ className = '', size = 32 }: LogoMarkProps) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-lg overflow-hidden shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/Logo.png"
        alt="HAZY · ShortsAutomation Logo"
        width={size}
        height={size}
        className="w-full h-full object-contain drop-shadow-[0_0_12px_rgba(16,185,129,0.35)] transform transition-transform duration-300 hover:scale-105"
      />
    </div>
  );
}
