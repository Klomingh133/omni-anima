'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { CanvasEngine } from '@/engine/canvas-engine';
import { useTimelineStore } from '@/store/use-timeline-store';

interface CanvasViewportProps {
  onEngineReady?: (engine: CanvasEngine) => void;
  onAutosaveFrame: (frameIndex: number, imageData: string) => void;
}

export function CanvasViewport({ onEngineReady, onAutosaveFrame }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<CanvasEngine | null>(null);

  const {
    frames,
    currentFrameIndex,
    activeTool,
    activeColor,
    activeStrokeWidth,
    onionSkinPrev,
    onionSkinNext,
    updateActiveFrameImage,
    setCurrentFrameIndex,
    setActiveTool,
    setActiveColor,
    togglePlay,
    addFrame,
  } = useTimelineStore();

  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize CanvasEngine once
  useEffect(() => {
    if (!containerRef.current) return;

    const engine = new CanvasEngine(containerRef.current, 960, 540);
    engineRef.current = engine;

    engine.setOnChange((dataUrl) => {
      const idx = useTimelineStore.getState().currentFrameIndex;
      updateActiveFrameImage(dataUrl);

      // Debounced autosave
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = setTimeout(() => {
        onAutosaveFrame(idx, dataUrl);
      }, 400);
    });

    engine.setOnColorPick((hex) => {
      setActiveColor(hex);
    });

    if (onEngineReady) {
      onEngineReady(engine);
    }

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      engine.destroy();
      engineRef.current = null;
    };
  }, [onAutosaveFrame, onEngineReady, setActiveColor, updateActiveFrameImage]);

  // Sync tool
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setTool(activeTool);
    }
  }, [activeTool]);

  // Sync color
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setColor(activeColor);
    }
  }, [activeColor]);

  // Sync stroke width
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setStrokeWidth(activeStrokeWidth);
    }
  }, [activeStrokeWidth]);

  // Sync onion skin config
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setOnionSkin(onionSkinPrev, onionSkinNext);
    }
  }, [onionSkinPrev, onionSkinNext]);

  // Load current frame & render onion skin
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    const current = frames[currentFrameIndex];
    if (current) {
      engine.loadFrameData(current.image_data).then(() => {
        const prevFrame = currentFrameIndex > 0 ? frames[currentFrameIndex - 1]?.image_data : null;
        const nextFrame =
          currentFrameIndex < frames.length - 1 ? frames[currentFrameIndex + 1]?.image_data : null;
        engine.renderOnionSkin(prevFrame, nextFrame);
      });
    }
  }, [currentFrameIndex, frames, onionSkinPrev, onionSkinNext]);

  // Keyboard Shortcuts handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ignore if typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'b' || e.key === 'B') {
        setActiveTool('pencil');
      } else if (e.key === 'e' || e.key === 'E') {
        setActiveTool('eraser');
      } else if (e.key === 'g' || e.key === 'G') {
        setActiveTool('fill');
      } else if (e.key === 's' || e.key === 'S') {
        setActiveTool('select');
      } else if (e.key === 'i' || e.key === 'I') {
        setActiveTool('eyedropper');
      } else if (e.key === '[') {
        if (currentFrameIndex > 0) setCurrentFrameIndex(currentFrameIndex - 1);
      } else if (e.key === ']') {
        if (currentFrameIndex < frames.length - 1) setCurrentFrameIndex(currentFrameIndex + 1);
      } else if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (engineRef.current) engineRef.current.undo();
      } else if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        if (engineRef.current) engineRef.current.redo();
      }
    },
    [currentFrameIndex, frames.length, setActiveTool, setCurrentFrameIndex, togglePlay]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex-1 bg-[#f2f2f2] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Blueprint grid background */}
      <div className="absolute inset-0 bg-blueprint-grid opacity-60 pointer-events-none" />

      {/* Drafting frame container */}
      <div className="relative z-10 w-full max-w-4xl aspect-[16/9] bg-white border border-[#1f00ff] rounded-[5px] shadow-blueprint-hard overflow-hidden">
        <div ref={containerRef} className="w-full h-full relative" />
      </div>

      {/* Blueprint Canvas Info Readout */}
      <div className="relative z-10 mt-3 flex items-center justify-between w-full max-w-4xl px-2 text-[11px] font-mono text-[#666]">
        <span>CANVAS: 960 × 540 PX (16:9 DRAFTING SURFACE)</span>
        <span>TOOL: {activeTool.toUpperCase()} // COLOR: {activeColor.toUpperCase()}</span>
      </div>
    </div>
  );
}
