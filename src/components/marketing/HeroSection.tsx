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
    showLoader('Opening Studio Workspace...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="pt-16 pb-12 text-center">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#0f172a] leading-[1.15] mb-5">
          Bring Hand-Drawn Animations to Life.
          <br />
          <span className="text-[#4f46e5]">Zero Latency. Infinite Creativity.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-[#64748b] max-w-2xl mx-auto font-medium leading-relaxed mb-8">
          A high-performance 2D web animation studio. Sketch with sub-millisecond precision, preview multi-layer onion skinning, save automatically to the cloud, and animate directly in your browser.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3.5 flex-wrap mb-12">
          <button
            type="button"
            onClick={handleCtaClick}
            className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-8 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 shadow-[0_4px_16px_rgba(79,70,229,0.35)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            <span>Start Drawing Now</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>

          <a
            href="#playground"
            className="bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-6 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 shadow-sm transition-all duration-200"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span>Try Canvas Below</span>
          </a>
        </div>

        {/* Interactive Doodle Sandbox */}
        <InteractiveDoodlePad />
      </div>

      {/* Performance Metrics Ribbon */}
      <section className="mt-16 py-10 border-y border-[#e2e8f0] bg-white/60">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a] mb-1">
              0<span className="text-[#4f46e5]">ms</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#64748b]">
              Input Latency (Instant Direct)
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a] mb-1">
              60<span className="text-[#4f46e5]">FPS</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#64748b]">
              Smooth Video Playback
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a] mb-1">
              8+<span className="text-[#4f46e5]">Frames</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#64748b]">
              Default Timeline Setup
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-[#0f172a] mb-1">
              100<span className="text-[#4f46e5]">%</span>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-[#64748b]">
              Cloud Autosaved in Browser
            </div>
          </div>
        </div>
      </section>
    </header>
  );
}
