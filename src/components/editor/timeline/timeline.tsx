import { useEffect, useRef, useState } from "react";
import { useStore } from "zustand";
import Header from "./header";
import Ruler from "./ruler";
import { timeUsToUnits, unitsToTimeUs, TimelineBridge } from "@openvideo/timeline";
import CanvasTimeline from "./items/timeline";
import { useStudioStore } from "@/stores/studio-store";
import { projectStore, core } from "@/lib/project";
import Playhead from "./playhead";
import {
  Audio,
  Image,
  Text,
  Video,
  Caption,
  Helper,
  Track,
  LinealAudioBars,
  RadialAudioBars,
  WaveAudioBars,
  HillAudioBars,
  Transition,
} from "./items";
import PreviewTrackItem from "./items/preview-drag-item";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";
import { addStudioSync } from "./studio-to-store-sync";
import { TIMELINE_SCALE_CHANGED } from "@openvideo/timeline";
import Effect from "./items/effect";

CanvasTimeline.registerItems({
  Text,
  Image,
  Audio,
  Video,
  Caption,
  Helper,
  Track,
  PreviewTrackItem,
  LinealAudioBars,
  RadialAudioBars,
  WaveAudioBars,
  HillAudioBars,
  Effect,
  Transition,
});

const EMPTY_SIZE = { width: 0, height: 0 };

