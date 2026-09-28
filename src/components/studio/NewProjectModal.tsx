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

const PRESET_FRAMES = [
  { count: 4, label: 'Fast' },
  { count: 8, label: 'Default' },
  { count: 12, label: '1s Loop' },
  { count: 16, label: 'Fluid' },
  { count: 24, label: '2s Film' },
];

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

  const handleFrameCountChange = (val: number) => {
    const clamped = Math.max(1, Math.min(60, val || 1));
    setFrameCount(clamped);
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
        showLoader('Creating animation project...');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-slate-100 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <line x1="7" y1="2" x2="7" y2="22" />
                <line x1="17" y1="2" x2="17" y2="22" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <line x1="2" y1="7" x2="7" y2="7" />
                <line x1="2" y1="17" x2="7" y2="17" />
                <line x1="17" y1="17" x2="22" y2="17" />
                <line x1="17" y1="7" x2="22" y2="7" />
              </svg>
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900 leading-tight">
                New Animation Project
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set project title and initial frame timeline.
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

        {/* Mode Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setMode('blank')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'blank'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blank Timeline
          </button>
          <button
            type="button"
            onClick={() => setMode('remix')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'remix'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Remix from Video
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project Title
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Bouncing Ball, Character Walk..."
                maxLength={100}
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-sm text-slate-900 placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* FPS & Mode details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Playback Speed
              </label>
              <select
                value={fps}
                onChange={(e) => setFps(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none rounded-xl text-sm text-slate-800 font-mono transition-all"
              >
                <option value={8}>8 FPS (Classic Sketch)</option>
                <option value={12}>12 FPS (Standard 2D)</option>
                <option value={24}>24 FPS (Cinematic)</option>
                <option value={30}>30 FPS (Smooth Broadcast)</option>
              </select>
            </div>

            {mode === 'remix' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Video Source
                </label>
                <label className="flex items-center justify-center cursor-pointer px-3 py-2.5 bg-slate-50 border border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl text-xs font-medium text-indigo-600 hover:bg-indigo-50/50 transition-all text-center truncate">
                  <span>{remixFile ? remixFile.name.slice(0, 18) + '...' : 'Upload MP4 / WebM'}</span>
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

          {/* Frame Selection (for Blank mode) */}
          {mode === 'blank' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Initial Frames
              </label>

              {/* Preset Chips */}
              <div className="grid grid-cols-5 gap-2 mb-3">
                {PRESET_FRAMES.map((preset) => {
                  const isActive = frameCount === preset.count;
                  return (
                    <button
                      key={preset.count}
                      type="button"
                      onClick={() => setFrameCount(preset.count)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-mono text-sm font-bold leading-tight">
                        {preset.count}
                      </span>
                      <span
                        className={`text-[10px] leading-tight mt-0.5 ${
                          isActive ? 'text-indigo-100' : 'text-slate-400'
                        }`}
                      >
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Stepper */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <span className="text-slate-600 font-medium">Custom Frame Count (1 - 60):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleFrameCountChange(frameCount - 1)}
                    disabled={frameCount <= 1}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={frameCount}
                    onChange={(e) => handleFrameCountChange(Number(e.target.value))}
                    className="w-12 h-8 text-center bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-sm focus:outline-none focus:border-indigo-500 shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleFrameCountChange(frameCount + 1)}
                    disabled={frameCount >= 60}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 disabled:opacity-40 transition-colors shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Remix Progress */}
          {mode === 'remix' && remixProgress > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-mono text-indigo-600">
                <span>EXTRACTING FRAMES</span>
                <span>{remixProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-150"
                  style={{ width: `${remixProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || (mode === 'remix' && !remixFile)}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-1.5 disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Create Project</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
