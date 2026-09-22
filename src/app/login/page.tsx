'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OmniLogo } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

export default function LoginPage() {
  const router = useRouter();
  const { user, token, setToken, setUser, initializeAuth } = useAuthStore();
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
        showLoader('Redirecting to Studio...');
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

      showLoader('Opening Studio Dashboard...');
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
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background blueprint grid subtle lines */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-50 pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <Link
            href="/"
            onClick={() => showLoader('Navigating to Home...')}
            className="flex items-center gap-3 mb-2"
          >
            <div className="w-10 h-10 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white text-[#1f00ff]">
              <OmniLogo size={24} />
            </div>
            <span className="font-display text-3xl font-bold tracking-wider text-[#1f00ff] uppercase">
              OMNIANIMA
            </span>
          </Link>
          <p className="font-mono text-xs uppercase tracking-wider text-[#666]">
            STUDIO AUTHENTICATION PORTAL
          </p>
        </div>

        {/* Blueprint Card Container */}
        <div className="bg-white border border-[#1f00ff] rounded-[5px] p-6 sm:p-8 shadow-blueprint-hard">
          {/* Tabs */}
          <div className="flex border border-[#1f00ff] rounded-[5px] p-0.5 mb-6 bg-[#f2f2f2]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMsg('');
              }}
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
                activeTab === 'login'
                  ? 'bg-[#1f00ff] text-white'
                  : 'text-[#212121] hover:text-[#1f00ff]'
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
              className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
                activeTab === 'register'
                  ? 'bg-[#1f00ff] text-white'
                  : 'text-[#212121] hover:text-[#1f00ff]'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error message alert */}
          {errorMsg && (
            <div className="mb-5 p-3 border border-[#dc2626] bg-[#fee2e2] text-[#dc2626] rounded-[5px] text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Login Form */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Username or Email
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="name@domain.com or username"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 text-sm font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors disabled:opacity-60"
              >
                Sign In to Studio
              </button>
            </form>
          ) : (
            /* Register Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="animator123"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-body"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 text-sm font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors disabled:opacity-60"
              >
                Create Studio Account
              </button>
            </form>
          )}
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            onClick={() => showLoader('Returning to Landing Page...')}
            className="text-xs uppercase tracking-wider font-semibold text-[#1f00ff] hover:underline"
          >
            ← Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
