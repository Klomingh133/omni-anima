import React from 'react';
import Link from 'next/link';
import { OmniLogo } from '@/components/ui/Icons';

export function MarketingFooter() {
  return (
    <footer className="bg-[#1f00ff] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-12 border-b border-white/20">
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-white rounded-[5px] flex items-center justify-center bg-transparent text-white">
                <OmniLogo size={22} />
              </div>
              <span className="font-display text-2xl font-bold tracking-wider uppercase text-white">
                OMNIANIMA
              </span>
            </div>
            <p className="text-sm text-white/80 max-w-sm font-normal leading-relaxed">
              Professional web-based 2D frame-by-frame animation studio. 
              Engineered with sub-millisecond drawing latency, onion skinning, and instant video remixing.
            </p>
          </div>

          {/* Links 1 */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-display text-lg uppercase tracking-wider text-white block">
              PLATFORM
            </span>
            <ul className="space-y-2 text-xs uppercase tracking-wider text-white/80 font-medium">
              <li>
                <Link href="/app" className="hover:text-white transition-colors">
                  Studio Editor
                </Link>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Engine Architecture
                </a>
              </li>
              <li>
                <a href="#shortcuts" className="hover:text-white transition-colors">
                  Studio Controls
                </a>
              </li>
            </ul>
          </div>

          {/* Links 2 */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-display text-lg uppercase tracking-wider text-white block">
              BLUEPRINT SPECIFICATION
            </span>
            <p className="text-xs text-white/80 leading-relaxed font-mono">
              OUTPUT RESOLUTION: 960 × 540 (NATIVE 16:9)<br />
              CODEC: WEBM VP9 / VP8<br />
              TIMELINE: 1 - 60 FRAMES PER SECOND
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/70">
          <div>
            &copy; {new Date().getFullYear()} OMNIANIMA STUDIO. ALL RIGHTS RESERVED.
          </div>
          <div className="flex items-center gap-6">
            <span>TERMS</span>
            <span>PRIVACY</span>
            <span>DRAFTING PROTOCOL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
