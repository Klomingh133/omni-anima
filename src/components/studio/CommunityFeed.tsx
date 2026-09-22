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
    if (!confirm('Are you sure you want to remove this animation from the community reel?')) return;
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
            placeholder="Search titles or authors..."
            className="flex-1 px-3.5 py-2 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121]"
          />
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#1f00ff] hover:bg-[#1700c2] rounded-[5px]"
          >
            Search
          </button>
        </form>

        <span className="font-mono text-xs uppercase tracking-wider text-[#666]">
          {items.length} ANIMATIONS BROADCASTING
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center font-mono text-xs text-[#1f00ff] animate-pulse">
          SCANNING COMMUNITY REEL...
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-[#d3d3d3] rounded-[5px] bg-white p-8">
          <p className="font-display text-2xl uppercase tracking-tight text-[#1f00ff] mb-2">
            NO ANIMATIONS FOUND
          </p>
          <p className="text-xs font-mono text-[#666]">
            Be the first creator to publish an animation to the community reel!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const isOwner = user?.id === item.user_id;

            return (
              <div
                key={item.id}
                className="bg-white border border-[#1f00ff] rounded-[5px] overflow-hidden flex flex-col justify-between hover:border-[#1700c2] transition-colors"
              >
                <div>
                  {/* Thumbnail / Video Launch Container */}
                  <div
                    onClick={() => setActiveVideo(item)}
                    className="aspect-[16/9] w-full bg-[#f8f8f8] border-b border-[#ececec] relative group cursor-pointer overflow-hidden flex items-center justify-center"
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

                    <div className="absolute inset-0 bg-[#1f00ff]/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-white text-[#1f00ff] flex items-center justify-center shadow-lg">
                        <PlayIcon size={20} />
                      </div>
                    </div>

                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/80 text-white font-mono text-[10px] rounded-[3px]">
                      {item.frame_count} FRAMES @ {item.fps} FPS
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-display text-xl font-bold uppercase tracking-tight text-[#1f00ff] leading-none truncate">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-[#212121] line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2 text-xs font-mono text-[#666]">
                      <span>BY {item.author_name.toUpperCase()}</span>
                      <span>•</span>
                      <span>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t border-[#ececec] bg-[#f8f8f8] flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleLike(item)}
                      className="flex items-center gap-1 font-bold text-[#1f00ff] hover:text-[#ff622b] transition-colors"
                      title="Like Animation"
                    >
                      <span>▲</span>
                      <span>{item.likes_count || 0}</span>
                    </button>
                    <span className="text-[#999]">👁 {item.views_count || 0}</span>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="text-[#dc2626] hover:underline uppercase text-[10px] font-bold"
                    >
                      DELETE
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-none p-4">
          <div className="bg-white border border-[#1f00ff] rounded-[5px] max-w-2xl w-full p-6 shadow-blueprint-hard">
            <div className="flex items-center justify-between border-b border-[#ececec] pb-3 mb-4">
              <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-[#1f00ff]">
                {activeVideo.title}
              </h2>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="w-8 h-8 rounded-[4px] border border-[#d3d3d3] hover:border-[#1f00ff] flex items-center justify-center text-sm font-bold text-[#212121]"
              >
                ✕
              </button>
            </div>

            <div className="aspect-[16/9] w-full bg-black rounded-[4px] overflow-hidden mb-4">
              <video
                src={activeVideo.video_data}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono text-[#666]">
              <span>CREATOR: {activeVideo.author_name.toUpperCase()}</span>
              <span>
                {activeVideo.frame_count} FRAMES • {activeVideo.fps} FPS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
