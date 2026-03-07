import { BaseTimelineClip, type BaseClipProps } from "./base";
import { type Control, Pattern } from "fabric";
import { createTrimControls } from "../controls";
import { editorFont } from "@/components/editor/constants";
import { TIMELINE_CONSTANTS } from "@/components/editor/timeline/timeline-constants";
import { useStudioStore } from "@/stores/studio-store";
import type { Video as VideoClip } from "openvideo";
import ThumbnailCache from "../utils/thumbnail-cache";
import { unitsToTimeMs } from "../utils/filmstrip";

const MICROSECONDS_IN_SECOND = 1_000_000;
const DEFAULT_THUMBNAIL_HEIGHT = 52;
const DEFAULT_ASPECT_RATIO = 16 / 9;
const FALLBACK_COLOR = "#1e1b4b"; // Deep Indigo
const THUMBNAIL_STEP_US = 1_000_000; // 1fps

export class Video extends BaseTimelineClip {
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTrimControls() };
  }

  public studioClipId?: string;
  public duration: number = 0;
  public sourceDuration: number = 0;
  public playbackRate: number = 1;
  public trim: { from: number; to: number } = { from: 0, to: 0 };

  private _aspectRatio: number = DEFAULT_ASPECT_RATIO;

  private _thumbnailWidth: number = 0;
  private _thumbnailHeight: number = DEFAULT_THUMBNAIL_HEIGHT;
  private _isFetchingThumbnails: boolean = false;
  private _thumbAborter: AbortController | null = null;
  private _thumbnailCache: ThumbnailCache = new ThumbnailCache();

  static ownDefaults = {
    rx: 6,
    ry: 6,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#312e81",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };

  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Video.ownDefaults);
    this.initialize();
  }

  set(key: string, value: any) {
    if (key === "width") {
      // Re-initialize dimensions and thumbnails if width changes (e.g. zoom, trim)
      // Debounce this if it happens too often during drag, but for now simple trigger
      if (this.width !== value) {
        // We'll handle resize logic in setters or observers if needed,
        // but for now initialize handles initial setup.
        // If we are resizing, we might need to fetch more thumbnails.
      }
    }
    return super.set(key, value);
  }

  public initDimensions() {
    this._thumbnailHeight = this.height || DEFAULT_THUMBNAIL_HEIGHT;
    this._thumbnailWidth = this._thumbnailHeight * this._aspectRatio;
  }

  public async initialize() {
    this.initDimensions();

    // Initial fallback with default 16:9
    await this.createFallbackThumbnail();
    this.createFallbackPattern();

    // Trigger loading which will also update aspect ratio if metadata is ready
    this.loadAndRenderThumbnails();
  }

  private async createFallbackThumbnail() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetHeight = DEFAULT_THUMBNAIL_HEIGHT;
    const targetWidth = Math.round(targetHeight * this._aspectRatio);

    canvas.height = targetHeight;
    canvas.width = targetWidth;

    ctx.fillStyle = FALLBACK_COLOR;
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const img = new Image();
    img.src = canvas.toDataURL();
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    this._thumbnailWidth = targetWidth;
    this._thumbnailCache.setThumbnail("fallback", img);
  }

  private createFallbackPattern() {
    // No longer using pattern fill - we draw directly in _render
    // Keep this method for compatibility but it does nothing
    this.canvas?.requestRenderAll();
  }

  public onScrollChange({ scrollLeft, force }: { scrollLeft: number; force?: boolean }) {
    // No-op for thumbnail loading now, as we load all at once.
    // We might want to use scrollLeft for culling in drawFilmstrip if we wanted to optimization,
    // but the requirement is to simplify.
  }

  public async loadAndRenderThumbnails() {
    if (this._isFetchingThumbnails) return;

    const studio = useStudioStore.getState().studio;
    if (!studio || !this.studioClipId) return;

    const clip = studio.getClipById(this.studioClipId);
    if (!clip || clip.type !== "Video") return;

    const videoClip = clip as VideoClip;

    // Update aspect ratio from metadata if available
    const { width, height, duration: sourceDuration } = videoClip.meta;
    let needsUpdate = false;

    if (width && height) {
      const newAspectRatio = width / height;
      if (Math.abs(this._aspectRatio - newAspectRatio) > 0.01) {
        this._aspectRatio = newAspectRatio;
        needsUpdate = true;
      }
    }

    if (sourceDuration && sourceDuration !== this.sourceDuration) {
      this.sourceDuration = sourceDuration;

      // Clamp current trim and duration to new source duration
      if (this.trim.to > sourceDuration) {
        this.trim.to = sourceDuration;
        this.trim.from = Math.min(this.trim.from, this.trim.to);
        this.duration = (this.trim.to - this.trim.from) / this.playbackRate;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      this.initDimensions();
      await this.createFallbackThumbnail();
      this.createFallbackPattern();
    }

    this._thumbAborter?.abort();
    this._thumbAborter = new AbortController();
    const { signal } = this._thumbAborter;
    this._isFetchingThumbnails = true;

    const stepUs = MICROSECONDS_IN_SECOND;

    const startUs = Math.floor(this.trim.from / stepUs) * stepUs;
    const endUs = Math.ceil(this.trim.to / stepUs) * stepUs;

    const timestamps: number[] = [];
    for (let t = startUs; t <= endUs; t += stepUs) {
      timestamps.push(t);
    }

    try {
      if (timestamps.length === 0) {
        this._isFetchingThumbnails = false;
        return;
      }

      const thumbnailsArr = await videoClip.thumbnails(this._thumbnailWidth, {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1],
        step: stepUs,
      });

      if (signal.aborted || !this.canvas) {
        this._isFetchingThumbnails = false;
        return;
      }

      const cacheBatch = thumbnailsArr.map((t, i) => {
        return { key: i, img: t.img };
      });

      await this.loadThumbnailBatch(cacheBatch);

      this._isFetchingThumbnails = false;

      // Final check before render
      if (!signal.aborted && this.canvas) {
        this.canvas.requestRenderAll();
      }
    } catch (error: any) {
      this._isFetchingThumbnails = false;

      // Ignore expected abort errors
      if (
        error?.name === "AbortError" ||
        error?.message === "generate thumbnails aborted" ||
        error?.message?.includes("aborted")
      ) {
        return;
      }

      console.warn("Failed to load thumbnails:", error);
    }
  }

  private async loadThumbnailBatch(thumbnails: { key: number; img: Blob }[]) {
    const loadPromises = thumbnails.map(async ({ key, img: blob }) => {
      if (this._thumbnailCache.getThumbnail(key)) return;

      return new Promise<void>((resolve) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.onload = () => {
          URL.revokeObjectURL(url);
          this._thumbnailCache.setThumbnail(key, img);
          resolve();
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          resolve();
        };
      });
    });

    await Promise.all(loadPromises);
  }

  public _render(ctx: CanvasRenderingContext2D) {
    // Save context and set up clipping BEFORE any drawing
    ctx.save();

    // Apply rounded rectangle clipping to ensure ALL content stays within bounds
    const radius = this.rx || 6;
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, radius);
    ctx.clip();

    // Draw background fill manually (instead of using super._render with pattern)
    ctx.fillStyle = (this.fill as string) || "#312e81";
    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Translate for filmstrip and identity drawing
    ctx.translate(-this.width / 2, -this.height / 2);

    this.drawFilmstrip(ctx);
    this.drawIdentity(ctx);

    ctx.restore();

    // Draw selection border (outside the clipping region)
    this.updateSelected(ctx);
  }

  private drawFilmstrip(ctx: CanvasRenderingContext2D) {
    const height = this.height || DEFAULT_THUMBNAIL_HEIGHT;
    const thumbnailWidth = Math.round(height * this._aspectRatio);
    const thumbnailHeight = height;

    const oneSourceSecWidth =
      (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.timeScale) / (this.playbackRate || 1);

    let minX = Infinity;
    let maxX = -Infinity;
    if (oneSourceSecWidth >= thumbnailWidth) {
      const startSourceSec = Math.floor(this.trim.from / MICROSECONDS_IN_SECOND);
      const endSourceSec = Math.ceil(this.trim.to / MICROSECONDS_IN_SECOND);

      for (let sec = startSourceSec; sec <= endSourceSec; sec++) {
        const sourceTimeUs = sec * MICROSECONDS_IN_SECOND;
        const relativeSourceTimeUs = sourceTimeUs - this.trim.from;
        const relativeVisualTimeSec =
          relativeSourceTimeUs / MICROSECONDS_IN_SECOND / (this.playbackRate || 1);

        const xStart =
          relativeVisualTimeSec * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * this.timeScale;
        const xEnd = xStart + oneSourceSecWidth;

        if (xEnd < 0 || xStart > this.width) continue;

        const img =
          this._thumbnailCache.getThumbnail(sec) || this._thumbnailCache.getThumbnail("fallback");
        if (img) {
          const tileCount = Math.ceil(oneSourceSecWidth / thumbnailWidth);

          for (let t = 0; t < tileCount; t++) {
            const tileX = xStart + t * thumbnailWidth;

            if (tileX + thumbnailWidth < 0 || tileX >= this.width) continue;

            const drawX = Math.max(0, tileX);
            const drawWidth = Math.min(thumbnailWidth, this.width - drawX);
            const drawHeight = Math.min(thumbnailHeight, this.height);

            if (drawWidth > 0 && drawHeight > 0) {
              const sourceX = drawX > tileX ? drawX - tileX : 0;

              ctx.drawImage(
                img,
                sourceX,
                0,
                drawWidth,
                drawHeight, // source
                drawX,
                0,
                drawWidth,
                drawHeight, // destination
              );

              minX = Math.min(minX, drawX);
              maxX = Math.max(maxX, drawX + drawWidth);
            }
          }
        }
      }
    } else {
      const totalThumbnails = Math.ceil(this.width / thumbnailWidth);

      for (let i = 0; i < totalThumbnails; i++) {
        const x = i * thumbnailWidth;
        if (x >= this.width) break;

        const timeOffsetUs = unitsToTimeMs(x, this.timeScale, this.playbackRate || 1);
        const absoluteTimeUs = timeOffsetUs + this.trim.from;
        const secKey = Math.floor(absoluteTimeUs / MICROSECONDS_IN_SECOND);

        let img = this._thumbnailCache.getThumbnail(secKey);
        if (!img) {
          img = this._thumbnailCache.getThumbnail("fallback");
        }

        if (img) {
          // Clamp drawing to bounds
          const drawWidth = Math.min(thumbnailWidth, this.width - x);
          const drawHeight = Math.min(thumbnailHeight, this.height);

          if (drawWidth > 0 && drawHeight > 0) {
            ctx.drawImage(
              img,
              0,
              0,
              drawWidth,
              drawHeight, // source
              x,
              0,
              drawWidth,
              drawHeight, // destination
            );
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x + drawWidth);
          }
        }
      }
    }

    if (this.width > 0) {
      const isMissingEnd = maxX < this.width - 0.5;
      const isMissingStart = minX > 0.5;
      if (isMissingEnd || isMissingStart) {
        console.warn(
          `[Video Filmstrip] MISSING COVERAGE! Desired: ${this.width.toFixed(2)}, Drawn: [${minX.toFixed(2)}, ${maxX.toFixed(2)}], Strategy: ${oneSourceSecWidth >= thumbnailWidth ? "Zoomed In" : "Zoomed Out"}`,
        );
      } else {
        // console.log(
        //   `[Video Filmstrip] OK: ${this.width.toFixed(2)}, Range: [${minX.toFixed(2)}, ${maxX.toFixed(2)}], Strategy: ${oneSourceSecWidth >= thumbnailWidth ? 'Zoomed In' : 'Zoomed Out'}`
        // );
      }
    }
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const text = this.text || "";
    const seconds = Math.round(this.duration / MICROSECONDS_IN_SECOND);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    const durationText = `${m}:${s.toString().padStart(2, "0")}`;

    ctx.font = `600 11px ${editorFont.fontFamily}`;
    const paddingX = 6;
    const paddingY = 2;
    const bgHeight = 14 + paddingY * 2;
    const margin = 4;
    const blockGap = 4;

    let currentX = margin;
    const y = margin;

    const drawBlock = (content: string, isDimmed = false) => {
      const metrics = ctx.measureText(content);
      const bgWidth = metrics.width + paddingX * 2;

      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.roundRect(currentX, y, bgWidth, bgHeight, 4);
      ctx.fill();

      ctx.fillStyle = isDimmed ? "rgba(255, 255, 255, 0.5)" : "rgba(255, 255, 255, 0.9)";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(content, currentX + paddingX, y + paddingY + 1);

      currentX += bgWidth + blockGap;
    };

    if (text) {
      drawBlock(text);
    }
    drawBlock(durationText, true);
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "#ffffff" : "#3730a3";
    const borderWidth = 2;
    const radius = 6;

    ctx.save();
    ctx.fillStyle = borderColor;

    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, radius);

    ctx.roundRect(
      -this.width / 2 + borderWidth,
      -this.height / 2 + borderWidth,
      this.width - borderWidth * 2,
      this.height - borderWidth * 2,
      radius - borderWidth,
    );

    ctx.fill("evenodd");
    ctx.restore();
  }
}
