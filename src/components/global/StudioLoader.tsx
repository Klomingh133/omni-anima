'use client';

import React from 'react';
import { useLoadingStore } from '@/store/use-loading-store';
import { OmniLogo } from '@/components/ui/Icons';

export function StudioLoader() {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 backdrop-blur-none transition-opacity duration-200"
      style={{ cursor: 'wait' }}
    >
      {/* Top progress line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[#f2f2f2] overflow-hidden">
        <div className="h-full bg-[#1f00ff] animate-pulse w-full origin-left" />
      </div>

      {/* Blueprint loading box */}
      <div className="p-8 border border-[#1f00ff] rounded-[5px] bg-white max-w-sm w-full mx-4 flex flex-col items-center shadow-blueprint-hard">
        <div className="relative mb-6">
          <div className="w-14 h-14 rounded-[5px] border border-[#1f00ff] flex items-center justify-center text-[#1f00ff] animate-spin">
            <OmniLogo size={32} />
          </div>
        </div>

        <div className="text-center">
          <span className="font-display text-2xl font-bold tracking-wider text-[#1f00ff] uppercase block mb-1">
            OMNIANIMA
          </span>
          <p className="text-xs uppercase tracking-widest text-[#212121] font-medium animate-pulse">
            {message}
          </p>
        </div>

        {/* Technical progress ticks */}
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
