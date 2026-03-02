import { Canvas, Rect, type FabricObject, ActiveSelection } from "fabric";
import { Track } from "./track";
import {
  Text,
  Video,
  Audio,
  Image,
  Effect,
  type BaseTimelineClip,
  Transition,
  Caption,
} from "./clips";
import { TransitionButton } from "./objects/transition-button";
import { TIMELINE_CONSTANTS } from "@/components/editor/timeline/timeline-constants";
import {
  type ITimelineTrack,
  type IClip,
  MICROSECONDS_PER_SECOND,
  type TrackType,
} from "@/types/timeline";

import EventEmitter from "./event-emitter";
import * as SelectionHandlers from "./handlers/selection";
import * as DragHandlers from "./handlers/drag-handler";
import * as ModifyHandlers from "./handlers/modify-handler";
import { PointerHandler } from "./handlers/pointer-handler";
import { Scrollbars } from "./scrollbar";
import { makeMouseWheel } from "./scrollbar/util";
import type { ScrollbarsProps } from "./scrollbar/types";
import { getTrackHeight } from "@/components/editor/timeline/timeline-constants";
import type { TMat2D, TPointerEventInfo } from "fabric";

export interface TimelineCanvasEvents {
  scroll: {
    deltaX: number;
    deltaY: number;
    scrollX?: number;
    scrollY?: number;
    isSelection?: boolean;
  };
  zoom: { delta: number; zoomLevel?: number };
  "clip:modified": {
    clipId: string;
    displayFrom: number;
    duration: number;
    trim?: { from: number; to: number };
  };
  "clips:modified": {
    clips: Array<{
      clipId: string;
      displayFrom: number;
      duration?: number;
      trim?: { from: number; to: number };
    }>;
  };
  "clip:movedToTrack": { clipId: string; trackId: string };
  "clip:movedToNewTrack": { clipId: string; targetIndex: number };
  "timeline:updated": { tracks: ITimelineTrack[] };
  "clips:removed": { clipIds: string[] };
  "selection:changed": { selectedIds: string[] };
  "selection:duplicated": { clipIds: string[] };
  "selection:split": { clipId: string; splitTime: number };
  "transition:add": { fromClipId: string; toClipId: string; trackId: string };
  "selection:delete": undefined;
  "viewport:changed": { scrollX: number; scrollY: number };
  [key: string]: any;
  [key: symbol]: any;
}

class Timeline extends EventEmitter<TimelineCanvasEvents> {
  containerEl: HTMLDivElement;
  canvas: Canvas;
  #resizeObserver: ResizeObserver | null = null;
  #timeScale: number = 1;
  #tracks: ITimelineTrack[] = [];
  #clipsMap: Record<string, IClip> = {};
  #offsetX: number = 0;
  #offsetY: number = 0;
  #scrollX: number = 0;
  #scrollY: number = 0;
  #scrollbars?: Scrollbars;
  #mouseWheelHandler?: (e: TPointerEventInfo<WheelEvent>) => void;
  #inputController!: PointerHandler;
  #totalTracksHeight: number = 0;
  /** Framework-agnostic callback for project total duration in seconds. */
  #getDuration: () => number;

