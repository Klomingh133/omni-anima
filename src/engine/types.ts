export type ToolType = 
  | 'pencil'
  | 'brush'
  | 'eraser'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'fill'
  | 'select'
  | 'eyedropper';

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface FrameData {
  id?: number | string;
  project_id?: string;
  frame_index: number;
  image_data: string;
  created_at?: string;
  updated_at?: string;
}

export interface EngineConfig {
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  alpha: number;
  tool: ToolType;
  onionSkinPrev: boolean;
  onionSkinNext: boolean;
}

export interface SelectionBounds {
  x: number;
  y: number;
  w: number;
  h: number;
}
