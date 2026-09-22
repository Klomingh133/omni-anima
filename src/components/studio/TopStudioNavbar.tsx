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
    <header className="h-14 bg-white border-b border-[#1f00ff] px-4 flex items-center justify-between z-30 select-none">
      {/* Left section: Logo & Project Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/app"
          onClick={() => showLoader('Navigating to Dashboard...')}
          className="flex items-center gap-2 group text-[#1f00ff]"
          title="Back to Studio Dashboard"
        >
          <div className="w-8 h-8 border border-[#1f00ff] rounded-[5px] flex items-center justify-center bg-white group-hover:bg-[#1f00ff] group-hover:text-white transition-colors">
            <OmniLogo size={18} />
          </div>
          <span className="hidden sm:inline font-display text-xl font-bold tracking-wider uppercase text-[#1f00ff]">
            OMNIANIMA
          </span>
        </Link>

        <div className="h-4 w-[1px] bg-[#d3d3d3] hidden sm:block" />

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
              className="px-2 py-1 text-sm font-semibold border border-[#1f00ff] rounded-[4px] bg-white outline-none text-[#212121]"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTitleInput(projectName);
                setIsEditingTitle(true);
              }}
              className="text-sm font-semibold text-[#212121] hover:text-[#1f00ff] hover:underline flex items-center gap-1.5"
              title="Click to rename project"
            >
              <span>{projectName}</span>
              <span className="text-[10px] text-[#666] font-mono">✎</span>
            </button>
          )}

          {/* Autosave badge */}
          <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-[3px] border border-[#ececec] text-[#666]">
            {saveStatus === 'saving' ? (
              <span className="text-[#ff622b]">SAVING...</span>
            ) : (
              <span>SAVED</span>
            )}
          </span>
        </div>
      </div>

      {/* Middle section: Playback & Timeline Controls */}
      <div className="flex items-center gap-3">
        {/* Undo / Redo */}
        <div className="flex items-center border border-[#d3d3d3] rounded-[5px] bg-[#f8f8f8] p-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="px-2.5 py-1 text-xs font-mono font-bold text-[#212121] hover:text-[#1f00ff] disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            UNDO
          </button>
          <div className="w-[1px] h-3 bg-[#d3d3d3]" />
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="px-2.5 py-1 text-xs font-mono font-bold text-[#212121] hover:text-[#1f00ff] disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            REDO
          </button>
        </div>

        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-[5px] border text-xs font-semibold uppercase tracking-wider transition-colors ${
            isPlaying
              ? 'bg-[#1f00ff] text-white border-[#1f00ff]'
              : 'bg-white text-[#1f00ff] border-[#1f00ff] hover:bg-[#f2f2f2]'
          }`}
          title="Play/Pause (Spacebar)"
        >
          {isPlaying ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* FPS selector */}
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <select
            value={fps}
            onChange={(e) => setFps(Number(e.target.value))}
            className="px-2 py-1 bg-white border border-[#d3d3d3] rounded-[4px] text-xs font-mono font-bold text-[#1f00ff] outline-none"
          >
            <option value={8}>8 FPS</option>
            <option value={12}>12 FPS</option>
            <option value={24}>24 FPS</option>
            <option value={30}>30 FPS</option>
          </select>
        </div>

        {/* Frame index indicator */}
        <div className="hidden md:flex items-center gap-1 font-mono text-xs font-bold text-[#212121] px-2.5 py-1 border border-[#d3d3d3] rounded-[5px] bg-[#f8f8f8]">
          <span className="text-[#1f00ff]">
            {(currentFrameIndex + 1).toString().padStart(2, '0')}
          </span>
          <span className="text-[#999]">/</span>
          <span>{frames.length.toString().padStart(2, '0')}</span>
        </div>
      </div>

      {/* Right section: Export and Publish CTAs */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExport}
          className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#f2f2f2] rounded-[5px] transition-colors"
          title="Export to WebM video"
        >
          Export WebM
        </button>

        <button
          type="button"
          onClick={onPublish}
          className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[5px] transition-colors"
          title="Publish animation to public community feed"
        >
          Publish
        </button>
      </div>
    </header>
  );
}
