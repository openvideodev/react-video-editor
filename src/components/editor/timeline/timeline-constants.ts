import type { TrackType } from "@/types/timeline";

// Track color definitions
export const TRACK_COLORS: Record<
  TrackType,
  { solid: string; background: string; border: string }
> = {
  Video: {
    solid: "bg-blue-500",
    background: "",
    border: "",
  },
  Image: {
    solid: "bg-blue-500",
    background: "",
    border: "",
  },
  Text: {
    solid: "bg-[#5DBAA0]",
    background: "bg-[#5DBAA0]",
    border: "",
  },
  Audio: {
    solid: "bg-green-500",
    background: "bg-[#915DBE]",
    border: "",
  },
  Caption: {
    solid: "bg-[#5DBAA0]",
    background: "bg-[#5DBAA0]",
    border: "",
  },
  Effect: {
    solid: "bg-yellow-500",
    background: "",
    border: "",
  },
  Transition: {
    solid: "bg-pink-500",
    background: "bg-pink-500",
    border: "",
  },
  Placeholder: {
    solid: "bg-gray-500",
    background: "bg-gray-500",
    border: "",
  },
} as const;

// Global constants
export const TIMELINE_CONSTANTS = {
  TRACK_SPACING: 6,
  TRACK_PADDING_TOP: 6,
  ELEMENT_MIN_WIDTH: 80,
  PIXELS_PER_SECOND: 50,
  TRACK_HEIGHT: 60, // Default fallback
  DEFAULT_TEXT_DURATION: 5,
  DEFAULT_IMAGE_DURATION: 5,
  ZOOM_LEVELS: [0.25, 0.5, 1, 1.5, 2, 3, 4],
} as const;

// Utility functions
export function getTrackColors(type: TrackType) {
  return TRACK_COLORS[type];
}

export function getTrackElementClasses(type: TrackType) {
  const colors = getTrackColors(type);
  if (!colors) return "";
  return `${colors.background} ${colors.border}`;
}

// Track height definitions
export const TRACK_HEIGHTS: Record<TrackType, number> = {
  Video: 52,
  Image: 52,
  Text: 32,
  Effect: 32,
  Audio: 36,
  Caption: 32,
  Transition: 40,
  Placeholder: 40,
} as const;

// Utility function for track heights
export function getTrackHeight(type: TrackType): number {
  return TRACK_HEIGHTS[type] || 40;
}

// Calculate cumulative height up to (but not including) a track index
export function getCumulativeHeightBefore(
  tracks: Array<{ type: TrackType }>,
  trackIndex: number,
): number {
  const GAP = TIMELINE_CONSTANTS.TRACK_SPACING;
  return tracks
    .slice(0, trackIndex)
    .reduce((sum, track) => sum + getTrackHeight(track.type) + GAP, 0);
}

// Calculate total height of all tracks
export function getTotalTracksHeight(tracks: Array<{ type: TrackType }>): number {
  const GAP = TIMELINE_CONSTANTS.TRACK_SPACING;
  const tracksHeight = tracks.reduce((sum, track) => sum + getTrackHeight(track.type), 0);
  const gapsHeight = Math.max(0, tracks.length - 1) * GAP; // n-1 gaps for n tracks
  return tracksHeight + gapsHeight;
}

// Other timeline constants
// Moved up to avoid temporal dead zone if needed, or just cleaner organization

// FPS presets for project settings
export const FPS_PRESETS = [
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
  { value: "120", label: "120 fps" },
] as const;

// Frame snapping utilities
export function timeToFrame(time: number, fps: number): number {
  return Math.round(time * fps);
}

export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

export function snapTimeToFrame(time: number, fps: number): number {
  if (fps <= 0) return time; // Fallback for invalid FPS
  const frame = timeToFrame(time, fps);
  return frameToTime(frame, fps);
}

export function getFrameDuration(fps: number): number {
  return 1 / fps;
}
