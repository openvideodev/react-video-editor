"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { usePlaybackStore } from "@/stores/playback-store";
import { TimelineTrack } from "@/types/timeline";
import { TIMELINE_CONSTANTS } from "@/components/editor/timeline/timeline-constants";
import { useTimelinePlayhead } from "@/hooks/use-timeline-playhead";
import { useTheme } from "next-themes";

interface TimelinePlayheadProps {
  duration: number;
  zoomLevel: number;
  tracks: TimelineTrack[];
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement | null>;
  rulerScrollRef: React.RefObject<HTMLDivElement | null>;
  tracksScrollRef: React.RefObject<HTMLDivElement | null>;
  trackLabelsRef?: React.RefObject<HTMLDivElement | null>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  playheadRef?: React.RefObject<HTMLDivElement | null>;
  isSnappingToPlayhead?: boolean;
  scrollLeft: number;
  onScrollChange?: (scrollX: number) => void;
}

export function TimelinePlayhead({
  duration,
  zoomLevel,
  tracks,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  trackLabelsRef,
  timelineRef,
  playheadRef: externalPlayheadRef,
  isSnappingToPlayhead = false,
  scrollLeft,
  onScrollChange,
}: TimelinePlayheadProps) {
  const currentTime = usePlaybackStore((state) => state.currentTime);

  const internalPlayheadRef = useRef<HTMLDivElement>(null);
  const playheadRef = externalPlayheadRef || internalPlayheadRef;
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const currentTheme = useMemo(() => {
    if (!mounted) return "light";
    return (theme === "system" ? resolvedTheme : theme) as "dark" | "light";
  }, [mounted, theme, resolvedTheme]);

  const color = useMemo(() => {
    return currentTheme === "dark" ? "#ffffff" : "#000000";
  }, [currentTheme]);

  const { playheadPosition, handlePlayheadMouseDown } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
    onScrollChange,
  });

  // Use timeline container height minus a few pixels for breathing room
  const timelineContainerHeight = timelineRef.current?.offsetHeight || 400;
  const totalHeight = timelineContainerHeight - 4;

  // Get dynamic track labels width, fallback to 0 if no tracks or no ref
  const trackLabelsWidth =
    tracks.length > 0 && trackLabelsRef?.current ? trackLabelsRef.current.offsetWidth : 0;

  // Calculate position locked to timeline content (accounting for scroll)
  const timelinePosition = playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const rawLeftPosition = trackLabelsWidth + timelinePosition - scrollLeft;

  // Get the timeline content width and viewport width for right boundary
  const timelineContentWidth = duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
  const tracksViewport = tracksScrollRef.current || rulerScrollRef.current;
  const viewportWidth = tracksViewport?.clientWidth || 1000;

  // Constrain playhead to never appear outside the timeline area
  const leftBoundary = trackLabelsWidth;
  const rightBoundary = Math.min(
    trackLabelsWidth + timelineContentWidth - scrollLeft, // Don't go beyond timeline content
    trackLabelsWidth + viewportWidth, // Don't go beyond viewport
  );

  const leftPosition = Math.max(leftBoundary, Math.min(rightBoundary, rawLeftPosition));

  return (
    <div
      ref={playheadRef}
      className="absolute pointer-events-auto z-40 group"
      style={{
        left: `${leftPosition}px`,
        top: 0,
        height: `${totalHeight}px`,
        width: "1px",
        opacity: duration === 0 ? 0 : 1,
      }}
      onMouseDown={handlePlayheadMouseDown}
    >
      {/* The playhead line spanning full height */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[1px] cursor-col-resize h-full"
        style={{
          backgroundColor: color,
        }}
      />

      {/* Playhead indicator at the top */}
      <div
        className="absolute left-1/2 transform -translate-x-1/2 cursor-col-resize"
        style={{
          top: "0",
          width: "12px",
          height: "14px",
          borderRadius: "2px 2px 0 0",
          clipPath: "polygon(0% 0%, 100% 0%, 100% 70%, 50% 100%, 0% 70%)",
          backgroundColor: color,
        }}
      />
    </div>
  );
}

// Also export a hook for getting ruler handlers
export function useTimelinePlayheadRuler({
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
  onScrollChange,
}: Omit<TimelinePlayheadProps, "tracks" | "trackLabelsRef" | "timelineRef" | "scrollLeft"> & {
  scrollLeft?: number;
}) {
  const currentTime = usePlaybackStore((state) => state.currentTime);
  const { handleRulerMouseDown, isDraggingRuler } = useTimelinePlayhead({
    currentTime,
    duration,
    zoomLevel,
    seek,
    rulerRef,
    rulerScrollRef,
    tracksScrollRef,
    playheadRef,
    onScrollChange,
  });

  return { handleRulerMouseDown, isDraggingRuler };
}

export { TimelinePlayhead as default };
