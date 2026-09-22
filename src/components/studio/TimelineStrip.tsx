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
    <div className="h-28 bg-white border-t border-[#1f00ff] px-4 py-2 flex items-center justify-between z-20 select-none">
      {/* Frames Scroll Area */}
      <div className="flex-1 flex items-center gap-3 overflow-x-auto py-1 pr-4">
        {frames.map((frame, index) => {
          const isActive = index === currentFrameIndex;

          return (
            <div
              key={frame.id || index}
              onClick={() => setCurrentFrameIndex(index)}
              className={`relative flex-shrink-0 w-24 h-20 rounded-[5px] border cursor-pointer group flex flex-col justify-between p-1 bg-white transition-all ${
                isActive
                  ? 'border-[#1f00ff] ring-2 ring-[#1f00ff] shadow-sm'
                  : 'border-[#d3d3d3] hover:border-[#1f00ff]'
              }`}
            >
              {/* Header inside frame card */}
              <div className="flex items-center justify-between text-[10px] font-mono leading-none">
                <span className={`font-bold ${isActive ? 'text-[#1f00ff]' : 'text-[#666]'}`}>
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#ff622b]" />}
              </div>

              {/* Thumbnail image */}
              <div className="flex-1 w-full bg-[#f8f8f8] border border-[#ececec] rounded-[3px] overflow-hidden my-0.5">
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
                    className="text-[#666] hover:text-[#1f00ff] font-bold px-0.5"
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
                    className="text-[#666] hover:text-[#1f00ff] font-bold px-0.5"
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
          className="flex-shrink-0 w-20 h-20 rounded-[5px] border border-dashed border-[#1f00ff] hover:bg-[#f8f8f8] flex flex-col items-center justify-center gap-1 text-[#1f00ff] transition-colors"
          title="Add New Blank Frame"
        >
          <span className="text-xl font-bold leading-none">+</span>
          <span className="text-[10px] font-mono font-semibold uppercase">FRAME</span>
        </button>
      </div>

      {/* Frame contextual controls */}
      <div className="flex flex-col items-end gap-1.5 pl-4 border-l border-[#ececec]">
        <button
          type="button"
          onClick={() => onDuplicateFrame(currentFrameIndex)}
          className="px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[#1f00ff] border border-[#1f00ff] hover:bg-[#f2f2f2] rounded-[4px] transition-colors"
          title="Duplicate Current Frame"
        >
          DUPLICATE
        </button>

        <button
          type="button"
          disabled={frames.length <= 1}
          onClick={() => onDeleteFrame(currentFrameIndex)}
          className="px-3 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-[#dc2626] border border-[#dc2626] hover:bg-[#fee2e2] rounded-[4px] transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
          title="Delete Current Frame"
        >
          DELETE
        </button>
      </div>
    </div>
  );
}
