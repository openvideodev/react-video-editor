import {
  snapTimeToFrame,
  TIMELINE_CONSTANTS,
} from "@/components/editor/timeline/timeline-constants";
import { DEFAULT_FPS } from "@/stores/project-store";
import { usePlaybackStore } from "@/stores/playback-store";
import { useState, useEffect, useCallback, useRef } from "react";
import { useEdgeAutoScroll } from "@/hooks/use-edge-auto-scroll";

interface UseTimelinePlayheadProps {
  currentTime: number;
  duration: number;
  zoomLevel: number;
  seek: (time: number) => void;
  rulerRef: React.RefObject<HTMLDivElement | null>;
  rulerScrollRef: React.RefObject<HTMLDivElement | null>;
  tracksScrollRef: React.RefObject<HTMLDivElement | null>;
  playheadRef?: React.RefObject<HTMLDivElement | null>;
  onScrollChange?: (scrollX: number) => void;
}

export function useTimelinePlayhead({
  currentTime,
  duration,
  zoomLevel,
  seek,
  rulerRef,
  rulerScrollRef,
  tracksScrollRef,
  playheadRef,
  onScrollChange,
}: UseTimelinePlayheadProps) {
  // Playhead scrubbing state
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubTime, setScrubTime] = useState<number | null>(null);

  // Ruler drag detection state
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);
  const [hasDraggedRuler, setHasDraggedRuler] = useState(false);
  const lastMouseXRef = useRef<number>(0);

  const playheadPosition = isScrubbing && scrubTime !== null ? scrubTime : currentTime;

  // --- Playhead Scrubbing Handlers ---
  const handlePlayheadMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent ruler drag from triggering
      setIsScrubbing(true);
      handleScrub(e);
    },
    [duration, zoomLevel],
  );

  // Ruler mouse down handler
  const handleRulerMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;

      // Don't interfere if clicking on the playhead itself
      if (playheadRef?.current?.contains(e.target as Node)) return;

      e.preventDefault();
      setIsDraggingRuler(true);
      setHasDraggedRuler(false);

      // Start scrubbing immediately
      setIsScrubbing(true);
      handleScrub(e);
    },
    [duration, zoomLevel],
  );

  const handleScrub = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      const ruler = rulerRef.current;
      if (!ruler) return;
      const rect = ruler.getBoundingClientRect();
      const rawX = e.clientX - rect.left;

      // Get the timeline content width based on duration and zoom
      const timelineContentWidth = duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;

      // Constrain x to be within the timeline content bounds
      const x = Math.max(0, Math.min(timelineContentWidth, rawX));

      const rawTime = Math.max(
        0,
        Math.min(duration, x / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel)),
      );
      // Use frame snapping for playhead scrubbing
      const projectFps = DEFAULT_FPS;
      const time = snapTimeToFrame(rawTime, projectFps);

      setScrubTime(time);
      seek(time); // update video preview in real time

      // Store mouse position for auto-scrolling
      lastMouseXRef.current = e.clientX;
    },
    [duration, zoomLevel, seek, rulerRef],
  );

  useEdgeAutoScroll({
    isActive: isScrubbing,
    getMouseClientX: () => lastMouseXRef.current,
    rulerScrollRef,
    tracksScrollRef,
    contentWidth: duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel,
  });

  // Mouse move/up event handlers
  useEffect(() => {
    if (!isScrubbing) return;

    const onMouseMove = (e: MouseEvent) => {
      handleScrub(e);
      // Mark that we've dragged if ruler drag is active
      if (isDraggingRuler) {
        setHasDraggedRuler(true);
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      setIsScrubbing(false);
      if (scrubTime !== null) seek(scrubTime); // finalize seek
      setScrubTime(null);

      // Handle ruler click vs drag
      if (isDraggingRuler) {
        setIsDraggingRuler(false);
        // If we didn't drag, treat it as a click-to-seek
        if (!hasDraggedRuler) {
          handleScrub(e);
        }
        setHasDraggedRuler(false);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Edge auto-scroll is handled by useEdgeAutoScroll
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isScrubbing, scrubTime, seek, handleScrub, isDraggingRuler, hasDraggedRuler]);

  // --- Playhead auto-scroll effect (only during playback) ---
  useEffect(() => {
    const { isPlaying } = usePlaybackStore.getState();

    // Only auto-scroll during playback, not during manual interactions
    if (!isPlaying || isScrubbing) return;

    const rulerViewport = rulerScrollRef.current;
    if (!rulerViewport) return;

    const playheadPx = playheadPosition * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel;
    const viewportWidth = rulerViewport.clientWidth;
    const scrollMin = 0;
    const scrollMax = duration * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * zoomLevel - viewportWidth;

    // Only auto-scroll if playhead is completely out of view (no buffer)
    const needsScroll =
      playheadPx < rulerViewport.scrollLeft ||
      playheadPx > rulerViewport.scrollLeft + viewportWidth;

    if (needsScroll && onScrollChange) {
      // Position the playhead at the left edge of the viewport
      const desiredScroll = Math.max(scrollMin, Math.min(scrollMax, playheadPx));
      onScrollChange(desiredScroll);
    }
  }, [playheadPosition, duration, zoomLevel, rulerScrollRef, isScrubbing, onScrollChange]);

  return {
    playheadPosition,
    handlePlayheadMouseDown,
    handleRulerMouseDown,
    isDraggingRuler,
  };
}
