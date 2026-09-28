'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OmniLogo } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

export default function LoginPage() {
  const router = useRouter();
  const { user, setToken, setUser, initializeAuth } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    initializeAuth().then((u) => {
      if (u) {
        showLoader('Opening Studio Workspace...');
        router.replace('/app');
      }
    });
  }, [initializeAuth, router, showLoader]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginIdentifier || !loginPassword) {
      setErrorMsg('Please enter both your identifier and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      showLoader('Authenticating credentials...');

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: loginIdentifier, password: loginPassword }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        hideLoader();
        setErrorMsg(json.message || 'Login failed. Please check your credentials.');
        setIsSubmitting(false);
        return;
      }

      setToken(json.data.token);
      setUser(json.data.user);

      showLoader('Opening Studio Workspace...');
      router.push('/app');
    } catch {
      hideLoader();
      setErrorMsg('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regUsername || regUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    if (!regEmail || !/^\S+@\S+\.\S+$/.test(regEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      showLoader('Creating your account...');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          password: regPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        hideLoader();
        setErrorMsg(json.message || 'Registration failed.');
        setIsSubmitting(false);
        return;
      }

      setToken(json.data.token);
      setUser(json.data.user);

      showLoader('Account created! Entering Studio...');
      router.push('/app');
    } catch {
      hideLoader();
      setErrorMsg('Network error. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Soft Ambient Radial Background */}
      <div className="absolute inset-0 pointer-events-none bg-landing-ambient opacity-70" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-8 sm:p-10 shadow-[0_18px_50px_rgba(36,50,71,0.08)]">
          {/* Logo Section */}
          <div className="text-center mb-8">
            <Link
              href="/"
              onClick={() => showLoader('Returning to Landing Page...')}
              className="inline-flex items-center gap-3 mb-2"
            >
              <OmniLogo size={36} className="rounded-xl shadow-sm" />
              <span className="font-extrabold text-2xl tracking-tight text-[#0f172a]">
                OmniAnima
              </span>
            </Link>
            <p className="text-xs text-[#64748b] font-medium">
              Cloud Frame-by-Frame Animation Studio
            </p>
          </div>

          {/* Pill Tabs */}
          <div className="flex bg-[#f1f5f9] p-1 rounded-xl mb-6 border border-[#e2e8f0]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'register'
                  ? 'bg-white text-[#0f172a] shadow-sm'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="name@email.com or username"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#94a3b8]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-sm font-semibold shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all disabled:opacity-50"
              >
                Sign In to Studio
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="animator123"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-2 focus:ring-[#eef2ff] focus:outline-none rounded-xl text-sm text-[#0f172a]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-xl text-sm font-semibold shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all disabled:opacity-50"
              >
                Create Account
              </button>
            </form>
          )}

          {/* Footer Back Link */}
          <div className="mt-6 pt-5 border-t border-[#f1f5f9] text-center">
            <Link
              href="/"
              onClick={() => showLoader('Returning to Landing Page...')}
              className="text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] transition-colors"
            >
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