  // Cache for Fabric objects
  #trackObjects: Map<string, Track> = new Map();
  #clipObjects: Map<string, BaseTimelineClip> = new Map();
  #separatorLines: {
    container: Rect;
    highlight: Rect;
    index: number;
  }[] = [];

  #trackRegions: { top: number; bottom: number; id: string }[] = [];
  #activeSeparatorIndex: number | null = null;
  #transitionButton: TransitionButton | null = null;

  // Bound event handlers (business-logic level — delegated from handlers/)
  #onDragging: (opt: any) => void;
  #onTrackRelocation: (opt: any) => void;
  #onClipModification: (opt: any) => void;
  #onSelectionCreate: (opt: any) => void;
  #onSelectionUpdate: (opt: any) => void;
  #onSelectionClear: (opt: any) => void;
  #onMouseMove: (opt: any) => void;
  #enableGuideRedraw: boolean = true;

  constructor(id: string, options: { getDuration?: () => number } = {}) {
    super();
    this.#getDuration = options.getDuration ?? (() => 0);
    this.containerEl = document.getElementById(id) as HTMLDivElement;

    if (!this.containerEl) {
      console.error(`Timeline container element with id '${id}' not found.`);
      return;
    }

    // Bind business-logic handlers
    this.#onDragging = (options) => {
      const e = options.e as MouseEvent | PointerEvent | TouchEvent;
      const src = "clientX" in e ? e : (e as TouchEvent).touches[0];
      this.#inputController.startAutoScroll({ x: src.clientX, y: src.clientY });
      DragHandlers.handleDragging(this, options);
    };
    this.#onTrackRelocation = (options) => {
      this.#inputController.stopAutoScroll();
      ModifyHandlers.handleTrackRelocation(this, options);
    };
    this.#onClipModification = (options) => {
      this.#inputController.stopAutoScroll();
      ModifyHandlers.handleClipModification(this, options);
    };
    this.#onSelectionCreate = (e) =>
      SelectionHandlers.handleSelectionCreate(this, e);
    this.#onSelectionUpdate = (e) =>
      SelectionHandlers.handleSelectionUpdate(this, e);
    this.#onSelectionClear = (e) =>
      SelectionHandlers.handleSelectionClear(this, e);
    this.#onMouseMove = (e) => this.handleMouseMove(e);

    this.init();
  }

  public init() {
    const canvasElement = document.createElement("canvas");
    canvasElement.style.width = "100%";
    canvasElement.style.height = "100%";
    this.containerEl.appendChild(canvasElement);

    const { clientWidth, clientHeight } = this.containerEl;

    this.canvas = new Canvas(canvasElement, {
      width: clientWidth,
      height: clientHeight,
      selection: true,
      renderOnAddRemove: false, // Performance optimization
    });

    // Delegate all low-level pointer/wheel input to the controller
    this.#inputController = new PointerHandler(this);
    this.#inputController.bind();

    this.render();

    this.#resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.canvas.setDimensions({ width, height });
        this.render(); // Re-render to update track widths
      }
    });

    this.#resizeObserver.observe(this.containerEl);
    this.#bindBusinessEvents();
  }

  /**
   * Registers business-logic level Fabric event handlers (drag, modify, selection, hover).
   * Low-level input (wheel/pointer) is handled by CanvasInputController.
   */
  #bindBusinessEvents() {
    this.canvas.on("object:moving", this.#onDragging);
    // handleTrackRelocation must run before handleClipModification
    this.canvas.on("object:modified", this.#onTrackRelocation);
    this.canvas.on("object:modified", this.#onClipModification);
    this.canvas.on("selection:created", this.#onSelectionCreate);
    this.canvas.on("selection:updated", this.#onSelectionUpdate);
    this.canvas.on("selection:cleared", this.#onSelectionClear);
    this.canvas.on("mouse:move", this.#onMouseMove);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Public accessors used by PointerHandler
  // ──────────────────────────────────────────────────────────────────────────

  /** Current horizontal scroll offset in pixels. */
  get scrollX(): number {
    return this.#scrollX;
  }

  /** Current vertical scroll offset in pixels. */
  get scrollY(): number {
    return this.#scrollY;
  }

  /**
   * Optional override installed by the Scrollbar subsystem.
   * PointerHandler checks this so it can delegate wheel events.
   */
  get mouseWheelHandler():
    | ((e: TPointerEventInfo<WheelEvent>) => void)
    | undefined {
    return this.#mouseWheelHandler;
  }

  /**
   * Total project duration in seconds, sourced via the getDuration callback
   * provided at construction. Zero if no callback was provided.
   */
  get totalDuration(): number {
    return this.#getDuration();
  }

  private handleMouseMove(opt: any) {
    const pointer = this.canvas.getPointer(opt.e);
    const x = pointer.x;
    const y = pointer.y;

    const track = this.getTrackAt(y);
    if (!track) {
      this.clearTransitionButton();
      return;
    }

    const trackData = this.#tracks.find((t) => t.id === track.id);
    if (!trackData) {
      this.clearTransitionButton();
      return;
    }

    // Only show button for Video/Image tracks (or tracks with media clips)
    // For now, let's just check the clips at that junction
    const clipsAtTrack = trackData.clipIds
      .map((id) => this.#clipsMap[id])
      .filter((c) => !!c)
      .sort((a, b) => a.display.from - b.display.from);

    const TRANSITION_POINT_THRESHOLD = 10; // Pixels
    let foundTransitionPoint = null;

    for (let i = 0; i < clipsAtTrack.length - 1; i++) {
      const clipA = clipsAtTrack[i];
      const clipB = clipsAtTrack[i + 1];

      // Check if they are adjacent in time (within 0.1s or something small)
      // Actually, they should be exactly together for a transition usually,
      // but let's allow a small gap in pixels detection.
      const endXA =
        (clipA.display.to / MICROSECONDS_PER_SECOND) *
        TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
        this.#timeScale;

      const startXB =
        (clipB.display.from / MICROSECONDS_PER_SECOND) *
        TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
        this.#timeScale;

      // Transition point is average or just endXAs if they are snapped
      const transitionPointX = (endXA + startXB) / 2;

      if (Math.abs(x - transitionPointX) < TRANSITION_POINT_THRESHOLD) {
        // Higher priority check: types must be media (Video/Image)
        if (
          (clipA.type === "Video" || clipA.type === "Image") &&
          (clipB.type === "Video" || clipB.type === "Image")
        ) {
          // Check if there's already a transition here
          const hasTransition = trackData.clipIds.some((id) => {
            const c = this.#clipsMap[id];
            if (!c || c.type !== "Transition") return false;
            // Transition is roughly centered at transition point
            const tStart =
              (c.display.from / MICROSECONDS_PER_SECOND) *
              TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
              this.#timeScale;
            const tEnd =
              (c.display.to / MICROSECONDS_PER_SECOND) *
              TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
              this.#timeScale;
            return transitionPointX >= tStart && transitionPointX <= tEnd;
          });

          if (!hasTransition) {
            foundTransitionPoint = {
              x: transitionPointX,
              clipA,
              clipB,
              trackId: track.id,
            };
            break;
          }
        }
      }
    }

    if (foundTransitionPoint) {
      this.showTransitionButton(
        foundTransitionPoint.x,
        track.top + (track.bottom - track.top) / 2,
        foundTransitionPoint.clipA.id,
        foundTransitionPoint.clipB.id,
        foundTransitionPoint.trackId,
      );
    } else {
      this.clearTransitionButton();
    }
  }

  private showTransitionButton(
    x: number,
    y: number,
    clipAId: string,
    clipBId: string,
    trackId: string,
  ) {
    if (this.#transitionButton) {
      // If already showing for these clips, just move it if needed (though it shouldn't move much)
      if (
        (this.#transitionButton as any).clipAId === clipAId &&
        (this.#transitionButton as any).clipBId === clipBId
      ) {
        this.#transitionButton.set({ left: x, top: y });
        this.#transitionButton.setCoords();
        this.canvas.requestRenderAll();
        return;
      }
      this.clearTransitionButton();
    }

    this.#transitionButton = new TransitionButton({
      left: x,
      top: y,
      onClick: () => {
        this.emit("transition:add", {
          fromClipId: clipAId,
          toClipId: clipBId,
          trackId: trackId,
        });
      },
    });

    (this.#transitionButton as any).clipAId = clipAId;
    (this.#transitionButton as any).clipBId = clipBId;

    this.canvas.add(this.#transitionButton);
    this.canvas.bringObjectToFront(this.#transitionButton);
    this.canvas.requestRenderAll();
  }

  private clearTransitionButton() {
    if (this.#transitionButton) {
      this.canvas.remove(this.#transitionButton);
      this.#transitionButton = null;
      this.canvas.requestRenderAll();
    }
  }

  // --- PUBLIC GETTERS / SETTERS FOR HANDLERS ---

  public get tracks() {
    return this.#tracks;
  }

  public setTracksInternal(tracks: ITimelineTrack[]) {
    this.#tracks = tracks;
  }

  public get clipsMap() {
    return this.#clipsMap;
  }

  public get timeScale() {
    return this.#timeScale;
  }

  public get totalTracksHeight() {
    return this.#tracks.reduce<number>((acc, track) => {
      let trackType: TrackType = "Video";
      if (
        track.type.toLowerCase() === "caption" ||
        track.type.toLowerCase() === "text"
      ) {
        trackType = "Text";
      } else if (track.type.toLowerCase() === "audio") {
        trackType = "Audio";
      } else if (
        track.type.toLowerCase() === "effect" ||
        track.type.toLowerCase() === "filter"
      ) {
        trackType = "Effect";
      }
      return acc + getTrackHeight(trackType) + TIMELINE_CONSTANTS.TRACK_SPACING;
    }, TIMELINE_CONSTANTS.TRACK_PADDING_TOP);
  }

  public get activeSeparatorIndex() {
    return this.#activeSeparatorIndex;
  }

  public setActiveSeparatorIndex(index: number | null) {
    this.#activeSeparatorIndex = index;
  }

  public get trackRegions() {
    return this.#trackRegions;
  }

  public get enableGuideRedraw() {
    return this.#enableGuideRedraw;
  }

  public set enableGuideRedraw(value: boolean) {
    this.#enableGuideRedraw = value;
  }

  public clearSeparatorHighlights() {
    this.#separatorLines.forEach((sep) => {
      sep.highlight.set("fill", "transparent");
    });
  }

  public isOverTrack(y: number): boolean {
    return !!this.getTrackAt(y);
  }

  public getTrackAt(
    y: number,
  ): { top: number; bottom: number; id: string } | undefined {
    return this.#trackRegions.find(
      (region) => y >= region.top && y <= region.bottom,
    );
  }

  public getTimelineX(canvasX: number): number {
    const vpt = this.canvas.viewportTransform;
    return (
      (canvasX - vpt[4]) /
      (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.#timeScale)
    );
  }

  public getCanvasX(timelineSeconds: number): number {
    const vpt = this.canvas.viewportTransform;
    return (
      timelineSeconds * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.#timeScale +
      vpt[4]
    );
  }

  /**
   * Returns the stable X position in the "infinite canvas" space (starts at 0, no scroll/offset)
   */
  public getInfiniteX(timelineSeconds: number): number {
    return (
      timelineSeconds * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.#timeScale
    );
  }

  /**
   * Returns the timeline seconds from a stable X position in "infinite canvas" space
   */
  public getTimeFromInfiniteX(infiniteX: number): number {
    return infiniteX / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.#timeScale);
  }

  public checkSeparatorIntersection(
    cursorY: number,
  ): { container: Rect; highlight: Rect; index: number } | null {
    // Separator height is derived from gap
    const SEPARATOR_HEIGHT = TIMELINE_CONSTANTS.TRACK_SPACING;
    const THRESHOLD = SEPARATOR_HEIGHT / 2 + 5;

    for (const sep of this.#separatorLines) {
      const sepCenter = sep.container.getCenterPoint();
      const distY = Math.abs(cursorY - sepCenter.y);
      if (distY < THRESHOLD) return sep;
    }
    return null;
  }

  public setTracks(
    tracks: ITimelineTrack[],
    clips: Record<string, IClip>,
  ) {
    this.#tracks = tracks;
    this.#clipsMap = clips;
    this.render();
  }

  public updateTheme(themeStr: "dark" | "light") {
    const isDark = themeStr === "dark";
    const trackColor = isDark ? "#202020" : "#f4f4f5";
    const scrollbarFill = isDark
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.3)";
    const scrollbarStroke = isDark
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";

    // Update existing tracks
    this.#trackObjects.forEach((track) => {
      track.set("fill", trackColor);
    });

    // Update scrollbars
    if (this.#scrollbars) {
      this.#scrollbars.updateColors(scrollbarFill, scrollbarStroke);
    }

    this.canvas.requestRenderAll();
  }

  public clear() {
    this.#tracks = []; // Reset tracks
    this.#clipsMap = {}; // Reset clips
    // Also clear internal object caches
    this.#trackObjects.forEach((obj) => this.canvas.remove(obj));
    this.#trackObjects.clear();
    this.#clipObjects.forEach((obj) => this.canvas.remove(obj));
    this.#clipObjects.clear();
    this.#separatorLines.forEach((sep) => {
      this.canvas.remove(sep.container);
      this.canvas.remove(sep.highlight);
    });
    this.#separatorLines = [];
    this.#trackRegions = [];
    this.clearTransitionButton();

    this.canvas.requestRenderAll();
    this.emit("timeline:cleared", {});
  }

  public initScrollbars(config: any = {}): void {
    this.#offsetX = config.offsetX ?? 0;
    this.#offsetY = config.offsetY ?? 0;
    this.#scrollX = config.scrollX ?? 0;
    this.#scrollY = config.scrollY ?? 0;

    const scrollConfig: ScrollbarsProps = {
      offsetX: this.#offsetX,
      offsetY: this.#offsetY,
      extraMarginX: config.extraMarginX ?? 50,
      extraMarginY: config.extraMarginY ?? 15,
      scrollbarWidth: config.scrollbarWidth ?? 8,
      scrollbarColor: config.scrollbarColor ?? "rgba(255, 255, 255, 0.3)",
      onViewportChange: ({ scrollX, scrollY }) => {
        if (typeof scrollX === "number") this.#scrollX = scrollX;
        if (typeof scrollY === "number") this.#scrollY = scrollY;
        this.emit("scroll", {
          deltaX: 0,
          deltaY: 0,
          scrollX,
          scrollY,
        });
      },
      onZoom: (zoom: number) => {
        this.emit("zoom", { delta: 0, zoomLevel: zoom });
      },
    };

    this.#mouseWheelHandler = makeMouseWheel(this, scrollConfig);
    this.#scrollbars = new Scrollbars(this, scrollConfig);

    const offsetX = config.offsetX ?? 0;
    const offsetY = config.offsetY ?? 0;

    if (offsetX !== 0 || offsetY !== 0) {
      const vpt = this.canvas.viewportTransform.slice(0) as TMat2D;
      vpt[4] = offsetX;
      vpt[5] = offsetY;
      this.canvas.setViewportTransform(vpt);
      this.canvas.requestRenderAll();
    }
  }

  public disposeScrollbars(): void {
    if (this.#scrollbars) {
      this.#scrollbars.dispose();
      this.#scrollbars = undefined;
    }
    this.#mouseWheelHandler = undefined;
  }

  public render() {
    // We do NOT clear everything. We update existing objects.
    // However, separators and regions are cheap to rebuild for now,
    // or we can optimize them too. Let's start with Tracks and Clips which are heavy.

    this.#trackRegions = [];
    const usedTrackIds = new Set<string>();
    const usedClipIds = new Set<string>();

    const GAP = TIMELINE_CONSTANTS.TRACK_SPACING;
    const PADDING_TOP = TIMELINE_CONSTANTS.TRACK_PADDING_TOP;
    let currentY = PADDING_TOP;

    // Ensure separators are rebuilt (simple rects) - optimizing this later if needed
    // Actually, let's clear separators from canvas first
    this.#separatorLines.forEach((sep) => {
      this.canvas.remove(sep.container);
      this.canvas.remove(sep.highlight);
    });
    this.#separatorLines = [];

    // Render Top Separator
    this.renderSeparatorLine(0, currentY - GAP / 2, this.canvas.width || 2000);

    const trackWidth = Math.max(2000, this.canvas.width || 1000);

    // --- PASS 1: TRACKS ---
    this.#tracks.forEach((trackData) => {
      usedTrackIds.add(trackData.id);

      let trackType: TrackType = "Video";
      if (
        trackData.type.toLowerCase() === "caption" ||
        trackData.type.toLowerCase() === "text"
      ) {
        trackType = "Text";
      } else if (trackData.type.toLowerCase() === "audio") {
        trackType = "Audio";
      } else if (trackData.type.toLowerCase() === "effect") {
        trackType = "Effect";
      }

      const trackHeight = getTrackHeight(trackType);

      this.#trackRegions.push({
        top: currentY,
        bottom: currentY + trackHeight,
        id: trackData.id,
      });

      let trackObj = this.#trackObjects.get(trackData.id);
      if (!trackObj) {
        const themeStr = document.documentElement.classList.contains("dark")
          ? "dark"
          : "light";
        trackObj = new Track({
          left: 0,
          top: currentY,
          width: trackWidth,
          height: trackHeight,
          trackType: trackType as TrackType,
          trackId: trackData.id,
          selectable: false,
          evented: false,
          fill: themeStr === "dark" ? "#202020" : "#f4f4f5",
        });
        this.#trackObjects.set(trackData.id, trackObj);
        this.canvas.add(trackObj);
      } else {
        trackObj.set({
          top: currentY,
          width: trackWidth,
          height: trackHeight,
        });
        trackObj.setCoords();
      }
      // (trackObj as any).sendToBack();

      currentY += trackHeight + GAP;
    });

    this.#totalTracksHeight = currentY;

    // --- PASS 2: SEPARATORS ---
    // Reset currentY for separators or use trackRegions
    let sepY = PADDING_TOP;
    this.renderSeparatorLine(0, sepY - GAP / 2, this.canvas.width || 2000);
    this.#trackRegions.forEach((region, index) => {
      this.renderSeparatorLine(
        index + 1,
        region.bottom + GAP / 2,
        this.canvas.width || 2000,
      );
    });

    // --- PASS 3: CLIPS ---
    this.#tracks.forEach((trackData, trackIndex) => {
      const region = this.#trackRegions[trackIndex];
      const trackHeight = region.bottom - region.top;

      trackData.clipIds.forEach((clipId) => {
        usedClipIds.add(clipId);
        const clip = this.#clipsMap[clipId];
        if (!clip) return;

        const startTimeSeconds = clip.display.from / MICROSECONDS_PER_SECOND;
        const durationSeconds = clip.duration / MICROSECONDS_PER_SECOND;
        const startX =
          startTimeSeconds *
          TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
          this.#timeScale;

        const width =
          durationSeconds *
          TIMELINE_CONSTANTS.PIXELS_PER_SECOND *
          this.#timeScale;

        if (
          clip.type === "Caption" ||
          clip.type === "Text" ||
          clip.type === "Video" ||
          clip.type === "Image" ||
          clip.type === "Audio" ||
          clip.type === "Effect" ||
          clip.type === "Transition" ||
          clip.type === "Placeholder"
        ) {
          let timelineClip = this.#clipObjects.get(clip.id);
          const isMedia =
            clip.type === "Video" ||
            clip.type === "Image" ||
            clip.type === "Audio";

          const isTextual = clip.type === "Text" || clip.type === "Caption";

          let clipName = isTextual
            ? clip.text || clip.name || clip.type
            : clip.name || (isMedia ? clip.src : clip.text) || clip.type;

          // If it's a media URL and we still have a long URL, try to extract the filename
          if (
            isMedia &&
            clipName &&
            (clipName.startsWith("http") || clipName.startsWith("blob:"))
          ) {
            try {
              const url = new URL(clipName);
              const pathname = url.pathname;
              const filename = pathname.split("/").pop();
              if (filename) {
                clipName = decodeURIComponent(filename);
              }
            } catch (e) {
              // Not a valid URL, keep as is
            }
          }

          if (!timelineClip) {
            const commonProps = {
              left: startX,
              top: region.top,
              width: width,
              height: trackHeight,
              elementId: clip.id,
              text: clipName,
              src: clip.src,
            };
            console.log({ commonProps });

            if (clip.type === "Audio") {
              timelineClip = new Audio(commonProps);
            } else if (clip.type === "Video" || clip.type === "Placeholder") {
              timelineClip = new Video(commonProps);
            } else if (clip.type === "Image") {
              timelineClip = new Image(commonProps);
            } else if (clip.type === "Effect") {
              timelineClip = new Effect(commonProps);
            } else if (clip.type === "Transition") {
              timelineClip = new Transition(commonProps);
            } else if (clip.type === "Caption") {
              timelineClip = new Caption(commonProps);
            } else {
              timelineClip = new Text(commonProps);
            }

            this.#clipObjects.set(clip.id, timelineClip);
            this.canvas.add(timelineClip);
            timelineClip.set({
              sourceDuration: clip.sourceDuration,
              duration: clip.duration * (clip.playbackRate || 1),
              trim: clip.trim
                ? { ...clip.trim }
                : {
                    from: 0,
                    to: clip.duration * (clip.playbackRate || 1),
                  },
              playbackRate: clip.playbackRate || 1,
              timeScale: this.#timeScale,
              studioClipId: clip.id,
            });
          } else {
            timelineClip.set({
              left: startX,
              top: region.top,
              width: width,
              height: trackHeight,
              text: clipName,
              src: clip.src,
              trim: clip.trim
                ? { ...clip.trim }
                : {
                    from: 0,
                    to:
                      clip.sourceDuration ||
                      clip.duration * (clip.playbackRate || 1),
                  },
              playbackRate: clip.playbackRate || 1,
              timeScale: this.#timeScale,
              duration: clip.duration * (clip.playbackRate || 1),
              sourceDuration: clip.sourceDuration,
              studioClipId: clip.id,
            });
            timelineClip.setCoords();
          }
          // (timelineClip as FabricObject).
          this.canvas.bringObjectToFront(timelineClip);
        }
      });
    });

    // Cleanup Unused Objects
    // Tracks
    for (const [id, obj] of this.#trackObjects) {
      if (!usedTrackIds.has(id)) {
        this.canvas.remove(obj);
        this.#trackObjects.delete(id);
      }
    }
    // Clips
    for (const [id, obj] of this.#clipObjects) {
      if (!usedClipIds.has(id)) {
        this.canvas.remove(obj);
        this.#clipObjects.delete(id);
      }
    }

    this.canvas.requestRenderAll();
  }

  public selectClips(clipIds: string[]) {
    // Avoid infinite loops: check if selection is already correct
    const currentSelection = this.canvas.getActiveObjects();
    const currentIds = currentSelection
      .map((obj: any) => obj.elementId)
      .filter(Boolean);

    // Sort to compare arrays regardless of order
    const sortedClipIds = [...clipIds].sort();
    const sortedCurrentIds = [...currentIds].sort();

    if (JSON.stringify(sortedClipIds) === JSON.stringify(sortedCurrentIds)) {
      return;
    }

    const objectsToSelect: FabricObject[] = [];

    // Find objects
    for (const id of clipIds) {
      const clipObj = this.#clipObjects.get(id);
      if (clipObj) {
        // Ensure coordinates are fresh before selection to prevent jumping
        clipObj.setCoords();
        objectsToSelect.push(clipObj);
      }
    }

    if (objectsToSelect.length === 0) {
      this.canvas.discardActiveObject();
    } else if (objectsToSelect.length === 1) {
      this.canvas.setActiveObject(objectsToSelect[0]);
    } else {
      const activeSelection = new ActiveSelection(objectsToSelect, {
        canvas: this.canvas,
      });
      this.canvas.setActiveObject(activeSelection);
    }

    this.canvas.requestRenderAll();
  }

  public async deleteSelectedClips() {
    const activeObjects = this.canvas.getActiveObjects();
    if (!activeObjects || activeObjects.length === 0) return;

    // We emit intent to delete selected.
    // The synchronization layer or parent component will handle actually calling the engine.
    this.emit("selection:delete", undefined);
  }

  public duplicateSelectedClips() {
    const activeObjects = this.canvas.getActiveObjects();
    if (!activeObjects || activeObjects.length === 0) return;

    const clipIdsToDuplicate: string[] = [];

    activeObjects.forEach((obj: any) => {
      if (obj.elementId) {
        clipIdsToDuplicate.push(obj.elementId);
      }
    });

    if (clipIdsToDuplicate.length > 0) {
      this.emit("selection:duplicated", { clipIds: clipIdsToDuplicate });
    }
  }

  public splitSelectedClip(splitTime: number) {
    const activeObjects = this.canvas.getActiveObjects();

    // 1. Check strict single selection
    if (!activeObjects || activeObjects.length !== 1) {
      console.warn("Split requires exactly one selected clip.");
      return;
    }

    const obj = activeObjects[0] as any;
    const clipId = obj.elementId;

    if (!clipId) return;

    // 2. Validate split time against clip bounds
    const clip = this.#clipsMap[clipId];
    if (!clip) {
      console.error("Clip not found for split:", clipId);
      return;
    }

    // "split can be done only if 1 clip is selected" - Checked.
    // "Either the current time can be provided" - Provided as arg.

    // Check if time is within clip display range (exclusive of edges)
    // We don't split if exactly at start or end.
    if (splitTime <= clip.display.from || splitTime >= clip.display.to) {
      console.warn(
        "Split time is outside the clip range or at the edges.",
        splitTime,
        clip.display,
      );
      return;
    }

    // 3. Emit event
    this.emit("selection:split", { clipId, splitTime });
  }

  public reloadClip(clipId: string) {
    const clip = this.#clipObjects.get(clipId);
    if (!clip) return;

    if (clip instanceof Video) {
      // Re-trigger thumbnail loading
      clip.loadAndRenderThumbnails();
    }
  }

  public emitSelectionChange() {
    const activeObjects = this.canvas.getActiveObjects();
    const activeIds = activeObjects
      .map((obj: any) => obj.elementId)
      .filter(Boolean);

    this.emit("selection:changed", { selectedIds: activeIds });
  }

  private renderSeparatorLine(index: number, top: number, width: number) {
    // Container rect - 4px total height, transparent
    const container = new Rect({
      left: 0,
      top: top,
      width: width,
      height: TIMELINE_CONSTANTS.TRACK_SPACING,
      fill: "transparent",
      selectable: false,
      evented: false,
      hoverCursor: "default",
      originY: "center",
      opacity: 0.5,
    });

    // Highlight rect - 2px in the center, initially transparent
    const highlight = new Rect({
      left: 0,
      top: top,
      width: width,
      height: 2,
      fill: "transparent",
      selectable: false,
      evented: false,
      hoverCursor: "default",
      originY: "center",
      opacity: 0.8,
    });

    this.canvas.add(container);
    this.canvas.add(highlight);
    this.#separatorLines.push({ container, highlight, index });
  }

  public setTimeScale(zoom: number) {
    this.#timeScale = zoom;

    // Notify clips about zoom change (affects thumbnails density)
    this.#clipObjects.forEach((clip) => {
      if (
        "onScrollChange" in clip &&
        typeof (clip as any).onScrollChange === "function"
      ) {
        (clip as any).onScrollChange({
          scrollLeft: this.#scrollX,
          force: true,
        });
      }
    });

    this.render();
  }

  public setScroll(scrollX?: number, scrollY?: number) {
    if (typeof scrollX === "number") this.#scrollX = scrollX;
    if (typeof scrollY === "number") this.#scrollY = scrollY;

    const vpt = [...this.canvas.viewportTransform];
    vpt[4] = -this.#scrollX + this.#offsetX;
    vpt[5] = -this.#scrollY + this.#offsetY;

    this.canvas.setViewportTransform(
      vpt as [number, number, number, number, number, number],
    );

    // Notify clips about scroll change for lazy loading thumbnails
    this.#clipObjects.forEach((clip) => {
      if (
        "onScrollChange" in clip &&
        typeof (clip as any).onScrollChange === "function"
      ) {
        (clip as any).onScrollChange({ scrollLeft: this.#scrollX });
      }
    });

    // Update control coordinates when viewport changes
    this.canvas.getObjects().forEach((obj) => {
      if (obj.hasControls) obj.setCoords();
    });

    this.canvas.requestRenderAll();
  }

  public dispose() {
    // 1. Stop all input handling and cancel any pending RAF loop
    if (this.#inputController) {
      this.#inputController.unbind();
    }

    // 2. Stop observing size changes
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }

    // 3. Remove business-logic Fabric listeners and dispose the canvas
    if (this.canvas) {
      this.canvas.off("object:moving", this.#onDragging);
      this.canvas.off("object:modified", this.#onTrackRelocation);
      this.canvas.off("object:modified", this.#onClipModification);
      this.canvas.off("selection:created", this.#onSelectionCreate);
      this.canvas.off("selection:updated", this.#onSelectionUpdate);
      this.canvas.off("selection:cleared", this.#onSelectionClear);
      this.canvas.off("mouse:move", this.#onMouseMove);

      this.clearTransitionButton();
      this.disposeScrollbars();
      this.canvas.dispose();
      (this.canvas as any) = null;
    }

    // 4. Clear DOM and event emitter subscriptions
    if (this.containerEl) {
      this.containerEl.innerHTML = "";
    }
    if (this.all) {
      this.all.clear();
    }
  }
}

export default Timeline;
