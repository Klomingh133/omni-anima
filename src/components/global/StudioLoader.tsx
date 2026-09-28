'use client';

import React from 'react';
import { useLoadingStore } from '@/store/use-loading-store';

export function StudioLoader() {
  const { isLoading, message } = useLoadingStore();

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f8fafc]/90 backdrop-blur-md transition-opacity duration-300"
      style={{ cursor: 'wait' }}
    >
      {/* Rainbow Indeterminate Top Progress Bar */}
      <div className="top-progress-bar" />

      {/* Infinity Loop Stylus Drawing Animation */}
      <div className="flex flex-col items-center justify-center gap-4">
        <div className="infinity-stage">
          <svg className="loader-svg" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loaderStrokeGrad" x1="20" y1="45" x2="140" y2="45" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4f46e5" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <path
              className="infinity-guide"
              d="M 80 45 C 64 24, 38 24, 38 45 C 38 66, 64 66, 80 45 C 96 24, 122 24, 122 45 C 122 66, 96 66, 80 45 Z"
            />
            <path
              className="infinity-draw"
              d="M 80 45 C 64 24, 38 24, 38 45 C 38 66, 64 66, 80 45 C 96 24, 122 24, 122 45 C 122 66, 96 66, 80 45 Z"
            />
            <g className="stylus-group">
              <circle cx="0" cy="0" r="2.5" fill="#4f46e5" />
              <path d="M 0 0 L -3.5 -2.5 L -4 -0.5 Z" fill="#0f172a" />
              <path d="M -3.5 -2.5 L -15 -10.5 L -17 -8 L -4 -0.5 Z" fill="#4f46e5" />
              <path d="M -9.5 -6.8 L -12.5 -8.8 L -14 -7 L -11 -5 Z" fill="#f59e0b" />
            </g>
          </svg>
        </div>

        <div className="flex items-center gap-1 text-sm font-semibold text-[#334155]">
          <span>{message || 'Opening Studio Workspace'}</span>
          <span className="dots-shimmer text-[#4f46e5] font-bold">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}
