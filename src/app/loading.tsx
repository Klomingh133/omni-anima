import React from 'react';
import { OmniLogo } from '@/components/ui/Icons';

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-blueprint-grid opacity-40 pointer-events-none" />

      <div className="relative z-10 max-w-sm w-full bg-white border border-[#1f00ff] rounded-[5px] p-8 shadow-blueprint-hard text-center">
        <div className="w-12 h-12 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white text-[#1f00ff] mx-auto mb-4 animate-spin">
          <OmniLogo size={28} />
        </div>

        <span className="font-display text-2xl font-bold tracking-wider text-[#1f00ff] uppercase block mb-1">
          OMNIANIMA
        </span>

        <p className="text-xs font-mono uppercase tracking-widest text-[#212121] font-semibold animate-pulse">
          INITIALIZING BLUEPRINT BUFFERS...
        </p>

        <div className="flex gap-1.5 mt-6 w-full justify-center">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-1 flex-1 bg-[#1f00ff] rounded-[1px] animate-pulse"
              style={{ animationDelay: `${idx * 120}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
