'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PencilIcon, EraserIcon } from '@/components/ui/Icons';
import { useLoadingStore } from '@/store/use-loading-store';

export function InteractiveDoodlePad() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#1f00ff');
  const [brushSize, setBrushSize] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const showLoader = useLoadingStore((s) => s.show);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial playful doodle
    ctx.strokeStyle = '#1f00ff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw an initial welcoming sketch curve
    ctx.beginPath();
    ctx.arc(240, 180, 40, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(225, 170, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#1f00ff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(255, 170, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(240, 185, 20, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : color;
    ctx.lineWidth = isEraser ? brushSize * 4 : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleOpenInStudio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    sessionStorage.setItem('omni_sketch_carryover', dataUrl);
    showLoader('Opening Studio...');
    router.push('/app');
  };

  return (
    <div className="w-full bg-white border border-[#1f00ff] rounded-[5px] overflow-hidden shadow-blueprint-hard flex flex-col">
      {/* Top drafting toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8f8f8] border-b border-[#1f00ff]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1f00ff]" />
            <span className="font-mono text-xs font-semibold text-[#1f00ff] uppercase tracking-wider">
              DOODLE PAD // 01
            </span>
          </div>

          <div className="h-4 w-[1px] bg-[#d3d3d3]" />

          {/* Quick colors */}
          <div className="flex items-center gap-1.5">
            {['#1f00ff', '#ff622b', '#212121', '#16a34a', '#dc2626'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setIsEraser(false);
                }}
                className={`w-5 h-5 rounded-[3px] border transition-transform ${
                  color === c && !isEraser
                    ? 'scale-110 border-black ring-1 ring-black'
                    : 'border-[#d3d3d3]'
                }`}
                style={{ backgroundColor: c }}
                title={`Pick ${c}`}
              />
            ))}
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1 ml-1">
            <button
              type="button"
              onClick={() => setIsEraser(false)}
              className={`p-1.5 rounded-[4px] border ${
                !isEraser ? 'bg-[#1f00ff] text-white border-[#1f00ff]' : 'bg-white text-[#212121] border-[#d3d3d3]'
              }`}
              title="Pencil"
            >
              <PencilIcon size={14} />
            </button>
            <button
              type="button"
              onClick={() => setIsEraser(true)}
              className={`p-1.5 rounded-[4px] border ${
                isEraser ? 'bg-[#1f00ff] text-white border-[#1f00ff]' : 'bg-white text-[#212121] border-[#d3d3d3]'
              }`}
              title="Eraser"
            >
              <EraserIcon size={14} />
            </button>
          </div>
        </div>

        {/* Clear & Animate buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#212121] hover:bg-[#ececec] border border-[#d3d3d3] rounded-[4px]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleOpenInStudio}
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white bg-[#ff622b] hover:bg-[#e54f1f] rounded-[4px] transition-colors"
          >
            Open in Studio
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative aspect-[16/9] w-full bg-white cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full block touch-none"
        />
      </div>

      {/* Bottom hint bar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#f8f8f8] border-t border-[#ececec] text-[11px] font-mono text-[#666]">
        <span>FREEFORM SKETCH SURFACE</span>
        <span>960 × 540 PX RESOLUTION</span>
      </div>
    </div>
  );
}
