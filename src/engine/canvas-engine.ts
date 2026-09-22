import { EngineConfig, Point, ToolType } from './types';
import {
  BaseTool,
  PencilTool,
  BrushTool,
  EraserTool,
  LineTool,
  RectTool,
  EllipseTool,
  SmartFloodFillTool,
  SelectTool,
  rgbToHex,
  hexToRgb
} from './tools-registry';

export class CanvasEngine {
  private container: HTMLElement;
  private drawCanvas: HTMLCanvasElement;
  private onionCanvas: HTMLCanvasElement;
  private drawCtx: CanvasRenderingContext2D;
  private onionCtx: CanvasRenderingContext2D;

  private width: number = 960;
  private height: number = 540;

  private config: EngineConfig = {
    width: 960,
    height: 540,
    color: '#212121',
    strokeWidth: 4,
    alpha: 1,
    tool: 'pencil',
    onionSkinPrev: true,
    onionSkinNext: false,
  };

  private tools: Map<ToolType, BaseTool> = new Map();
  private activeTool: BaseTool;

  // Undo / Redo history for active frame
  private undoStack: ImageData[] = [];
  private redoStack: ImageData[] = [];
  private maxHistory: number = 30;

  private onChangeCallback?: (dataUrl: string) => void;
  private onColorPickCallback?: (hex: string) => void;

  constructor(container: HTMLElement, initialWidth = 960, initialHeight = 540) {
    this.container = container;
    this.width = initialWidth;
    this.height = initialHeight;

    // Create Onion skin canvas layer
    this.onionCanvas = document.createElement('canvas');
    this.onionCanvas.width = this.width;
    this.onionCanvas.height = this.height;
    this.onionCanvas.style.position = 'absolute';
    this.onionCanvas.style.top = '0';
    this.onionCanvas.style.left = '0';
    this.onionCanvas.style.width = '100%';
    this.onionCanvas.style.height = '100%';
    this.onionCanvas.style.pointerEvents = 'none';
    this.onionCanvas.style.zIndex = '1';

    // Create Active drawing canvas layer
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.width = this.width;
    this.drawCanvas.height = this.height;
    this.drawCanvas.style.position = 'absolute';
    this.drawCanvas.style.top = '0';
    this.drawCanvas.style.left = '0';
    this.drawCanvas.style.width = '100%';
    this.drawCanvas.style.height = '100%';
    this.drawCanvas.style.zIndex = '2';
    this.drawCanvas.style.touchAction = 'none';

    this.container.style.position = 'relative';
    this.container.appendChild(this.onionCanvas);
    this.container.appendChild(this.drawCanvas);

    this.onionCtx = this.onionCanvas.getContext('2d', { willReadFrequently: true })!;
    this.drawCtx = this.drawCanvas.getContext('2d', { willReadFrequently: true })!;

    // Initial white canvas background
    this.clear(false);

    // Initialize tools
    const pencil = new PencilTool(this.drawCtx, this.width, this.height);
    const brush = new BrushTool(this.drawCtx, this.width, this.height);
    const eraser = new EraserTool(this.drawCtx, this.width, this.height);
    const line = new LineTool(this.drawCtx, this.width, this.height);
    const rect = new RectTool(this.drawCtx, this.width, this.height);
    const ellipse = new EllipseTool(this.drawCtx, this.width, this.height);
    const fill = new SmartFloodFillTool(this.drawCtx, this.width, this.height);
    const select = new SelectTool(this.drawCtx, this.width, this.height);

    this.tools.set('pencil', pencil);
    this.tools.set('brush', brush);
    this.tools.set('eraser', eraser);
    this.tools.set('line', line);
    this.tools.set('rect', rect);
    this.tools.set('ellipse', ellipse);
    this.tools.set('fill', fill);
    this.tools.set('select', select);

    this.activeTool = pencil;
    this.updateContextStyles();
    this.saveSnapshot();

    this.bindEvents();
  }

  private updateContextStyles() {
    this.drawCtx.strokeStyle = this.config.color;
    this.drawCtx.lineWidth = this.config.strokeWidth;
    this.drawCtx.lineCap = 'round';
    this.drawCtx.lineJoin = 'round';
    this.drawCtx.globalAlpha = this.config.alpha;

    const fillTool = this.tools.get('fill');
    if (fillTool && fillTool instanceof SmartFloodFillTool) {
      fillTool.setColor(this.config.color);
    }

    this.drawCanvas.style.cursor = this.activeTool.cursor;
  }

  public setTool(tool: ToolType) {
    if (tool === 'eyedropper') {
      this.drawCanvas.style.cursor = 'crosshair';
      this.config.tool = 'eyedropper';
      return;
    }

    const t = this.tools.get(tool);
    if (t) {
      this.activeTool = t;
      this.config.tool = tool;
      this.updateContextStyles();
    }
  }

