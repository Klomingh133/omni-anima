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
    showLoader('Opening Studio Dashboard...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 border-b border-[#1f00ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <Link
          href="/"
          className="flex items-center gap-3 group text-[#1f00ff]"
        >
          <div className="w-9 h-9 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white group-hover:bg-[#1f00ff] group-hover:text-white transition-colors">
            <OmniLogo size={22} />
          </div>
          <span className="font-display text-2xl font-bold tracking-wider uppercase text-[#1f00ff]">
            OMNIANIMA
          </span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#212121]">
          <a href="#features" className="hover:text-[#1f00ff] transition-colors">
            Features
          </a>
          <a href="#workflow" className="hover:text-[#1f00ff] transition-colors">
            Workflow
          </a>
          <a href="#shortcuts" className="hover:text-[#1f00ff] transition-colors">
            Shortcuts
          </a>
          <a href="#community" className="hover:text-[#1f00ff] transition-colors">
            Community
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <button
              type="button"
              onClick={handleStudioClick}
              className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
            >
              Enter Studio
            </button>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => showLoader('Opening Authentication...')}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#1f00ff] hover:text-white rounded-[5px] transition-colors"
              >
                Sign In
              </Link>
              <button
                type="button"
                onClick={handleStudioClick}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
              >
                Start Animating
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
