'use client';

import React, { useState, useEffect } from 'react';
import { renderFramesToVideo, downloadVideoFile } from '@/engine/video-exporter';
import { useTimelineStore } from '@/store/use-timeline-store';
import { useAuthStore } from '@/store/use-auth-store';
import { useLoadingStore } from '@/store/use-loading-store';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublishedSuccess?: () => void;
}

export function PublishModal({ isOpen, onClose, onPublishedSuccess }: PublishModalProps) {
  const { frames, fps, projectName, projectId } = useTimelineStore();
  const { token } = useAuthStore();
  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  const [title, setTitle] = useState(projectName || 'My Animation');
  const [description, setDescription] = useState('');
  const [videoDataUrl, setVideoDataUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(projectName || 'My Animation');
      setDescription('');
      setErrorMsg('');
      setSuccessMsg('');
      setVideoDataUrl(null);
      setRenderProgress(0);

      // Trigger video render on modal open
      setIsRendering(true);
      renderFramesToVideo(frames, fps, (p) => {
        setRenderProgress(Math.floor(p * 100));
      })
        .then(({ dataUrl }) => {
          setVideoDataUrl(dataUrl);
          setIsRendering(false);
        })
        .catch((err) => {
          console.error('Video render error:', err);
          setErrorMsg('Failed to render video preview.');
          setIsRendering(false);
        });
    }
  }, [isOpen, frames, fps, projectName]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (videoDataUrl) {
      downloadVideoFile(videoDataUrl, `${title.replace(/\s+/g, '_').toLowerCase()}.webm`);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoDataUrl) return;
    setErrorMsg('');

    try {
      setIsPublishing(true);
      showLoader('Publishing to community reel...');

      const res = await fetch('/api/published', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          title: title.trim(),
          description: description.trim(),
          fps,
          frame_count: frames.length,
          thumbnail: frames[0]?.image_data,
          video_data: videoDataUrl,
        }),
      });

      const json = await res.json();
      hideLoader();

      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Failed to publish animation.');
        setIsPublishing(false);
        return;
      }

      setSuccessMsg('Animation published successfully to the Community Showcase!');
      setIsPublishing(false);
      if (onPublishedSuccess) {
        setTimeout(() => {
          onPublishedSuccess();
          onClose();
        }, 1200);
      }
    } catch {
      hideLoader();
      setErrorMsg('Network error. Failed to publish.');
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 leading-tight">
                Export & Publish Animation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Community Showcase Distribution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-600">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* Video Preview / Rendering Status */}
        <div className="aspect-[16/9] w-full bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6 flex items-center justify-center">
          {isRendering ? (
            <div className="text-center p-6 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-indigo-600 font-bold block animate-pulse">
                Encoding WebM bitstream ({renderProgress}%)
              </span>
              <div className="h-2 w-48 bg-slate-200 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
            </div>
          ) : videoDataUrl ? (
            <video
              src={videoDataUrl}
              controls
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="text-xs font-mono text-slate-400">No Preview Available</span>
          )}
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Animation Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mechanical Gear Sequence"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or creator notes..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />
          </div>

          {/* Quota reminder notice */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
            <span>Quota policy: Up to 5 published animations per creator account.</span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!videoDataUrl || isRendering}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-40"
            >
              Download WebM
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!videoDataUrl || isRendering || isPublishing}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                Publish to Community
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