const Timeline = () => {
  // prevent duplicate scroll events
  const [scrollLeft, setScrollLeft] = useState(0);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<CanvasTimeline | null>(null);
  const horizontalScrollbarVpRef = useRef<HTMLDivElement>(null);
  const currentTimeUs = useStore(projectStore, (s) => s.currentTime);
  const durationUs = useStore(projectStore, (s) => s.settings.duration);
  const { studio } = useStudioStore();
  const scale = useStore(projectStore, (s) => s.scale);
  const setScale = projectStore.getState().setScale;

  const timelineOffsetX = useTimelineOffsetX();
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const onMouseDown = () => {};
  const onMouseMove = () => {};
  const onMouseOut = () => {};

  const [timeline, setTimeline] = useState<CanvasTimeline | null>(null);
  useEffect(() => {
    const position = timeUsToUnits(currentTimeUs, scale.zoom);
    const canvasEl = canvasElRef.current;
    const horizontalScrollbar = horizontalScrollbarVpRef.current;

    if (!canvasEl || !horizontalScrollbar) return;

    const canvasBoudingX = canvasEl.getBoundingClientRect().x + canvasEl.clientWidth;
    const playHeadPos = position - scrollLeft + 40;
    if (playHeadPos >= canvasBoudingX) {
      const scrollDivWidth = horizontalScrollbar.clientWidth;
      const totalScrollWidth = horizontalScrollbar.scrollWidth;
      const currentPosScroll = horizontalScrollbar.scrollLeft;
      const availableScroll = totalScrollWidth - (scrollDivWidth + currentPosScroll);
      const scaleScroll = availableScroll / scrollDivWidth;
      if (scaleScroll >= 0) {
        if (scaleScroll > 1)
          horizontalScrollbar.scrollTo({
            left: currentPosScroll + scrollDivWidth,
          });
        else
          horizontalScrollbar.scrollTo({
            left: totalScrollWidth - scrollDivWidth,
          });
      }
    }
  }, [currentTimeUs]);
  const onResizeCanvas = (payload: { width: number; height: number }) => {};

  useEffect(() => {
    const timelineContainerEl = timelineContainerRef.current;
    if (!timelineContainerEl || !canvasRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { height, width } = entry.contentRect;
      // Dynamically calculate available height for the canvas
      // Header is 50px, Ruler is 24px + 1px border = 25px.
      // Total UI offset = 75px.
      const containerWidth = width - timelineOffsetX;
      const containerHeight = height - 75;

      canvasRef.current?.resize(
        {
          width: containerWidth,
          height: containerHeight,
        },
        { force: true },
      );
    });

    resizeObserver.observe(timelineContainerEl);
    return () => resizeObserver.disconnect();
  }, [timelineOffsetX]);

  useEffect(() => {
    const canvasEl = canvasElRef.current;
    const timelineContainerEl = timelineContainerRef.current;

    if (!canvasEl || !timelineContainerEl) return;

    const containerWidth =
      (document.getElementById("timeline-header")?.clientWidth || 0) - timelineOffsetX;
    const containerHeight = (timelineContainerEl.clientHeight || 320) - 75;
    const canvas = new CanvasTimeline(canvasEl, {
      width: containerWidth,
      height: containerHeight,
      bounding: {
        width: containerWidth,
        height: 0,
      },
      selectionColor: "rgba(0, 216, 214,0.1)",
      selectionBorderColor: "rgba(0, 216, 214,1.0)",
      onResizeCanvas,
      scale: scale,
      duration: durationUs,
      spacing: {
        left: 16,
        right: 40,
      },
      sizesMap: {
        caption: 32,
        text: 32,
        effect: 32,
        audio: 36,
        video: 48,
        image: 48,
        transition: 40,
        main: 48,
      },
      itemTypes: [
        "text",
        "image",
        "audio",
        "video",
        "caption",
        "helper",
        "effect",
        "track",
        "transition",
      ],
      acceptsMap: {
        text: ["text", "caption"],
        effect: ["effect"],
        image: ["image", "video"],
        main: ["image", "video"],
        video: ["video", "image"],
        audio: ["audio"],
        caption: ["caption", "text"],
      },
      guideLineColor: "#ffffff",
      withTransitions: ["image", "video"],
    });

    canvas.initScrollbars({
      offsetX: 16,
      offsetY: 0,
      extraMarginX: 100,
      extraMarginY: 50,
      scrollbarWidth: 8,
      scrollbarColor: "rgba(33, 33, 33, 0.8)",
    });

    canvas.onViewportChange((left: number) => {
      setScrollLeft(left + 16);
    });

    canvas.emitter.on(TIMELINE_SCALE_CHANGED, (data) => {
      const newScale = data.payload.scale;
      if (newScale.zoom !== scale.zoom) {
        setScale(newScale);
      }
    });

    canvasRef.current = canvas;

    const bridge = new TimelineBridge(core, canvas);

    setTimeline(canvas);

    return () => {
      bridge.dispose();
      canvas.purge();
    };
  }, []);

  useEffect(() => {
    if (!studio || !timeline) return;

    const disposeStudioSync = addStudioSync(studio, timeline);

    return () => {
      disposeStudioSync();
    };
  }, [studio, timeline]);

  const onClickRuler = (units: number) => {
    const timeUs = unitsToTimeUs(units, scale.zoom);
    core.seek(timeUs);
  };

  const onRulerScroll = (newScrollLeft: number) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.scrollTo({ scrollLeft: newScrollLeft });
    }

    if (horizontalScrollbarVpRef.current) {
      horizontalScrollbarVpRef.current.scrollLeft = newScrollLeft;
    }

    setScrollLeft(newScrollLeft);
  };

  useEffect(() => {
    const availableScroll = horizontalScrollbarVpRef.current?.scrollWidth;
    if (!availableScroll || !canvasRef.current) return;

    canvasRef.current.syncScale({ scale });

    const canvasWidth = canvasRef.current.width;
    if (availableScroll < canvasWidth + scrollLeft) {
      canvasRef.current.scrollTo({ scrollLeft: availableScroll - canvasWidth });
    }
  }, [scale]);

  useEffect(() => {
    const container = timelineContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const isTouchScale = Math.floor(e.deltaY) !== Math.ceil(e.deltaY);
        const speed = isTouchScale ? 0.99 : 0.998;
        const oldZoom = scale.zoom;
        let newZoom = oldZoom * speed ** e.deltaY;

        const clampedZoom = Math.max(0.1, Math.min(10, newZoom));

        if (oldZoom !== clampedZoom) {
          setScale((prev) => ({ ...prev, zoom: clampedZoom }));
          const rect = timelineContainerRef.current?.getBoundingClientRect();
          if (rect) {
            const cursorX = e.clientX - rect.left - timelineOffsetX;
            const newScrollLeft =
              (cursorX + scrollLeft - 16) * (clampedZoom / oldZoom) - (cursorX - 16);
            onRulerScroll(newScrollLeft);
          }
        }
      } else {
        const delta = e.shiftKey ? e.deltaY : e.deltaX || e.deltaY;
        if (delta !== 0) {
          e.preventDefault();
          onRulerScroll(scrollLeft + delta);
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [scale, timelineContainerRef, scrollLeft, onRulerScroll]);

  return (
    <div
      ref={timelineContainerRef}
      id="timeline-container"
      data-timeline="true"
      className="flex flex-col relative w-full h-full overflow-hidden bg-card border-t border-transparent"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseOut={onMouseOut}
    >
      <Header scale={scale} setScale={setScale} />
      <Ruler
        scale={scale}
        onClick={onClickRuler}
        scrollLeft={scrollLeft}
        onScroll={onRulerScroll}
      />
      <Playhead scale={scale} scrollLeft={scrollLeft} />

      {/* Container for Tracks and Canvas */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div style={{ width: timelineOffsetX }} className="relative flex-none" />
        <div className="relative flex-1 min-h-0 overflow-hidden">
          <canvas id="designcombo-timeline-canvas" ref={canvasElRef} />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
