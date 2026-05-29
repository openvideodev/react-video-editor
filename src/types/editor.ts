export type BackgroundType = "blur" | "mirror" | "color";

export type CanvasMode = "preset" | "original" | "custom";

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasPreset {
  name: string;
  width: number;
  height: number;
}

export interface TextElementDragState {
  isDragging: boolean;
  elementId: string | null;
  trackId: string | null;
  startX: number;
  startY: number;
  initialElementX: number;
  initialElementY: number;
  currentX: number;
  currentY: number;
  elementWidth: number;
  elementHeight: number;
}

export interface IFont {
  family: string;
  fullName: string;
  url: string;
}

export interface ICompactFont {
  family: string;
  styles: IFont[];
  default: IFont;
}
