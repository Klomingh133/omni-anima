'use client';

import React from 'react';
import Link from 'next/link';
import { OmniLogo } from '@/components/ui/Icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

export function MarketingFooter() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);

  const handleStudioClick = () => {
    showLoader('Opening Studio Workspace...');
    if (token || user) {
      router.push('/app');
    } else {
      router.push('/login');
    }
  };

  return (
    <footer className="border-t border-[#e2e8f0] bg-white py-12">
      <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <OmniLogo size={26} className="rounded-md shadow-sm" />
          <span className="font-bold text-base tracking-tight text-[#0f172a]">
            OmniAnima
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm font-semibold text-[#64748b]">
          <button
            type="button"
            onClick={handleStudioClick}
            className="hover:text-[#0f172a] transition-colors"
          >
            Studio Editor
          </button>
          <Link href="/login" className="hover:text-[#0f172a] transition-colors">
            Sign In / Register
          </Link>
          <a href="#features" className="hover:text-[#0f172a] transition-colors">
            Features
          </a>
          <a href="#playground" className="hover:text-[#0f172a] transition-colors">
            Playground
          </a>
        </div>

        <div className="text-xs text-[#94a3b8] font-medium">
          &copy; 2026 OmniAnima Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
