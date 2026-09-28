'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { OmniLogo } from '@/components/ui/Icons';

export default function EditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Editor canvas runtime error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6 relative font-body">
      <div className="absolute inset-0 bg-blueprint-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-md w-full bg-white border border-[#dc2626] rounded-[5px] p-8 shadow-blueprint-hard">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 border border-[#dc2626] rounded-[5px] flex items-center justify-center bg-white text-[#dc2626]">
            <OmniLogo size={24} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-[#dc2626] uppercase tracking-wider block">
              CANVAS INTERRUPTED
            </span>
            <span className="font-display text-2xl font-bold uppercase text-[#212121]">
              PROJECT LOAD FAILURE
            </span>
          </div>
        </div>

        <p className="text-sm text-[#212121] mb-6 leading-relaxed">
          The animation frames could not be rasterized or retrieved from the blueprint database. Your previous saved state remains intact.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Link
            href="/app"
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-[#212121] border border-[#d3d3d3] hover:border-[#1f00ff] rounded-[5px] transition-colors text-center"
          >
            Studio Projects
          </Link>
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
          >
            Reload Project Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
