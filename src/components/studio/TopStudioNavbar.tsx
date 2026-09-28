'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { OmniLogo, PlayIcon, PauseIcon } from '@/components/ui/Icons';
import { useTimelineStore } from '@/store/use-timeline-store';
import { useLoadingStore } from '@/store/use-loading-store';

interface TopStudioNavbarProps {
  onExport: () => void;
  onPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function TopStudioNavbar({
  onExport,
  onPublish,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: TopStudioNavbarProps) {
  const {
    projectName,
    setProjectName,
    fps,
    setFps,
    frames,
    currentFrameIndex,
    isPlaying,
    togglePlay,
    saveStatus,
  } = useTimelineStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectName);
  const showLoader = useLoadingStore((s) => s.show);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      setProjectName(titleInput.trim());
    } else {
      setTitleInput(projectName);
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="h-14 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 flex items-center justify-between z-30 select-none">
      {/* Left section: Back button & Project Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link
          href="/app"
          onClick={() => showLoader('Navigating to Dashboard...')}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-colors text-xs font-semibold"
          title="Back to Studio Dashboard"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Studio</span>
        </Link>

        <div className="h-4 w-[1px] bg-slate-200" />

        {/* Project Name editable */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              autoFocus
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
              className="px-2.5 py-1 text-sm font-bold border border-indigo-500 rounded-lg bg-white outline-none text-slate-900 shadow-2xs"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(projectName);
                setIsEditingTitle(true);
              }}
              className="text-sm font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-1.5 transition-colors"
              title="Click to rename project"
            >
              <span>{projectName}</span>
              <span className="text-xs text-slate-400">✎</span>
            </button>
          )}

          {/* Autosave status pill */}
          <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-full border">
            {saveStatus === 'saving' ? (
              <span className="text-amber-600 bg-amber-50 border-amber-200">Saving...</span>
            ) : saveStatus === 'error' ? (
              <span className="text-red-600 bg-red-50 border-red-200">Save Error</span>
            ) : (
              <span className="text-emerald-600 bg-emerald-50 border-emerald-200">✓ Saved</span>
            )}
          </span>
        </div>
      </div>

      {/* Middle section: Playback & Timeline Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-100 p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-colors"
            title="Undo (Ctrl+Z)"
          >
            Undo
          </button>
          <div className="w-[1px] h-3 bg-slate-200" />
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 disabled:opacity-30 rounded-lg transition-colors"
            title="Redo (Ctrl+Y)"
          >
            Redo
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
            isPlaying
              ? 'bg-indigo-600 text-white shadow-indigo-200'
              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
          }`}
          title="Play/Pause (Spacebar)"
        >
          {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        {/* FPS selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 outline-none focus:border-indigo-500 shadow-2xs"
          >
            <option value={8}>8 FPS</option>
            <option value={12}>12 FPS</option>
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
          </select>
        </div>

        {/* Frame index indicator */}
        <div className="hidden md:flex items-center gap-1 font-mono text-xs font-bold text-slate-700 px-2.5 py-1 border border-slate-200 rounded-lg bg-slate-50">
          <span className="text-indigo-600">
            {(currentFrameIndex + 1).toString().padStart(2, '0')}
          </span>
          <span className="text-slate-300">/</span>
          <span>{frames.length.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Right section: Export and Publish CTAs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onExport}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-2xs"
          title="Export to WebM video"
        >
          Export WebM
        </button>

        <button
          type="button"
          onClick={onPublish}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs"
          title="Publish animation to public community feed"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
