'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLoadingStore } from '@/store/use-loading-store';

const PALETTE = ['#0f172a', '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#2563eb'];

export function InteractiveDoodlePad() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#0f172a');
  const [hasDrawn, setHasDrawn] = useState(false);
  const showLoader = useLoadingStore((s) => s.show);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // White surface
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Initial playful welcoming doodle curve
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.arc(480, 250, 45, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(465, 240, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(495, 240, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(480, 255, 24, 0.2 * Math.PI, 0.8 * Math.PI);
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
    setHasDrawn(true);
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
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
    setHasDrawn(false);
  };

  const handleLaunchStudio = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    sessionStorage.setItem('omni_sketch_carryover', dataUrl);
    showLoader('Opening Studio Workspace...');
    router.push('/app');
  };

  return (
    <section id="playground" className="w-full max-w-5xl mx-auto bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#334155]">
          <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
          <span>Interactive Sandbox • Sketch directly on the canvas</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Palette Swatches */}
          <div className="flex items-center gap-1.5 bg-[#f1f5f9] px-2 py-1 rounded-full border border-[#e2e8f0]">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-5 h-5 rounded-full border-2 transition-all ${
                  color === c ? 'scale-125 border-[#0f172a] shadow-sm' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                title={`Color: ${c}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="px-3.5 py-1.5 bg-white hover:bg-[#f1f5f9] text-[#334155] border border-[#e2e8f0] rounded-full text-xs font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>🗑 Clear</span>
          </button>

          <button
            type="button"
            onClick={handleLaunchStudio}
            className="px-4 py-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-full text-xs font-semibold inline-flex items-center gap-1 shadow-[0_4px_12px_rgba(79,70,229,0.25)] transition-all"
          >
            <span>Launch Studio ↗</span>
          </button>
        </div>
      </div>

      {/* Stage Wrapper */}
      <div className="relative aspect-[16/9] w-full bg-white rounded-xl overflow-hidden border border-[#e2e8f0] cursor-crosshair shadow-inner">
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

        {!hasDrawn && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 border border-[#e2e8f0] px-4 py-1.5 rounded-full text-xs font-semibold text-[#64748b] pointer-events-none shadow-sm">
            Click and drag to sketch freely
          </div>
        )}
      </div>
    </section>
  );
}
