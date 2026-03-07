import { TIMELINE_CONSTANTS } from "@/components/editor/timeline/timeline-constants";
import type { TPointerEventInfo } from "fabric";
import type Timeline from "../canvas";

/**
 * PointerHandler
 *
 * Owns all low-level canvas pointer/wheel input event handling:
 *   - mouse:wheel  → zoom / scroll emission
 *   - mouse:down   → kick off area-selection auto-scroll
 *   - mouse:move   → track pointer position during select/drag
 *   - mouse:up     → stop auto-scroll
 *
 * Keeps drag auto-scroll state and RAF loop fully encapsulated.
 * Call `bind()` after the Fabric canvas is initialised, and `unbind()`
 * inside `Timeline.dispose()` to guarantee zero listeners are leaked.
 */
export class PointerHandler {
  readonly #timeline: Timeline;

  // Auto-scroll state
  #rafId: number | null = null;
  #lastPointer: { x: number; y: number } | null = null;
  #isSelectingArea: boolean = false;

  // Stable handler references required for symmetric `.off()` calls
  readonly #onMouseWheel: (opt: TPointerEventInfo<WheelEvent>) => void;
  readonly #onMouseDown: (opt: any) => void;
  readonly #onMouseMove: (opt: any) => void;
  readonly #onMouseUp: () => void;

  constructor(timeline: Timeline) {
    this.#timeline = timeline;

    this.#onMouseWheel = (opt) => {
      // If scrollbars have taken over the wheel handler, delegate to them.
      if ((timeline as any).mouseWheelHandler) {
        (timeline as any).mouseWheelHandler(opt);
        return;
      }

      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      if (e.ctrlKey || e.metaKey) {
        timeline.emit("zoom", { delta: e.deltaY });
      } else {
        const deltaX = e.shiftKey ? e.deltaY : e.deltaX;
        const deltaY = e.shiftKey ? 0 : e.deltaY;
        timeline.emit("scroll", { deltaX, deltaY });
      }
    };

    this.#onMouseDown = (options) => {
      if (!options.target) {
        this.#isSelectingArea = true;
        this.#lastPointer = this.#extractPointer(options.e);
        this.#startAutoScroll();
      }
    };

    this.#onMouseMove = (options) => {
      if (this.#isSelectingArea) {
        this.#lastPointer = this.#extractPointer(options.e);
      }
    };

    this.#onMouseUp = () => this.#stopAutoScroll();
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  bind(): void {
    const { canvas } = this.#timeline;
    canvas.on("mouse:wheel", this.#onMouseWheel);
    canvas.on("mouse:down", this.#onMouseDown);
    canvas.on("mouse:move", this.#onMouseMove);
    canvas.on("mouse:up", this.#onMouseUp);
  }

  unbind(): void {
    this.#stopAutoScroll();
    const { canvas } = this.#timeline;
    if (!canvas) return;
    canvas.off("mouse:wheel", this.#onMouseWheel);
    canvas.off("mouse:down", this.#onMouseDown);
    canvas.off("mouse:move", this.#onMouseMove);
    canvas.off("mouse:up", this.#onMouseUp);
  }

  // ─── Public API (used by Timeline to start/stop scroll during drags) ────────

  startAutoScroll(pointer: { x: number; y: number }): void {
    this.#lastPointer = pointer;
    this.#startAutoScroll();
  }

  stopAutoScroll(): void {
    this.#stopAutoScroll();
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  #extractPointer(e: MouseEvent | PointerEvent | TouchEvent): { x: number; y: number } {
    const src = "clientX" in e ? e : (e as TouchEvent).touches[0];
    return { x: src.clientX, y: src.clientY };
  }

  #startAutoScroll(): void {
    if (this.#rafId !== null) return;
    const tick = () => {
      this.#tickAutoScroll();
      this.#rafId = requestAnimationFrame(tick);
    };
    this.#rafId = requestAnimationFrame(tick);
  }

  #stopAutoScroll(): void {
    if (this.#rafId !== null) {
      cancelAnimationFrame(this.#rafId);
      this.#rafId = null;
    }
    this.#lastPointer = null;
    this.#isSelectingArea = false;
  }

  #tickAutoScroll(): void {
    if (!this.#lastPointer) return;

    const timeline = this.#timeline;
    const { canvas } = timeline;
    const viewportWidth = canvas.width;
    const viewportHeight = canvas.height;
    const THRESHOLD = 60;
    const MAX_SPEED = 30;

    const rect = canvas.getElement().getBoundingClientRect();
    const x = this.#lastPointer.x - rect.left;
    const y = this.#lastPointer.y - rect.top;

    let deltaX = 0;
    let deltaY = 0;

    if (x < THRESHOLD) {
      deltaX = -MAX_SPEED * (1 - Math.max(0, x) / THRESHOLD);
    } else if (x > viewportWidth - THRESHOLD) {
      deltaX = MAX_SPEED * (1 - Math.max(0, viewportWidth - x) / THRESHOLD);
    }

    if (y < THRESHOLD) {
      deltaY = -MAX_SPEED * (1 - Math.max(0, y) / THRESHOLD);
    } else if (y > viewportHeight - THRESHOLD) {
      deltaY = MAX_SPEED * (1 - Math.max(0, viewportHeight - y) / THRESHOLD);
    }

    if (deltaX === 0 && deltaY === 0) return;

    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND;
    const projectDuration = timeline.totalDuration;
    const durationPx = projectDuration * pixelsPerSecond * timeline.timeScale;
    const maxScrollX = Math.max(0, durationPx - canvas.width);
    const maxScrollY = Math.max(0, timeline.totalTracksHeight + 15 - canvas.height);

    // Use the timeline's public scroll getters
    const currentScrollX = timeline.scrollX;
    const currentScrollY = timeline.scrollY;

    if (this.#isSelectingArea) {
      const newScrollX = Math.max(0, Math.min(maxScrollX, currentScrollX + deltaX));
      const newScrollY = Math.max(0, Math.min(maxScrollY, currentScrollY + deltaY));
      const actualDeltaX = newScrollX - currentScrollX;
      const actualDeltaY = newScrollY - currentScrollY;

      if (actualDeltaX !== 0 || actualDeltaY !== 0) {
        timeline.setScroll(newScrollX, newScrollY);
        timeline.emit("scroll", {
          deltaX: actualDeltaX,
          deltaY: actualDeltaY,
          scrollX: newScrollX,
          scrollY: newScrollY,
          isSelection: true,
        });
        // Keep marquee in sync with the shifted viewport
        (canvas as any)._onMouseMove({
          clientX: this.#lastPointer.x,
          clientY: this.#lastPointer.y,
        });
        canvas.requestRenderAll();
      }
    } else {
      const newScrollX = Math.max(0, currentScrollX + deltaX);
      const newScrollY = Math.max(0, Math.min(maxScrollY, currentScrollY + deltaY));
      const actualDeltaX = newScrollX - currentScrollX;
      const actualDeltaY = newScrollY - currentScrollY;

      if (actualDeltaX !== 0 || actualDeltaY !== 0) {
        timeline.setScroll(newScrollX, newScrollY);
        timeline.emit("scroll", {
          deltaX: actualDeltaX,
          deltaY: actualDeltaY,
          scrollX: newScrollX,
          scrollY: newScrollY,
        });
        // Sync active objects / selection box with new viewport
        (canvas as any)._onMouseMove({
          clientX: this.#lastPointer.x,
          clientY: this.#lastPointer.y,
          type: "mousemove",
          preventDefault: () => {},
          stopPropagation: () => {},
        });
        canvas.requestRenderAll();
      }
    }
  }
}
