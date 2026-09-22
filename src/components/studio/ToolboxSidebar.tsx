'use client';

import React from 'react';
import {
  PencilIcon,
  BrushIcon,
  EraserIcon,
  BucketIcon,
  LineShapeIcon,
  RectShapeIcon,
  CircleShapeIcon,
  SelectShapeIcon,
  PipetteIcon,
} from '@/components/ui/Icons';
import { ToolType } from '@/engine/types';
import { useTimelineStore } from '@/store/use-timeline-store';

interface ToolboxSidebarProps {
  onClearCanvas: () => void;
}

const BLUEPRINT_PALETTE = [
  '#212121', // Ink
  '#1f00ff', // Electric Indigo
  '#ff622b', // Patch Orange
  '#dc2626', // Danger Red
  '#16a34a', // Grass Green
  '#0284c7', // Sky Blue
  '#9333ea', // Violet
  '#ffffff', // Pure White
];

export function ToolboxSidebar({ onClearCanvas }: ToolboxSidebarProps) {
  const {
    activeTool,
    setActiveTool,
    activeColor,
    setActiveColor,
    activeStrokeWidth,
    setActiveStrokeWidth,
    onionSkinPrev,
    setOnionSkinPrev,
    onionSkinNext,
    setOnionSkinNext,
  } = useTimelineStore();

  const toolItems: Array<{ id: ToolType; label: string; icon: React.ReactNode; shortcut: string }> = [
    { id: 'pencil', label: 'Pencil', icon: <PencilIcon size={18} />, shortcut: 'B' },
    { id: 'brush', label: 'Brush', icon: <BrushIcon size={18} />, shortcut: '' },
    { id: 'eraser', label: 'Eraser', icon: <EraserIcon size={18} />, shortcut: 'E' },
    { id: 'fill', label: 'Fill', icon: <BucketIcon size={18} />, shortcut: 'G' },
    { id: 'line', label: 'Line', icon: <LineShapeIcon size={18} />, shortcut: '' },
    { id: 'rect', label: 'Rect', icon: <RectShapeIcon size={18} />, shortcut: '' },
    { id: 'ellipse', label: 'Ellipse', icon: <CircleShapeIcon size={18} />, shortcut: '' },
    { id: 'select', label: 'Select', icon: <SelectShapeIcon size={18} />, shortcut: 'S' },
    { id: 'eyedropper', label: 'Picker', icon: <PipetteIcon size={18} />, shortcut: 'I' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#1f00ff] flex flex-col justify-between p-4 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Tools Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1f00ff]">
              DRAWING TOOLS
            </span>
            <span className="text-[11px] font-mono text-[#666]">SHORTCUT</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {toolItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTool(item.id)}
                className={`p-2.5 rounded-[5px] border flex flex-col items-center justify-center gap-1 transition-colors ${
                  activeTool === item.id
                    ? 'bg-[#1f00ff] text-white border-[#1f00ff]'
                    : 'bg-[#f8f8f8] text-[#212121] border-[#d3d3d3] hover:border-[#1f00ff]'
                }`}
                title={`${item.label} ${item.shortcut ? `(${item.shortcut})` : ''}`}
              >
                {item.icon}
                <span className="text-[10px] font-mono font-medium leading-none">
                  {item.label.slice(0, 7)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1f00ff]">
              COLOR PALETTE
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-[#666] uppercase">{activeColor}</span>
              <label className="w-5 h-5 rounded-[3px] border border-[#d3d3d3] cursor-pointer overflow-hidden block">
                <input
                  type="color"
                  value={activeColor}
                  onChange={(e) => setActiveColor(e.target.value)}
                  className="opacity-0 w-full h-full cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {BLUEPRINT_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveColor(c)}
                className={`h-8 rounded-[4px] border transition-transform relative ${
                  activeColor.toLowerCase() === c.toLowerCase()
                    ? 'scale-105 border-black ring-2 ring-[#1f00ff]'
                    : 'border-[#d3d3d3]'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Stroke Width Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1f00ff]">
              STROKE WIDTH
            </span>
            <span className="font-mono text-xs font-bold text-[#212121]">
              {activeStrokeWidth}PX
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={activeStrokeWidth}
            onChange={(e) => setActiveStrokeWidth(Number(e.target.value))}
            className="w-full accent-[#1f00ff] cursor-pointer"
          />
        </div>

        {/* Onion Skinning Controls */}
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#1f00ff] block mb-2">
            ONION SKIN GHOSTING
          </span>
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded-[5px] border border-[#d3d3d3] bg-[#f8f8f8] cursor-pointer text-xs font-semibold">
              <span>PREVIOUS FRAME</span>
              <input
                type="checkbox"
                checked={onionSkinPrev}
                onChange={(e) => setOnionSkinPrev(e.target.checked)}
                className="w-4 h-4 accent-[#1f00ff]"
              />
            </label>
            <label className="flex items-center justify-between p-2 rounded-[5px] border border-[#d3d3d3] bg-[#f8f8f8] cursor-pointer text-xs font-semibold">
              <span>NEXT FRAME</span>
              <input
                type="checkbox"
                checked={onionSkinNext}
                onChange={(e) => setOnionSkinNext(e.target.checked)}
                className="w-4 h-4 accent-[#1f00ff]"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Clear Canvas Action */}
      <div className="pt-4 border-t border-[#ececec]">
        <button
          type="button"
          onClick={onClearCanvas}
          className="w-full py-2 text-xs font-semibold uppercase tracking-wider text-[#dc2626] border border-[#dc2626] hover:bg-[#fee2e2] rounded-[5px] transition-colors"
        >
          Clear Active Canvas
        </button>
      </div>
    </aside>
  );
}
