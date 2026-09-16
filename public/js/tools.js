window.Tools = (function() {
  'use strict';
  
  const W = 960, H = 540;

  class BaseTool {
    constructor(ctx) { this.ctx = ctx; this.drawing = false; }
    begin(p, e) {}
    move(p, e) {}
    end(p, e) {}
    get cursor() { return 'crosshair'; }
  }

  class PencilTool extends BaseTool {
    begin(p, e) {
      this.drawing = true;
      this.lastPoint = p;
      const ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
    }
    move(p) {
      if (!this.drawing || !this.lastPoint) return;
      const dx = p.x - this.lastPoint.x;
      const dy = p.y - this.lastPoint.y;
      // 0.75 * 0.75 = 0.5625 (avoid Math.hypot square root)
      if (dx * dx + dy * dy < 0.5625) return;
      
      // Critical O(1) fix: stroke only the incremental segment instead of re-stroking the entire accumulated path
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
      this.lastPoint = p;
    }
    end() {
      this.drawing = false;
      this.lastPoint = null;
      this.ctx.closePath();
    }
  }

  class BrushTool extends PencilTool {
    begin(p, e) {
      const pressure = e && e.pressure ? e.pressure : 0.5;
      this.baseLine = this.ctx.lineWidth;
      this.ctx.lineWidth = this.baseLine * (0.5 + pressure);
      super.begin(p, e);
    }
    move(p, e) {
      if (!this.drawing) return;
      if (e && e.pressure) {
        this.ctx.lineWidth = this.baseLine * (0.5 + e.pressure);
      }
      super.move(p);
    }
    end() {
      this.ctx.lineWidth = this.baseLine || this.ctx.lineWidth;
      super.end();
    }
  }

  class EraserTool extends PencilTool {
    get cursor() { return 'cell'; }
  }

  class LineTool extends BaseTool {
    begin(p) {
      this.drawing = true;
      this.start = p;
      if (!this.previewCanvas) {
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.width = W;
        this.previewCanvas.height = H;
        this.previewCtx = this.previewCanvas.getContext('2d');
      }
      this.previewCtx.clearRect(0, 0, W, H);
      this.previewCtx.drawImage(this.ctx.canvas, 0, 0);
    }
    move(p) {
      if (!this.drawing || !this.previewCanvas) return;
      this.ctx.clearRect(0, 0, W, H);
      this.ctx.drawImage(this.previewCanvas, 0, 0);
      this.ctx.beginPath();
      this.ctx.moveTo(this.start.x, this.start.y);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
    }
    end() { this.drawing = false; }
  }

  class RectTool extends BaseTool {
    begin(p) {
      this.drawing = true;
      this.start = p;
      if (!this.previewCanvas) {
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.width = W;
        this.previewCanvas.height = H;
        this.previewCtx = this.previewCanvas.getContext('2d');
      }
      this.previewCtx.clearRect(0, 0, W, H);
      this.previewCtx.drawImage(this.ctx.canvas, 0, 0);
    }
    move(p) {
      if (!this.drawing || !this.previewCanvas) return;
      this.ctx.clearRect(0, 0, W, H);
      this.ctx.drawImage(this.previewCanvas, 0, 0);
      this.ctx.beginPath();
      this.ctx.rect(this.start.x, this.start.y, p.x - this.start.x, p.y - this.start.y);
      this.ctx.stroke();
    }
    end() { this.drawing = false; }
  }

  class EllipseTool extends BaseTool {
    begin(p) {
      this.drawing = true;
      this.start = p;
      if (!this.previewCanvas) {
        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.width = W;
        this.previewCanvas.height = H;
        this.previewCtx = this.previewCanvas.getContext('2d');
      }
      this.previewCtx.clearRect(0, 0, W, H);
      this.previewCtx.drawImage(this.ctx.canvas, 0, 0);
    }
    move(p) {
      if (!this.drawing || !this.previewCanvas) return;
      this.ctx.clearRect(0, 0, W, H);
      this.ctx.drawImage(this.previewCanvas, 0, 0);
      const w = p.x - this.start.x, h = p.y - this.start.y;
      this.ctx.beginPath();
      this.ctx.ellipse(
        this.start.x + w/2, this.start.y + h/2,
        Math.abs(w/2), Math.abs(h/2), 0, 0, Math.PI * 2
      );
      this.ctx.stroke();
    }
    end() { this.drawing = false; }
  }

  class FillTool extends BaseTool {
    get cursor() { return 'crosshair'; }
    begin(p, e, color) {
      // Flood fill implementation using flat index stack for high performance
      const x = Math.floor(p.x), y = Math.floor(p.y);
      if (x < 0 || x >= W || y < 0 || y >= H) return;
      const d = this.ctx.getImageData(0, 0, W, H);
      const data = d.data;
      const at = (y * W + x) * 4;
      const tr0 = data[at], tr1 = data[at + 1], tr2 = data[at + 2], tr3 = data[at + 3];
      const rgb = hexToRgb(color);
      if (tr0 === rgb[0] && tr1 === rgb[1] && tr2 === rgb[2] && tr3 === 255) return;
      
      const same = (i) => Math.abs(data[i] - tr0) + Math.abs(data[i + 1] - tr1) + 
                          Math.abs(data[i + 2] - tr2) + Math.abs(data[i + 3] - tr3) < 30;
      
      const stack = [y * W + x];
      const seen = new Uint8Array(W * H);
      seen[y * W + x] = 1;

      while (stack.length > 0) {
        const k = stack.pop();
        const px = k % W;
        const py = (k / W) | 0;
        const i = k * 4;
        if (!same(i)) continue;
        data[i] = rgb[0];
        data[i + 1] = rgb[1];
        data[i + 2] = rgb[2];
        data[i + 3] = 255;

        if (px + 1 < W && !seen[k + 1]) { seen[k + 1] = 1; stack.push(k + 1); }
        if (px - 1 >= 0 && !seen[k - 1]) { seen[k - 1] = 1; stack.push(k - 1); }
        if (py + 1 < H && !seen[k + W]) { seen[k + W] = 1; stack.push(k + W); }
        if (py - 1 >= 0 && !seen[k - W]) { seen[k - W] = 1; stack.push(k - W); }
      }
      this.ctx.putImageData(d, 0, 0);
    }
  }

  class EyedropperTool extends BaseTool {
    get cursor() { return 'copy'; }
    // begin returns color picked - handled by editor
  }

  class TextTool extends BaseTool {
    get cursor() { return 'text'; }
    async begin(p, e, onComplete) {
      this.pos = p;
      const text = await window.showInputDialog({
        title: 'Insert Text',
        label: 'Text Content',
        placeholder: 'Type your text here...',
        defaultValue: ''
      });
      if (!text) return;
      const ctx = this.ctx;
      const fontSize = ctx.lineWidth * 4 || 32;
      ctx.save();
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.globalAlpha = ctx.globalAlpha;
      ctx.fillText(text, p.x, p.y);
      ctx.restore();
      onComplete?.();
    }
    end() { this.drawing = false; }
  }

  class SelectTool extends BaseTool {
    get cursor() { return 'default'; }
    begin(p) {
      if (this.selection && p.x >= this.selection.x && p.x <= this.selection.x + this.selection.w && p.y >= this.selection.y && p.y <= this.selection.y + this.selection.h) {
        this.drawing = true;
        this.moving = true;
        this.moveOffset = { x: p.x - this.selection.x, y: p.y - this.selection.y };
        this.cleanSnapshot = this.ctx.getImageData(0, 0, W, H);
        this.ctx.clearRect(this.selection.x, this.selection.y, this.selection.w, this.selection.h);
        this.cleanSnapshot = this.ctx.getImageData(0, 0, W, H);
        return;
      }
      this.drawing = true;
      this.start = p;
      this.snapshot = this.ctx.getImageData(0, 0, W, H);
      this.selection = null;
      this.selectedData = null;
      this.moving = false;
    }
    move(p) {
      if (!this.drawing) return;
      if (this.moving && this.selectedData) {
        // Move selected area
        this.ctx.putImageData(this.cleanSnapshot, 0, 0);
        this.ctx.putImageData(this.selectedData, 
          p.x - this.moveOffset.x, 
          p.y - this.moveOffset.y);
      } else {
        // Draw selection rectangle
        this.ctx.putImageData(this.snapshot, 0, 0);
        this.ctx.save();
        this.ctx.strokeStyle = '#3978ff';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(this.start.x, this.start.y, p.x-this.start.x, p.y-this.start.y);
        this.ctx.restore();
        this.selection = {
          x: Math.min(this.start.x, p.x),
          y: Math.min(this.start.y, p.y),
          w: Math.abs(p.x - this.start.x),
          h: Math.abs(p.y - this.start.y)
        };
      }
    }
    end(p) {
      if (this.selection && !this.moving) {
        // Capture selected area
        this.selectedData = this.ctx.getImageData(
          this.selection.x, this.selection.y,
          this.selection.w, this.selection.h
        );
        this.cleanSnapshot = this.ctx.getImageData(0, 0, W, H);
        // Clear original area
        this.ctx.clearRect(this.selection.x, this.selection.y, this.selection.w, this.selection.h);
        this.cleanSnapshot = this.ctx.getImageData(0, 0, W, H);
        // Put it back; the next drag inside the selection moves it.
        this.ctx.putImageData(this.selectedData, this.selection.x, this.selection.y);
      } else if (this.selection && this.moving) {
        this.selection.x = Math.max(0, Math.min(W - this.selection.w, p.x - this.moveOffset.x));
        this.selection.y = Math.max(0, Math.min(H - this.selection.h, p.y - this.moveOffset.y));
      }
      this.drawing = false;
    }
  }

  // Helper
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  return {
    BaseTool, PencilTool, BrushTool, EraserTool, LineTool, RectTool,
    EllipseTool, FillTool, EyedropperTool, TextTool, SelectTool,
    hexToRgb, W, H
  };
})();
