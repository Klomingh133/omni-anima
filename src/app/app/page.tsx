'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OmniLogo } from '@/components/ui/Icons';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';
import { timeAgo } from '@/lib/utils';
import { NewProjectModal } from '@/components/studio/NewProjectModal';
import { CommunityFeed } from '@/components/studio/CommunityFeed';

interface ProjectSummary {
  id: string;
  name: string;
  fps: number;
  thumbnail: string;
  frame_count: number;
  created_at: string;
  updated_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, initializeAuth, logout } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  const [activeTab, setActiveTab] = useState<'my_studio' | 'community'>('my_studio');
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProjects = useCallback(async (authToken: string) => {
    try {
      setLoadingProjects(true);
      const res = await fetch('/api/projects', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const json = await res.json();
      if (json.success) {
        setProjects(json.data || []);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setLoadingProjects(false);
      hideLoader();
    }
  }, [hideLoader]);

  useEffect(() => {
    initializeAuth().then((u) => {
      if (!u) {
        showLoader('Redirecting to Sign In...');
        router.replace('/login');
      } else {
        const storedToken = localStorage.getItem('auth_token') || '';
        fetchProjects(storedToken);
      }
    });
  }, [fetchProjects, initializeAuth, router, showLoader]);

  const handleCreateProject = async (projectData: {
    name: string;
    fps: number;
    frameCount: number;
    frames?: string[];
  }) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        showLoader('Loading project editor...');
        router.push(`/editor/${json.data.id}`);
      } else {
        hideLoader();
        alert(json.message || 'Failed to create project');
      }
    } catch (e) {
      hideLoader();
      console.error('Create error:', e);
      alert('Error creating project.');
    }
  };

  const handleQuickTemplate = async (fps: number, name: string) => {
    showLoader(`Loading ${name} template...`);
    await handleCreateProject({
      name,
      fps,
      frameCount: 8,
    });
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this animation project?')) return;

    try {
      showLoader('Deleting project...');
      const res = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      hideLoader();
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      hideLoader();
      console.error('Delete error:', err);
    }
  };

  const handleOpenProject = (id: string) => {
    showLoader('Opening Canvas Editor...');
    router.push(`/editor/${id}`);
  };

  const handleLogout = () => {
    showLoader('Signing out...');
    logout();
    router.replace('/');
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  // Statistics
  const totalFrames = useMemo(() => {
    return projects.reduce((acc, p) => acc + (p.frame_count || 1), 0);
  }, [projects]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-body">
      {/* Top Studio Dashboard Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <Link
            href="/"
            onClick={() => showLoader('Navigating to Home...')}
            className="flex items-center gap-3 text-slate-900 group"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105">
              <OmniLogo size={24} />
            </div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900">
              OmniAnima
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          {/* Navigation View Switcher */}
          <nav className="flex p-1 bg-slate-100 rounded-xl" aria-label="Main Navigation">
            <button
              type="button"
              onClick={() => setActiveTab('my_studio')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'my_studio'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="3" width="7" height="7" rx="1.5" />
                <rect x="14" y="14" width="7" height="7" rx="1.5" />
                <rect x="3" y="14" width="7" height="7" rx="1.5" />
              </svg>
              <span>My Studio</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'community'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              <span>Explore Community</span>
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                Live
              </span>
            </button>
          </nav>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>New Project</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700">
              {user?.username ? user.username.slice(0, 1).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden md:inline">
              @{user?.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors ml-1"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-8">
        {activeTab === 'my_studio' ? (
          <div className="space-y-8">
            {/* Dashboard Hero */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Cloud Animation Studio</span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  Your animation workspace.
                </h1>
                <p className="text-sm text-slate-500 max-w-2xl">
                  Create frame-by-frame animations with speed and precision. Cloud-synced in real time.
                </p>
              </div>

              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>New Project</span>
                </button>
              </div>
            </div>

            {/* Quick Start Section */}
            <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 block">
                    QUICK START
                  </span>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    Choose your animation rhythm
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleQuickTemplate(12, 'Classic Animation')}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-100/70 border border-indigo-200/60 flex flex-col items-center justify-center text-indigo-700">
                      <span className="font-mono text-base font-extrabold leading-none">12</span>
                      <span className="text-[10px] font-mono leading-none mt-0.5">FPS</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Classic Animation
                      </strong>
                      <span className="text-xs text-slate-500">
                        Expressive 12 FPS · Cartoon standard
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-lg font-bold">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickTemplate(24, 'Smooth Animation')}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all text-left group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center shadow-xs">
                      <span className="font-mono text-base font-extrabold leading-none">24</span>
                      <span className="text-[10px] font-mono leading-none mt-0.5 text-indigo-200">FPS</span>
                    </div>
                    <div>
                      <strong className="block text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Smooth Motion
                      </strong>
                      <span className="text-xs text-slate-500">
                        Silky 24 FPS · Cinema standard
                      </span>
                    </div>
                  </div>
                  <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-lg font-bold">
                    →
                  </span>
                </button>
              </div>
            </section>

            {/* Dashboard 2-column layout: Projects Grid + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Projects */}
              <div className="lg:col-span-2 space-y-4">
                {/* Projects Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display text-xl font-bold text-slate-900">
                      Your Projects
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 font-mono text-xs font-bold border border-indigo-100">
                      {filteredProjects.length}
                    </span>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search your animations..."
                      className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs"
                    />
                  </div>
                </div>

                {/* Projects Grid / Empty State */}
                {loadingProjects ? (
                  <div className="py-20 text-center font-mono text-xs text-indigo-600 animate-pulse bg-white border border-slate-200 rounded-2xl">
                    Loading workspace projects...
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
                      ✦
                    </div>
                    <div>
                      <h4 className="font-display text-lg font-bold text-slate-900">
                        {searchQuery ? 'No matching projects found' : 'No animation projects yet'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {searchQuery
                          ? 'Try adjusting your search terms to find your projects.'
                          : 'Start drafting your first animation with default 8 frames or remix a video file.'}
                      </p>
                    </div>
                    {!searchQuery && (
                      <button
                        type="button"
                        onClick={() => setIsNewProjectModalOpen(true)}
                        className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm"
                      >
                        Create Animation Project
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {filteredProjects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => handleOpenProject(proj.id)}
                        className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg cursor-pointer group transition-all"
                      >
                        <div>
                          {/* Thumbnail */}
                          <div className="aspect-[16/9] w-full bg-slate-50 border-b border-slate-100 overflow-hidden relative flex items-center justify-center">
                            {proj.thumbnail ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={proj.thumbnail}
                                alt={proj.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                              />
                            ) : (
                              <div className="text-xs font-mono text-slate-400">
                                Blank Canvas
                              </div>
                            )}
                            <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white font-mono text-[10px] rounded-md backdrop-blur-xs">
                              {proj.frame_count} frames · {proj.fps} fps
                            </span>
                          </div>

                          {/* Info */}
                          <div className="p-4 space-y-1">
                            <h4 className="font-display text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                              {proj.name}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              Updated {timeAgo(proj.updated_at)}
                            </span>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                          <span className="text-indigo-600 font-semibold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            Open Canvas →
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProject(e, proj.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Sidebar (Statistics & Shortcuts) */}
              <div className="space-y-6">
                {/* Your Statistics */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Your Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <polygon points="9 8 15 12 9 16" />
                        </svg>
                      </div>
                      <span className="font-mono text-2xl font-extrabold text-slate-900 block leading-tight">
                        {projects.length}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Total Projects
                      </span>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-2">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                          <rect x="8" y="8" width="12" height="12" rx="1" />
                        </svg>
                      </div>
                      <span className="font-mono text-2xl font-extrabold text-slate-900 block leading-tight">
                        {totalFrames}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Total Frames
                      </span>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Keyboard Shortcuts
                    </h3>
                  </div>

                  <ul className="space-y-2.5 text-xs">
                    <li className="flex items-center justify-between text-slate-600">
                      <span>Play / Pause</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                        Space
                      </kbd>
                    </li>
                    <li className="flex items-center justify-between text-slate-600">
                      <span>New Frame</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                        N
                      </kbd>
                    </li>
                    <li className="flex items-center justify-between text-slate-600">
                      <span>Pencil / Brush</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                        B
                      </kbd>
                    </li>
                    <li className="flex items-center justify-between text-slate-600">
                      <span>Eraser</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                        E
                      </kbd>
                    </li>
                    <li className="flex items-center justify-between text-slate-600">
                      <span>Select & Move</span>
                      <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md font-mono text-[11px] font-semibold text-slate-700 shadow-2xs">
                        V
                      </kbd>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CommunityFeed />
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreateProject={handleCreateProject}
      />
    </div>
  );
}