  public setColor(color: string) {
    this.config.color = color;
    this.updateContextStyles();
  }

  public setStrokeWidth(width: number) {
    this.config.strokeWidth = Math.max(1, Math.min(100, width));
    this.updateContextStyles();
  }

  public setAlpha(alpha: number) {
    this.config.alpha = Math.max(0.05, Math.min(1, alpha));
    this.updateContextStyles();
  }

  public setOnionSkin(prev: boolean, next: boolean) {
    this.config.onionSkinPrev = prev;
    this.config.onionSkinNext = next;
  }

  public setOnChange(cb: (dataUrl: string) => void) {
    this.onChangeCallback = cb;
  }

  public setOnColorPick(cb: (hex: string) => void) {
    this.onColorPickCallback = cb;
  }

  private saveSnapshot() {
    const snap = this.drawCtx.getImageData(0, 0, this.width, this.height);
    this.undoStack.push(snap);
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  public undo(): boolean {
    if (this.undoStack.length <= 1) return false;
    const current = this.undoStack.pop()!;
    this.redoStack.push(current);
    const previous = this.undoStack[this.undoStack.length - 1];
    this.drawCtx.putImageData(previous, 0, 0);
    this.notifyChange();
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const next = this.redoStack.pop()!;
    this.undoStack.push(next);
    this.drawCtx.putImageData(next, 0, 0);
    this.notifyChange();
    return true;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 1;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  public clear(triggerChange = true) {
    this.drawCtx.fillStyle = '#ffffff';
    this.drawCtx.fillRect(0, 0, this.width, this.height);
    if (triggerChange) {
      this.saveSnapshot();
      this.notifyChange();
    }
  }

  public loadFrameData(imageData: string): Promise<void> {
    return new Promise((resolve) => {
      if (!imageData || !imageData.startsWith('data:image')) {
        this.clear(false);
        this.undoStack = [];
        this.redoStack = [];
        this.saveSnapshot();
        resolve();
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.drawCtx.fillStyle = '#ffffff';
        this.drawCtx.fillRect(0, 0, this.width, this.height);
        this.drawCtx.drawImage(img, 0, 0, this.width, this.height);
        this.undoStack = [];
        this.redoStack = [];
        this.saveSnapshot();
        resolve();
      };
      img.onerror = () => {
        this.clear(false);
        resolve();
      };
      img.src = imageData;
    });
  }

  public renderOnionSkin(prevImageData?: string | null, nextImageData?: string | null) {
    this.onionCtx.clearRect(0, 0, this.width, this.height);

    if (this.config.onionSkinPrev && prevImageData && prevImageData.startsWith('data:image')) {
      const prevImg = new Image();
      prevImg.onload = () => {
        this.onionCtx.save();
        this.onionCtx.globalAlpha = 0.25;
        // Blueprint monochrome indigo tint
        this.onionCtx.drawImage(prevImg, 0, 0, this.width, this.height);
        this.onionCtx.restore();
      };
      prevImg.src = prevImageData;
    }

    if (this.config.onionSkinNext && nextImageData && nextImageData.startsWith('data:image')) {
      const nextImg = new Image();
      nextImg.onload = () => {
        this.onionCtx.save();
        this.onionCtx.globalAlpha = 0.25;
        this.onionCtx.drawImage(nextImg, 0, 0, this.width, this.height);
        this.onionCtx.restore();
      };
      nextImg.src = nextImageData;
    }
  }

  public getDataURL(): string {
    return this.drawCanvas.toDataURL('image/png');
  }

  private notifyChange() {
    if (this.onChangeCallback) {
      this.onChangeCallback(this.getDataURL());
    }
  }

  private getCanvasPoint(e: PointerEvent | MouseEvent): Point {
    const rect = this.drawCanvas.getBoundingClientRect();
    const scaleX = this.width / rect.width;
    const scaleY = this.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: (e as PointerEvent)?.pressure || 0.5
    };
  }

  private bindEvents() {
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const point = this.getCanvasPoint(e);

      if (this.config.tool === 'eyedropper') {
        const pixel = this.drawCtx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
        const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
        this.setColor(hex);
        if (this.onColorPickCallback) this.onColorPickCallback(hex);
        this.setTool('pencil');
        return;
      }

      this.activeTool.begin(point, e);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!this.activeTool.drawing) return;
      const point = this.getCanvasPoint(e);
      this.activeTool.move(point, e);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!this.activeTool.drawing) return;
      const point = this.getCanvasPoint(e);
      this.activeTool.end(point, e);
      this.saveSnapshot();
      this.notifyChange();
    };

    this.drawCanvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Clean up handle
    (this.drawCanvas as any)._cleanup = () => {
      this.drawCanvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }

  public destroy() {
    if ((this.drawCanvas as any)._cleanup) {
      (this.drawCanvas as any)._cleanup();
    }
    this.container.innerHTML = '';
  }
}
