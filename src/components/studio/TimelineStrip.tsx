'use client';

import React from 'react';
import { useTimelineStore } from '@/store/use-timeline-store';

interface TimelineStripProps {
  onAddFrame: () => void;
  onDuplicateFrame: (index: number) => void;
  onDeleteFrame: (index: number) => void;
  onReorderFrame: (oldIndex: number, newIndex: number) => void;
}

export function TimelineStrip({
  onAddFrame,
  onDuplicateFrame,
  onDeleteFrame,
  onReorderFrame,
}: TimelineStripProps) {
  const { frames, currentFrameIndex, setCurrentFrameIndex } = useTimelineStore();

  return (
    <div className="h-28 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-between z-20 select-none">
      {/* Frames Scroll Area */}
      <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1 pr-4">
        {frames.map((frame, index) => {
          const isActive = index === currentFrameIndex;

          return (
            <div
              key={frame.id || index}
              onClick={() => setCurrentFrameIndex(index)}
              className={`relative flex-shrink-0 w-24 h-20 rounded-xl border cursor-pointer group flex flex-col justify-between p-1.5 bg-white transition-all ${
                isActive
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200 hover:border-indigo-300 hover:shadow-xs'
              }`}
            >
              {/* Header inside frame card */}
              <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                <span className={`font-bold ${isActive ? 'text-indigo-600' : 'text-slate-500'}`}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
              </div>

              {/* Thumbnail image */}
              <div className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-lg overflow-hidden my-0.5 flex items-center justify-center">
                {frame.image_data ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frame.image_data}
                    alt={`Frame ${index + 1}`}
                    className="w-full h-full object-contain pointer-events-none"
                  />
                ) : (
                  <div className="w-full h-full bg-white" />
                )}
              </div>

              {/* Actions on hover/active */}
              <div className="flex items-center justify-between pt-0.5 text-[9px] font-mono">
                {index > 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderFrame(index, index - 1);
                    }}
                    className="text-slate-400 hover:text-indigo-600 font-bold px-0.5"
                    title="Move Left"
                  >
                    ◀
                  </button>
                ) : (
                  <span className="w-2" />
                )}

                {index < frames.length - 1 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReorderFrame(index, index + 1);
                    }}
                    className="text-slate-400 hover:text-indigo-600 font-bold px-0.5"
                    title="Move Right"
                  >
                    ▶
                  </button>
                ) : (
                  <span className="w-2" />
                )}
              </div>
            </div>
          );
        })}

        {/* Add New Frame Button */}
        <button
          type="button"
          onClick={onAddFrame}
          className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center gap-1 text-indigo-600 transition-all shadow-2xs group"
          title="Add New Blank Frame (N)"
        >
          <span className="text-xl font-bold leading-none group-hover:scale-110 transition-transform">+</span>
          <span className="text-[10px] font-mono font-semibold uppercase">Frame</span>
        </button>
      </div>

      {/* Frame contextual controls */}
      <div className="flex flex-col items-end gap-1.5 pl-4 border-l border-slate-100">
        <button
          type="button"
          onClick={() => onDuplicateFrame(currentFrameIndex)}
          className="px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 hover:bg-indigo-50 rounded-lg transition-colors shadow-2xs"
          title="Duplicate Current Frame"
        >
          Duplicate
        </button>

        <button
          type="button"
          disabled={frames.length <= 1}
          onClick={() => onDeleteFrame(currentFrameIndex)}
          className="px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:hover:bg-transparent shadow-2xs"
          title="Delete Current Frame"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
