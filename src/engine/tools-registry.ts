import { Point, SelectionBounds } from './types';

export function hexToRgb(hex: string): [number, number, number] {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

export abstract class BaseTool {
  protected ctx: CanvasRenderingContext2D;
  protected width: number;
  protected height: number;
  public drawing: boolean = false;

  constructor(ctx: CanvasRenderingContext2D, width: number = 960, height: number = 540) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  abstract begin(p: Point, e?: PointerEvent | MouseEvent): void;
  abstract move(p: Point, e?: PointerEvent | MouseEvent): void;
  abstract end(p?: Point, e?: PointerEvent | MouseEvent): void;

  get cursor(): string {
    return 'crosshair';
  }
}

export class PencilTool extends BaseTool {
  protected lastPoint: Point | null = null;

  begin(p: Point) {
    this.drawing = true;
    this.lastPoint = p;
    this.ctx.beginPath();
    this.ctx.moveTo(p.x, p.y);
    this.ctx.lineTo(p.x + 0.01, p.y + 0.01);
    this.ctx.stroke();
  }

  move(p: Point) {
    if (!this.drawing || !this.lastPoint) return;
    const dx = p.x - this.lastPoint.x;
    const dy = p.y - this.lastPoint.y;
    if (dx * dx + dy * dy < 0.5625) return;

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

export class BrushTool extends PencilTool {
  private baseWidth: number = 2;

  begin(p: Point, e?: PointerEvent | MouseEvent) {
    const pressure = (e as PointerEvent)?.pressure || 0.5;
    this.baseWidth = this.ctx.lineWidth;
    this.ctx.lineWidth = this.baseWidth * (0.4 + pressure);
    super.begin(p);
  }

  move(p: Point, e?: PointerEvent | MouseEvent) {
    if (!this.drawing) return;
    if (e && 'pressure' in e && (e as PointerEvent).pressure) {
      this.ctx.lineWidth = this.baseWidth * (0.4 + (e as PointerEvent).pressure);
    }
    super.move(p);
  }

  end() {
    this.ctx.lineWidth = this.baseWidth;
    super.end();
  }
}

export class EraserTool extends PencilTool {
  private prevComposite: GlobalCompositeOperation = 'source-over';

  begin(p: Point) {
    this.prevComposite = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'destination-out';
    super.begin(p);
  }

  end() {
    super.end();
    this.ctx.globalCompositeOperation = this.prevComposite;
  }

  override get cursor(): string {
    return 'cell';
  }
}

export class LineTool extends BaseTool {
  private start: Point | null = null;
  private snapshot: ImageData | null = null;

  begin(p: Point) {
    this.drawing = true;
    this.start = p;
    this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  move(p: Point) {
    if (!this.drawing || !this.start || !this.snapshot) return;
    this.ctx.putImageData(this.snapshot, 0, 0);
    this.ctx.beginPath();
    this.ctx.moveTo(this.start.x, this.start.y);
    this.ctx.lineTo(p.x, p.y);
    this.ctx.stroke();
  }

  end() {
    this.drawing = false;
    this.start = null;
    this.snapshot = null;
  }
}

export class RectTool extends BaseTool {
  private start: Point | null = null;
  private snapshot: ImageData | null = null;

  begin(p: Point) {
    this.drawing = true;
    this.start = p;
    this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  move(p: Point) {
    if (!this.drawing || !this.start || !this.snapshot) return;
    this.ctx.putImageData(this.snapshot, 0, 0);
    this.ctx.beginPath();
    this.ctx.rect(this.start.x, this.start.y, p.x - this.start.x, p.y - this.start.y);
    this.ctx.stroke();
  }

  end() {
    this.drawing = false;
    this.start = null;
    this.snapshot = null;
  }
}

export class EllipseTool extends BaseTool {
  private start: Point | null = null;
  private snapshot: ImageData | null = null;

  begin(p: Point) {
    this.drawing = true;
    this.start = p;
    this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);
  }

  move(p: Point) {
    if (!this.drawing || !this.start || !this.snapshot) return;
    this.ctx.putImageData(this.snapshot, 0, 0);
    const w = p.x - this.start.x;
    const h = p.y - this.start.y;
    this.ctx.beginPath();
    this.ctx.ellipse(
      this.start.x + w / 2,
      this.start.y + h / 2,
      Math.abs(w / 2),
      Math.abs(h / 2),
      0,
      0,
      Math.PI * 2
    );
    this.ctx.stroke();
  }

  end() {
    this.drawing = false;
    this.start = null;
    this.snapshot = null;
  }
}

export class SmartFloodFillTool extends BaseTool {
  private currentColor: string = '#212121';

  setColor(color: string) {
    this.currentColor = color;
  }

  begin(p: Point) {
    const x = Math.floor(p.x);
    const y = Math.floor(p.y);
    const W = this.width;
    const H = this.height;

    if (x < 0 || x >= W || y < 0 || y >= H) return;

    const imgData = this.ctx.getImageData(0, 0, W, H);
    const data = imgData.data;
    const at = (y * W + x) * 4;

    const tr0 = data[at];
    const tr1 = data[at + 1];
    const tr2 = data[at + 2];
    const tr3 = data[at + 3];

    const rgb = hexToRgb(this.currentColor);
    // If clicking same color
    if (tr0 === rgb[0] && tr1 === rgb[1] && tr2 === rgb[2] && tr3 === 255) return;

    const tolerance = 32;
    const match = (i: number) =>
      Math.abs(data[i] - tr0) +
      Math.abs(data[i + 1] - tr1) +
      Math.abs(data[i + 2] - tr2) +
      Math.abs(data[i + 3] - tr3) < tolerance;

    const stack: number[] = [y * W + x];
    const seen = new Uint8Array(W * H);
    seen[y * W + x] = 1;

    while (stack.length > 0) {
      const k = stack.pop()!;
      const px = k % W;
      const py = (k / W) | 0;
      const i = k * 4;

      if (!match(i)) continue;

      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      data[i + 3] = 255;

      if (px + 1 < W && !seen[k + 1]) { seen[k + 1] = 1; stack.push(k + 1); }
      if (px - 1 >= 0 && !seen[k - 1]) { seen[k - 1] = 1; stack.push(k - 1); }
      if (py + 1 < H && !seen[k + W]) { seen[k + W] = 1; stack.push(k + W); }
      if (py - 1 >= 0 && !seen[k - W]) { seen[k - W] = 1; stack.push(k - W); }
    }

    this.ctx.putImageData(imgData, 0, 0);
  }

  move() {}
  end() {}
}

export class SelectTool extends BaseTool {
  private start: Point | null = null;
  private selection: SelectionBounds | null = null;
  private selectedData: ImageData | null = null;
  private moving: boolean = false;
  private moveOffset: Point = { x: 0, y: 0 };
  private cleanSnapshot: ImageData | null = null;
  private snapshot: ImageData | null = null;

  override get cursor(): string {
    return 'default';
  }

  begin(p: Point) {
    if (
      this.selection &&
      p.x >= this.selection.x &&
      p.x <= this.selection.x + this.selection.w &&
      p.y >= this.selection.y &&
      p.y <= this.selection.y + this.selection.h
    ) {
      this.drawing = true;
      this.moving = true;
      this.moveOffset = { x: p.x - this.selection.x, y: p.y - this.selection.y };
      return;
    }

    this.drawing = true;
    this.start = p;
    this.snapshot = this.ctx.getImageData(0, 0, this.width, this.height);
    this.selection = null;
    this.selectedData = null;
    this.moving = false;
  }

  move(p: Point) {
    if (!this.drawing) return;
    if (this.moving && this.selectedData && this.cleanSnapshot && this.selection) {
      this.ctx.putImageData(this.cleanSnapshot, 0, 0);
      this.ctx.putImageData(
        this.selectedData,
        p.x - this.moveOffset.x,
        p.y - this.moveOffset.y
      );
    } else if (this.start && this.snapshot) {
      this.ctx.putImageData(this.snapshot, 0, 0);
      this.ctx.save();
      this.ctx.strokeStyle = '#1f00ff';
      this.ctx.lineWidth = 1;
      this.ctx.setLineDash([4, 4]);
      this.ctx.strokeRect(this.start.x, this.start.y, p.x - this.start.x, p.y - this.start.y);
      this.ctx.restore();

      this.selection = {
        x: Math.min(this.start.x, p.x),
        y: Math.min(this.start.y, p.y),
        w: Math.abs(p.x - this.start.x),
        h: Math.abs(p.y - this.start.y)
      };
    }
  }

  end(p?: Point) {
    if (this.selection && !this.moving && this.selection.w > 2 && this.selection.h > 2) {
      this.selectedData = this.ctx.getImageData(
        this.selection.x,
        this.selection.y,
        this.selection.w,
        this.selection.h
      );
      // Clear original area
      this.cleanSnapshot = this.ctx.getImageData(0, 0, this.width, this.height);
      this.ctx.clearRect(this.selection.x, this.selection.y, this.selection.w, this.selection.h);
      this.cleanSnapshot = this.ctx.getImageData(0, 0, this.width, this.height);
      // Draw it back
      this.ctx.putImageData(this.selectedData, this.selection.x, this.selection.y);
    } else if (this.selection && this.moving && p) {
      this.selection.x = Math.max(0, Math.min(this.width - this.selection.w, p.x - this.moveOffset.x));
      this.selection.y = Math.max(0, Math.min(this.height - this.selection.h, p.y - this.moveOffset.y));
    }
    this.drawing = false;
  }
}
