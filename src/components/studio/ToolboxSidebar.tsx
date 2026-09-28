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

const STUDIO_PALETTE = [
  '#0f172a', // Slate Dark
  '#4f46e5', // Vibrant Indigo
  '#f59e0b', // Studio Amber
  '#ef4444', // Coral Red
  '#10b981', // Emerald Green
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
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
    { id: 'pencil', label: 'Pencil', icon: <PencilIcon size={17} />, shortcut: 'B' },
    { id: 'brush', label: 'Brush', icon: <BrushIcon size={17} />, shortcut: '' },
    { id: 'eraser', label: 'Eraser', icon: <EraserIcon size={17} />, shortcut: 'E' },
    { id: 'fill', label: 'Fill', icon: <BucketIcon size={17} />, shortcut: 'G' },
    { id: 'line', label: 'Line', icon: <LineShapeIcon size={17} />, shortcut: '' },
    { id: 'rect', label: 'Rect', icon: <RectShapeIcon size={17} />, shortcut: '' },
    { id: 'ellipse', label: 'Oval', icon: <CircleShapeIcon size={17} />, shortcut: '' },
    { id: 'select', label: 'Select', icon: <SelectShapeIcon size={17} />, shortcut: 'V' },
    { id: 'eyedropper', label: 'Picker', icon: <PipetteIcon size={17} />, shortcut: 'I' },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between p-4 select-none overflow-y-auto">
      <div className="space-y-6">
        {/* Tools Section */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Drawing Tools
            </span>
            <span className="text-[10px] font-mono text-slate-400">Key</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {toolItems.map((item) => {
              const isActive = activeTool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTool(item.id)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${
                    isActive
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-2xs font-bold'
                      : 'bg-slate-50/50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                  title={`${item.label} ${item.shortcut ? `(${item.shortcut})` : ''}`}
                >
                  {item.icon}
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Color Palette
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-slate-500 uppercase">{activeColor}</span>
              <label className="w-5 h-5 rounded-full border border-slate-300 cursor-pointer overflow-hidden block shadow-2xs">
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
            {STUDIO_PALETTE.map((c) => {
              const isSelected = activeColor.toLowerCase() === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActiveColor(c)}
                  className={`h-7 rounded-full border transition-all ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-xs'
                      : 'border-slate-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>

        {/* Stroke Width Slider */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Stroke Width
            </span>
            <span className="font-mono text-xs font-bold text-slate-700">
              {activeStrokeWidth}px
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={40}
            value={activeStrokeWidth}
            onChange={(e) => setActiveStrokeWidth(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Onion Skinning Controls */}
        <div>
          <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 block mb-2">
            Onion Skinning
          </span>
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition-colors">
              <span>Previous Frame</span>
              <input
                type="checkbox"
                checked={onionSkinPrev}
                onChange={(e) => setOnionSkinPrev(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 transition-colors">
              <span>Next Frame</span>
              <input
                type="checkbox"
                checked={onionSkinNext}
                onChange={(e) => setOnionSkinNext(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Clear Canvas Action */}
      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClearCanvas}
          className="w-full py-2 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 rounded-xl transition-colors"
        >
          Clear Canvas
        </button>
      </div>
    </aside>
  );
}
