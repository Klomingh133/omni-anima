'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InteractiveDoodlePad } from './InteractiveDoodlePad';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

export function HeroSection() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);

  const handleCtaClick = () => {
    showLoader('Loading Animation Studio...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <section className="relative overflow-hidden bg-white border-b border-[#1f00ff] pt-14 pb-20">
      {/* Background blueprint grid subtle lines */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-60 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Architectural Display */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1f00ff] rounded-[5px] bg-[#f8f8f8]">
              <span className="w-2 h-2 rounded-full bg-[#1f00ff]" />
              <span className="font-mono text-xs font-semibold text-[#1f00ff] uppercase tracking-wider">
                OMNIANIMA STUDIO
              </span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-extrabold uppercase tracking-tight text-[#1f00ff] leading-[0.88]">
              FRAME BY FRAME.
              <br />
              <span className="text-[#212121]">PURE BLUEPRINT</span>
              <br />
              DRAFTING.
            </h1>

            <p className="text-base sm:text-lg text-[#212121] leading-relaxed max-w-xl font-normal">
              High-performance 2D animation engine with zero latency. 
              Draft keyframes, scrub timelines, configure multi-layer onion skinning, 
              and export broadcast-ready WebM videos directly in your browser.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                type="button"
                onClick={handleCtaClick}
                className="px-7 py-3 text-sm font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
              >
                Launch Studio Canvas
              </button>

              <a
                href="#features"
                className="px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#f2f2f2] rounded-[5px] transition-colors"
              >
                Explore Specifications
              </a>
            </div>

            {/* Technical Metric Indicators */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#ececec]">
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1f00ff]">
                  60 FPS
                </span>
                <span className="text-xs uppercase tracking-wider text-[#666]">
                  Render Loop
                </span>
              </div>
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1f00ff]">
                  0 MS
                </span>
                <span className="text-xs uppercase tracking-wider text-[#666]">
                  Input Lag
                </span>
              </div>
              <div>
                <span className="block font-mono text-xl sm:text-2xl font-bold text-[#1f00ff]">
                  960 × 540
                </span>
                <span className="text-xs uppercase tracking-wider text-[#666]">
                  Virtual Raster
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Doodle Pad */}
          <div className="lg:col-span-6">
            <InteractiveDoodlePad />
          </div>
        </div>
      </div>
    </section>
  );
}
