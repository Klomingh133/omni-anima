'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/use-auth-store';
import { timeAgo } from '@/lib/utils';
import { PlayIcon } from '@/components/ui/Icons';
import { useLoadingStore } from '@/store/use-loading-store';

interface PublishedAnimation {
  id: string;
  project_id?: string;
  user_id: string;
  author_name: string;
  author_avatar?: string | null;
  title: string;
  description: string;
  fps: number;
  frame_count: number;
  thumbnail: string;
  video_data: string;
  likes_count: number;
  views_count: number;
  created_at: string;
}

export function CommunityFeed() {
  const { user, token } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  const [items, setItems] = useState<PublishedAnimation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<PublishedAnimation | null>(null);

  const fetchCommunity = async (q = '') => {
    try {
      setLoading(true);
      const url = q ? `/api/published?q=${encodeURIComponent(q)}` : '/api/published';
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setItems(json.data || []);
      }
    } catch (e) {
      console.error('Failed to load community feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunity(searchQuery);
  };

  const handleLike = async (item: PublishedAnimation) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/published/${item.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, likes_count: json.likes_count } : it))
        );
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this animation from the community showcase?')) return;
    try {
      showLoader('Removing published animation...');
      const res = await fetch(`/api/published/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      hideLoader();
      if (res.ok) {
        setItems((prev) => prev.filter((it) => it.id !== id));
      }
    } catch (e) {
      hideLoader();
      console.error('Delete error:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="w-full sm:max-w-md flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles or creators..."
            className="flex-1 px-3.5 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-xs text-slate-800 placeholder:text-slate-400 transition-all shadow-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
          >
            Search
          </button>
        </form>

        <span className="text-xs font-mono text-slate-500">
          {items.length} animations broadcasting
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-indigo-600 animate-pulse bg-white border border-slate-200 rounded-2xl">
          Scanning community reel...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-8">
          <p className="font-display text-xl font-bold text-slate-900 mb-2">
            No animations found
          </p>
          <p className="text-xs text-slate-500">
            Be the first creator to publish an animation to the community showcase!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isOwner = user?.id === item.user_id;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  {/* Thumbnail / Video Launch Container */}
                  <div
                    onClick={() => setActiveVideo(item)}
                    className="aspect-[16/9] w-full bg-slate-50 border-b border-slate-100 relative group cursor-pointer overflow-hidden flex items-center justify-center"
                  >
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-white" />
                    )}

                    <div className="absolute inset-0 bg-indigo-900/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-2xs">
                      <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <PlayIcon size={20} />
                      </div>
                    </div>

                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white font-mono text-[10px] rounded-md">
                      {item.frame_count} frames · {item.fps} fps
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-display text-base font-bold text-slate-900 truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
                      <span className="font-medium text-slate-700">by @{item.author_name}</span>
                      <span>•</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleLike(item)}
                      className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      title="Like Animation"
                    >
                      <span>▲</span>
                      <span>{item.likes_count || 0}</span>
                    </button>
                    <span className="text-slate-400">👁 {item.views_count || 0}</span>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 text-[11px] font-semibold"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Video Play Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h2 className="font-display text-xl font-bold text-slate-900">
                {activeVideo.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[16/9] w-full bg-black rounded-xl overflow-hidden mb-4">
              <video
                src={activeVideo.video_data}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium text-slate-700">Creator: @{activeVideo.author_name}</span>
              <span className="font-mono">
                {activeVideo.frame_count} frames · {activeVideo.fps} fps
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
