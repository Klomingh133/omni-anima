import React from 'react';
import Link from 'next/link';
import { OmniLogo } from '@/components/ui/Icons';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-blueprint-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white border border-[#1f00ff] rounded-[5px] p-8 shadow-blueprint-hard text-center">
        <div className="w-12 h-12 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white text-[#1f00ff] mx-auto mb-6">
          <OmniLogo size={28} />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1f00ff] rounded-[5px] bg-[#f8f8f8] mb-4">
          <span className="font-mono text-xs font-semibold text-[#1f00ff] uppercase tracking-wider">
            ERROR // 404
          </span>
        </div>

        <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-[#1f00ff] leading-[0.92] mb-3">
          FRAME NOT FOUND.
        </h1>

        <p className="text-sm text-[#212121] mb-6 leading-relaxed">
          The requested animation canvas, project file, or route coordinate does not exist on this drafting table.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/app"
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
          >
            My Studio Projects
          </Link>
          <Link
            href="/"
            className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#f2f2f2] rounded-[5px] transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
