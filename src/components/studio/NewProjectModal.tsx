'use client';

import React, { useState } from 'react';
import { extractFramesFromVideo } from '@/engine/video-exporter';
import { useLoadingStore } from '@/store/use-loading-store';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    fps: number;
    frameCount: number;
    frames?: string[];
  }) => Promise<void>;
}

export function NewProjectModal({ isOpen, onClose, onCreateProject }: NewProjectModalProps) {
  const [projectName, setProjectName] = useState('New Animation');
  const [fps, setFps] = useState(12);
  const [frameCount, setFrameCount] = useState(8); // Default 8 frames as requested
  const [mode, setMode] = useState<'blank' | 'remix'>('blank');
  const [remixFile, setRemixFile] = useState<File | null>(null);
  const [remixProgress, setRemixProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const showLoader = useLoadingStore((s) => s.show);
  const hideLoader = useLoadingStore((s) => s.hide);

  if (!isOpen) return null;

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setErrorMsg('Please choose a valid MP4 or WebM video file.');
        return;
      }
      setRemixFile(file);
      setProjectName(file.name.replace(/\.[^/.]+$/, '').slice(0, 50));
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      setIsProcessing(true);

      if (mode === 'remix' && remixFile) {
        showLoader('Decomposing video footage into animation frames...');
        const extracted = await extractFramesFromVideo(remixFile, fps, (p) => {
          setRemixProgress(Math.floor(p * 100));
        });

        await onCreateProject({
          name: projectName.trim() || 'Remixed Video Animation',
          fps: extracted.fps,
          frameCount: extracted.frames.length,
          frames: extracted.frames,
        });
      } else {
        showLoader('Generating new blueprint canvas...');
        await onCreateProject({
          name: projectName.trim() || 'New Animation',
          fps,
          frameCount,
        });
      }

      onClose();
    } catch (err: any) {
      hideLoader();
      setErrorMsg(err.message || 'Failed to initialize project.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-none p-4">
      <div className="bg-white border border-[#1f00ff] rounded-[5px] max-w-lg w-full p-6 sm:p-8 shadow-blueprint-hard">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ececec] pb-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-[#1f00ff] leading-[0.92]">
              CREATE NEW PROJECT
            </h2>
            <p className="text-xs uppercase tracking-wider text-[#666] mt-1 font-mono">
              BLUEPRINT SPECIFICATION
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

        {/* Mode Toggle */}
        <div className="flex border border-[#1f00ff] rounded-[5px] p-0.5 mb-6 bg-[#f2f2f2]">
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
              mode === 'blank' ? 'bg-[#1f00ff] text-white' : 'text-[#212121]'
            }`}
          >
            Blank Timeline
          </button>
          <button
            type="button"
            onClick={() => setMode('remix')}
            className={`flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[3px] transition-colors ${
              mode === 'remix' ? 'bg-[#1f00ff] text-white' : 'text-[#212121]'
            }`}
          >
            Remix from Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
              Project Title
            </label>
            <input
              type="text"
              required
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. Character Walk Cycle"
              className="w-full px-3.5 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                Playback Speed (FPS)
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-mono"
              >
                <option value={8}>8 FPS (Classic Sketch)</option>
                <option value={12}>12 FPS (Standard 2D)</option>
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Smooth Broadcast)</option>
              </select>
            </div>

            {mode === 'blank' ? (
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Initial Frames (Default: 8)
                </label>
                <select
                  value={frameCount}
                  onChange={(e) => setFrameCount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-white border border-[#d3d3d3] focus:border-[#1f00ff] focus:outline-none rounded-[5px] text-sm text-[#212121] font-mono"
                >
                  <option value={4}>4 Frames</option>
                  <option value={8}>8 Frames (Default)</option>
                  <option value={12}>12 Frames</option>
                  <option value={16}>16 Frames</option>
                  <option value={24}>24 Frames</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#212121] mb-1.5">
                  Video Source
                </label>
                <label className="block text-center cursor-pointer px-3 py-2.5 bg-white border border-dashed border-[#1f00ff] rounded-[5px] text-xs font-semibold uppercase text-[#1f00ff] hover:bg-[#f8f8f8]">
                  <span>{remixFile ? remixFile.name.slice(0, 16) + '...' : 'Upload MP4/WebM'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {mode === 'remix' && remixProgress > 0 && (
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-mono text-[#1f00ff]">
                <span>EXTRACTING FRAMES</span>
                <span>{remixProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#f2f2f2] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1f00ff] transition-all duration-150"
                  style={{ width: `${remixProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#ececec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#212121] hover:bg-[#f2f2f2] border border-[#d3d3d3] rounded-[5px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (mode === 'remix' && !remixFile)}
              className="px-6 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors disabled:opacity-50"
            >
              Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
