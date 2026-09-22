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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-none p-4">
      <div className="bg-white border border-[#1f00ff] rounded-[5px] max-w-xl w-full p-6 sm:p-8 shadow-blueprint-hard max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1f00ff] leading-[0.92]">
              EXPORT & PUBLISH ANIMATION
            </h2>
            <p className="text-xs uppercase tracking-wider text-[#666] mt-1 font-mono">
              COMMUNITY SHOWCASE DISTRIBUTION
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-[4px] border border-[#d3d3d3] hover:border-[#1f00ff] flex items-center justify-center text-sm font-bold text-[#212121]"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#fee2e2] border border-[#dc2626] rounded-[5px] text-xs font-semibold text-[#dc2626]">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#dcfce7] border border-[#16a34a] rounded-[5px] text-xs font-semibold text-[#16a34a]">
            {successMsg}
          </div>
        )}

        {/* Video Preview / Rendering Status */}
        <div className="aspect-[16/9] w-full bg-white border border-[#1f00ff] rounded-[5px] overflow-hidden mb-6 flex items-center justify-center">
          {isRendering ? (
            <div className="text-center p-6 space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#1f00ff] font-bold block animate-pulse">
                ENCODING WEBM BITSTREAM ({renderProgress}%)
              </span>
              <div className="h-2 w-48 bg-[#f2f2f2] rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-[#1f00ff] transition-all duration-150"
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
            <span className="text-xs font-mono text-[#999]">NO PREVIEW AVAILABLE</span>
          )}
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
              Animation Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mechanical Gear Sequence"
              className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121]"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
              Description / Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context or technical drafting notes..."
              className="w-full px-3.5 py-2 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121]"
            />
          </div>

          {/* Quota reminder notice */}
          <div className="p-3 bg-[#f8f8f8] border border-[#d3d3d3] rounded-[5px] text-xs font-mono text-[#666]">
            <span>QUOTA POLICY: UP TO 5 PUBLISHED ANIMATIONS PER CREATOR ACCOUNT.</span>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#ececec]">
            <button
              type="button"
              onClick={handleDownload}
              disabled={!videoDataUrl || isRendering}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#f2f2f2] rounded-[5px] transition-colors disabled:opacity-40"
            >
              Download WebM
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#212121] hover:bg-[#f2f2f2] border border-[#d3d3d3] rounded-[5px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!videoDataUrl || isRendering || isPublishing}
                className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors disabled:opacity-50"
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
