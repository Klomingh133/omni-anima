'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OmniLogo } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

export function MarketingNavbar() {
  const router = useRouter();
  const { user, token, initializeAuth } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleStudioClick = () => {
    showLoader('Opening Studio Workspace...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="sticky top-4 z-50 px-4 flex justify-center w-full">
      <nav className="w-full max-w-5xl h-16 bg-white/90 backdrop-blur-md border border-[#e2e8f0] hover:border-[#cbd5e1] rounded-full px-6 flex items-center justify-between shadow-[0_4px_20px_rgba(15,23,42,0.05)] transition-all duration-200">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <OmniLogo size={32} className="rounded-lg shadow-sm" />
          <span className="font-bold text-xl tracking-tight text-[#0f172a]">
            OmniAnima
          </span>
        </Link>

        {/* Links */}
        <ul className="hidden md:flex items-center gap-8 list-none text-sm font-semibold text-[#64748b]">
          <li>
            <a href="#playground" className="hover:text-[#0f172a] transition-colors">
              Playground
            </a>
          </li>
          <li>
            <a href="#features" className="hover:text-[#0f172a] transition-colors">
              Features
            </a>
          </li>
          <li>
            <a href="#shortcuts" className="hover:text-[#0f172a] transition-colors">
              Shortcuts
            </a>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <button
              type="button"
              onClick={handleStudioClick}
              className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all duration-200"
            >
              <span>Open Studio</span>
              <span>→</span>
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => showLoader('Connecting to OmniAnima...')}
                className="bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={handleStudioClick}
                className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-1.5 shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all duration-200"
              >
                <span>Open Studio</span>
                <span>→</span>
              </button>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
