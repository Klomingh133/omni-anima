'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

const shortcuts = [
  { label: 'Play / Pause Animation', key: 'Space' },
  { label: 'Select Brush / Pencil', key: 'B' },
  { label: 'Quick Eraser', key: 'E' },
  { label: 'Paint Bucket (Fill)', key: 'G' },
  { label: 'Add New Frame', key: 'N' },
  { label: 'Duplicate Active Frame', key: 'D' },
  { label: 'Undo Changes', key: 'Ctrl + Z' },
  { label: 'Toggle Onion Skin', key: 'O' },
];

export function KeyboardShortcuts() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);

  const handleLaunch = () => {
    showLoader('Opening Studio Workspace...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <section id="shortcuts" className="max-w-5xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="text-xs font-bold uppercase tracking-wider text-[#4f46e5] mb-2">
          LIGHTNING-FAST WORKFLOW
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0f172a] mb-3">
          Essential Keyboard Shortcuts
        </h2>
        <p className="text-base text-[#64748b] max-w-xl mx-auto">
          Master essential studio shortcuts to sketch and navigate your timeline effortlessly without taking your hands off your stylus.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-20">
        {shortcuts.map((s, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-white border border-[#e2e8f0] rounded-xl shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
          >
            <span className="text-sm font-medium text-[#334155]">{s.label}</span>
            <kbd className="px-2.5 py-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-md font-mono text-xs font-bold text-[#0f172a] shadow-sm">
              {s.key}
            </kbd>
          </div>
        ))}
      </div>

      {/* Call to Action Banner */}
      <div className="bg-gradient-to-r from-[#4f46e5] to-[#6366f1] text-white rounded-3xl p-10 sm:p-14 text-center shadow-xl">
        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Ready to Create Your Next Animation?
        </h2>
        <p className="text-sm sm:text-base text-white/90 max-w-xl mx-auto mb-8 font-normal leading-relaxed">
          Start drawing instantly with zero installation and no credit card required. Works smoothly across desktop, tablet, and mobile.
        </p>
        <button
          type="button"
          onClick={handleLaunch}
          className="bg-white hover:bg-[#f8fafc] text-[#4f46e5] px-8 py-3.5 rounded-full text-base font-bold inline-flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <span>Launch OmniAnima Studio Now →</span>
        </button>
      </div>
    </section>
  );
}
