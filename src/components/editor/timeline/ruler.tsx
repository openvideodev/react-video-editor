import { useCallback, useEffect, useRef, useState } from "react";

import {
  MICROSECONDS_PER_SECOND,
  PIXELS_PER_SECOND,
  SECONDARY_FONT,
  TIMELINE_OFFSET_CANVAS_LEFT,
  ITimelineScaleState,
} from "@openvideo/timeline";
import { useStore } from "zustand";
import { projectStore } from "@/lib/project";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";

const RULER_COLORS = {
  bg: "#111010",
  text: "#9ca3af",
  border: "#374151",
};

interface RulerProps {
  height?: number;
  longLineSize?: number;
  shortLineSize?: number;
  offsetX?: number;
  textOffsetY?: number;
  scrollLeft?: number;
  textFormat?: (scale: number) => string;
  onClick?: (units: number) => void;
  onScroll?: (scrollLeft: number) => void;
  scale: ITimelineScaleState;
}

const Ruler = (props: RulerProps) => {
  const timelineOffsetX = useTimelineOffsetX();
  const {
    height = 24,
    offsetX = timelineOffsetX + TIMELINE_OFFSET_CANVAS_LEFT,
    scrollLeft = 0,
    onClick,
    onScroll,
    scale,
  } = props;
  const durationUs = useStore(projectStore, (s) => s.settings.duration);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const colors = RULER_COLORS;

  const [canvasSize, setCanvasSize] = useState({
    width: 0,
    height: height,
  });

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    startX: 0,
    startScrollPos: 0,
    isDragging: false,
    hasDragged: false,
  });

  const pixelsPerSecond = PIXELS_PER_SECOND * scale.zoom;

  const draw = useCallback(
    (context: CanvasRenderingContext2D, scrollLeft: number, width: number, height: number) => {
      const zoom = scale.zoom;
      const dpr = window.devicePixelRatio || 1;

      context.save();
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      // Drawing settings
      context.fillStyle = colors.text;
      context.strokeStyle = colors.border;
      context.lineWidth = 1;
      context.font = `11px ${SECONDARY_FONT}`;
      context.textAlign = "left";
      context.textBaseline = "middle";

      // Calculate intervals
      const minTextSpacing = 60;
      const intervalOptions = [0.1, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300];
      let mainInterval = 80;

      for (const opt of intervalOptions) {
        if (opt * pixelsPerSecond >= minTextSpacing) {
          mainInterval = opt;
          break;
        }
      }

      const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 10);

        const mStr = m.toString().padStart(2, "0");
        const sStr = s.toString().padStart(2, "0");

        if (h > 0) return `${h}:${mStr}:${sStr}`;
        if (mainInterval < 1) return `${mStr}:${sStr}.${ms}`;
        return `${mStr}:${sStr}`;
      };

      let subTickCount = 5;
      if (mainInterval === 0.1) subTickCount = 2;
      if (mainInterval === 1) subTickCount = 5;
      if (mainInterval === 60) subTickCount = 4;

      let subInterval = mainInterval / subTickCount;
      if (subInterval * pixelsPerSecond < 6) {
        subInterval = mainInterval;
      }

      const startTime =
        Math.floor((scrollLeft - offsetX) / pixelsPerSecond / subInterval) * subInterval;
      const endTime = (scrollLeft - offsetX + width) / pixelsPerSecond;
      const count = Math.ceil((endTime - startTime) / subInterval) + 1;

      for (let i = 0; i < count; i++) {
        const time = startTime + i * subInterval;
        if (time < 0) continue;

        const x = Math.floor(time * pixelsPerSecond - scrollLeft + offsetX) + 0.5;

        if (x > width) break;
        if (x < -50) continue;

        const isBeyondDuration = time > durationUs / MICROSECONDS_PER_SECOND + 0.001;
        context.globalAlpha = isBeyondDuration ? 0.4 : 1.0;

        const isMain =
          Math.abs(time % mainInterval) < 0.001 ||
          Math.abs((time % mainInterval) - mainInterval) < 0.001;

        context.beginPath();
        if (isMain) {
          context.moveTo(x, 0);
          context.lineTo(x, height);
          context.stroke();

          const text = formatTime(time);
          context.fillText(text, x + 5, height / 2);
        } else if (subInterval !== mainInterval) {
          context.moveTo(x, 0);
          context.lineTo(x, 4);
          context.stroke();
        }
      }

      context.restore();
    },
    [scale.zoom, pixelsPerSecond, offsetX, durationUs],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const offsetParent = canvas.offsetParent as HTMLDivElement;
    const width = offsetParent?.offsetWidth ?? canvas.offsetWidth;
    const currentHeight = height;

    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${currentHeight}px`;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(currentHeight * dpr);

    draw(context, scrollLeft, width, currentHeight);
    setCanvasSize({ width, height: currentHeight });
  }, [scrollLeft, scale, timelineOffsetX, draw, height]);

  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;

    setIsDragging(true);

    // Update ref state
    dragRef.current = {
      startX: clickX,
      startScrollPos: scrollLeft,
      isDragging: true,
      hasDragged: false,
    };

    // Immediate seek on click
    const totalX = clickX + scrollLeft - offsetX;
    onClick?.(totalX);

    // Prevent text selection during drag
    event.preventDefault();
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const touchX = touch.clientX - rect.left;

    setIsDragging(true);

    // Update ref state
    dragRef.current = {
      startX: touchX,
      startScrollPos: scrollLeft,
      isDragging: true,
      hasDragged: false,
    };

    // Immediate seek on touch
    const totalX = touchX + scrollLeft - offsetX;
    onClick?.(totalX);

    // Prevent default touch behavior
    event.preventDefault();
  };

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!dragRef.current.isDragging) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const currentX = event.clientX - rect.left;

      dragRef.current.hasDragged = true;

      // Calculate total x position, including scrollLeft
      const totalX = currentX + scrollLeft - offsetX;
      onClick?.(totalX);
    },
    [onClick, scrollLeft, offsetX],
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent<HTMLCanvasElement>) => {
      if (!dragRef.current.isDragging) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const touch = event.touches[0];
      const currentX = touch.clientX - rect.left;

      dragRef.current.hasDragged = true;

      // Calculate total x position, including scrollLeft
      const totalX = currentX + scrollLeft - offsetX;
      onClick?.(totalX);
    },
    [onClick, scrollLeft, offsetX],
  );

  const handleMouseUp = useCallback(() => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      dragRef.current.hasDragged = false;
      setIsDragging(false);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      dragRef.current.hasDragged = false;
      setIsDragging(false);
    }
  }, []);

  const handleLocalMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    // Always reset drag state on local mouse up
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      dragRef.current.hasDragged = false;
      setIsDragging(false);
    }
  };

  const handleLocalTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>) => {
    // Always reset drag state on local touch end
    if (dragRef.current.isDragging) {
      dragRef.current.isDragging = false;
      dragRef.current.hasDragged = false;
      setIsDragging(false);
    }
  };

  // Add global mouse and touch event listeners for drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove as any, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove as any);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      className="border-t border-border"
      style={{
        position: "relative",
        width: "100%",
        height: `${canvasSize.height}px`,
      }}
    >
      <canvas
        onMouseDown={handleMouseDown}
        onMouseUp={handleLocalMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleLocalTouchEnd}
        ref={canvasRef}
        height={canvasSize.height}
        style={{
          cursor: isDragging ? "grabbing" : "grab",
          width: "100%",
          display: "block",
          touchAction: "none", // Prevent default touch behaviors
        }}
      />
    </div>
  );
};

export default Ruler;
