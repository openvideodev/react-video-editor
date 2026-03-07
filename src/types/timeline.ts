import { MediaType } from "@/types/media";
import { generateUUID } from "@/utils/id";

export type TrackType =
  | "Video"
  | "Audio"
  | "Image"
  | "Text"
  | "Caption"
  | "Effect"
  | "Transition"
  | "Placeholder";

// Display interface from Studio schema
export interface IDisplay {
  from: number; // Microseconds
  to: number; // Microseconds
}

// Clip interface from Studio schema
export interface IClip {
  id: string;
  type: string; // 'Caption', 'Text', 'Video', etc.
  name?: string;
  text?: string;
  src?: string;
  display: IDisplay;
  trim?: { from: number; to: number };
  duration: number; // Microseconds
  sourceDuration?: number; // Total duration of the media in microseconds
  playbackRate?: number;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  angle?: number;
  zIndex?: number;
  opacity?: number;
  flip?: { horizontal: boolean; vertical: boolean } | string | null;
  style?: any;
  caption?: any;
  effects?: any[];
  // ... any other props
}

// Track interface from Studio schema (Normalized)
export interface ITimelineTrack {
  id: string;
  name: string;
  type: TrackType;
  clipIds: string[];
  muted?: boolean;
}

// -- Legacy Types Support (Gradually removing) --
// For compatibility with components I haven't touched yet, I'll keep some aliases
// but direct them to the new usage.

export type TimelineTrack = ITimelineTrack;

export interface TimelineElementProps {
  element: IClip;
  track: ITimelineTrack;
  zoomLevel: number;
  isSelected: boolean;
  onElementMouseDown: (e: React.MouseEvent, element: IClip) => void;
  onElementClick: (e: React.MouseEvent, element: IClip) => void;
}

// Constants
export const MICROSECONDS_PER_SECOND = 1_000_000;
