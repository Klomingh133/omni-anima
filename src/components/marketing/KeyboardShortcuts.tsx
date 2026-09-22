import React from 'react';

const shortcuts = [
  { key: 'SPACE', action: 'Play / Pause Animation Playback' },
  { key: 'B', action: 'Select Pencil Tool' },
  { key: 'E', action: 'Select Eraser Tool' },
  { key: 'G', action: 'Smart Flood Fill' },
  { key: 'I', action: 'Eyedropper Color Sampler' },
  { key: 'S', action: 'Marquee Area Selection' },
  { key: 'CTRL + Z', action: 'Undo Last Action' },
  { key: 'CTRL + Y', action: 'Redo Action' },
  { key: '[', action: 'Previous Frame' },
  { key: ']', action: 'Next Frame' },
  { key: 'CTRL + D', action: 'Duplicate Current Frame' },
  { key: 'DELETE', action: 'Delete Current Frame' },
];

export function KeyboardShortcuts() {
  return (
    <section id="shortcuts" className="py-20 bg-white border-b border-[#1f00ff]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1f00ff] rounded-[5px] bg-[#f8f8f8] mb-4">
            <span className="font-mono text-xs font-semibold text-[#1f00ff] uppercase tracking-wider">
              STUDIO CONTROLS
            </span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold uppercase tracking-tight text-[#1f00ff] leading-[0.92]">
            KEYBOARD ACCELERATORS.
          </h2>
          <p className="text-base text-[#212121] mt-3">
            Accelerate your workflow with keyboard bindings designed for professional animator muscle memory.
          </p>
        </div>

        {/* Shortcuts grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-4 border border-[#d3d3d3] hover:border-[#1f00ff] rounded-[5px] bg-[#f8f8f8] transition-colors"
            >
              <span className="text-sm font-medium text-[#212121]">
                {s.action}
              </span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold text-[#1f00ff] bg-white border border-[#1f00ff] rounded-[4px] shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
