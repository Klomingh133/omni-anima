'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex flex-col font-body">
      {/* Top Studio Dashboard Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#1f00ff] px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            onClick={() => showLoader('Navigating to Home...')}
            className="flex items-center gap-3 text-[#1f00ff]"
          >
            <div className="w-9 h-9 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white">
              <OmniLogo size={22} />
            </div>
            <span className="font-display text-2xl font-bold tracking-wider uppercase text-[#1f00ff]">
              OMNIANIMA
            </span>
          </Link>

          <div className="h-4 w-[1px] bg-[#d3d3d3] hidden sm:block" />

          {/* Navigation Tabs */}
          <div className="flex border border-[#1f00ff] rounded-[5px] p-0.5 bg-[#f2f2f2]">
            <button
              type="button"
              onClick={() => setActiveTab('my_studio')}
              className={`px-4 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
                activeTab === 'my_studio' ? 'bg-[#1f00ff] text-white' : 'text-[#212121]'
              }`}
            >
              My Projects
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('community')}
              className={`px-4 py-1 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
                activeTab === 'community' ? 'bg-[#1f00ff] text-white' : 'text-[#212121]'
              }`}
            >
              Community Reel
            </button>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(true)}
            className="px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors flex items-center gap-1.5"
          >
            <span className="text-base leading-none font-bold">+</span>
            <span>New Animation</span>
          </button>

          <div className="h-4 w-[1px] bg-[#d3d3d3]" />

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#1f00ff] hidden md:inline">
              @{user?.username}
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#212121] hover:bg-[#ececec] border border-[#d3d3d3] rounded-[5px]"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
        {activeTab === 'my_studio' ? (
          <div>
            {/* Header info */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-display text-4xl font-extrabold uppercase tracking-tight text-[#1f00ff] leading-[0.92]">
                  MY ANIMATION BLUEPRINTS
                </h1>
                <p className="text-xs uppercase tracking-wider text-[#666] mt-1 font-mono">
                  {projects.length} PROJECTS REGISTERED
                </p>
              </div>
            </div>

            {loadingProjects ? (
              <div className="py-20 text-center font-mono text-xs text-[#1f00ff] animate-pulse">
                LOADING WORKSPACE PROJECTS...
              </div>
            ) : projects.length === 0 ? (
              <div className="py-20 text-center border border-[#1f00ff] rounded-[5px] bg-white p-12 shadow-blueprint-hard">
                <p className="font-display text-3xl font-bold uppercase tracking-tight text-[#1f00ff] mb-2">
                  NO ANIMATION PROJECTS YET
                </p>
                <p className="text-sm text-[#212121] mb-6">
                  Start drafting your first animation with default 8 frames or remix a video file.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(true)}
                  className="px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
                >
                  Create Animation Project
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj.id)}
                    className="bg-white border border-[#1f00ff] rounded-[5px] overflow-hidden flex flex-col justify-between hover:border-[#1700c2] cursor-pointer group shadow-sm transition-all"
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div className="aspect-[16/9] w-full bg-[#f8f8f8] border-b border-[#ececec] overflow-hidden relative">
                        {proj.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={proj.thumbnail}
                            alt={proj.name}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center text-xs font-mono text-[#999]">
                            BLANK CANVAS
                          </div>
                        )}
                        <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded-[3px]">
                          {proj.frame_count} FRAMES @ {proj.fps} FPS
                        </span>
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-1">
                        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-[#1f00ff] leading-none truncate">
                          {proj.name}
                        </h2>
                        <span className="text-[11px] font-mono text-[#666] block">
                          UPDATED {timeAgo(proj.updated_at).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-3 border-t border-[#ececec] bg-[#f8f8f8] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#1f00ff] font-bold group-hover:underline">
                        OPEN CANVAS →
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteProject(e, proj.id)}
                        className="text-[#dc2626] hover:underline uppercase text-[10px] font-bold"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
