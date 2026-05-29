import {
  Control,
  Pattern,
  Trimmable,
  TrimmableProps,
  timeUsToUnits,
  unitsToTimeUs,
} from "@openvideo/timeline";
import { Filmstrip, FilmstripBacklogOptions } from "../types";
import ThumbnailCache from "../../utils/thumbnail-cache";
import { IDisplay, IMetadata, ITrim } from "@openvideo/timeline";
import { calculateOffscreenSegments, calculateThumbnailSegmentLayout } from "../../utils/filmstrip";
import { createMediaControls } from "../controls";
import { SECONDARY_FONT } from "../../constants/constants";
import { extractFrames } from "../../utils/mediabunny";

const EMPTY_FILMSTRIP: Filmstrip = {
  offset: 0,
  startTime: 0,
  thumbnailsCount: 0,
  widthOnScreen: 0,
};

interface VideoProps extends TrimmableProps {
  aspectRatio: number;
  trim: ITrim;
  duration: number;
  src: string;
  metadata?: Partial<IMetadata> & {
    previewUrl?: string;
  };
  preview?: string;
}
class Video extends Trimmable {
  static type = "Video";
  public extractFramesController: AbortController | null = null;
  declare id: string;
  public resourceId = "";
  declare tScale: number;
  public isSelected = false;
  declare display: IDisplay;
  declare trim: ITrim;
  declare playbackRate: number;
  public hasSrc = true;
  declare duration: number;
  public prevDuration: number;
  public itemType = "video";
  public metadata?: Partial<IMetadata>;
  declare src: string;

  public aspectRatio = 1;
  public scrollLeft = 0;
  public filmstripBacklogOptions?: FilmstripBacklogOptions;
  public thumbnailsPerSegment = 0;
  public segmentSize = 0;

  public offscreenSegments = 0;
  public thumbnailWidth = 0;
  public thumbnailHeight = 48;
  public thumbnailsList: { url: string; ts: number }[] = [];
  public isFetchingThumbnails = false;
  public thumbnailCache = new ThumbnailCache();

  public currentFilmstrip: Filmstrip = EMPTY_FILMSTRIP;
  public nextFilmstrip: Filmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
  public loadingFilmstrip: Filmstrip = EMPTY_FILMSTRIP;

  private offscreenCanvas: OffscreenCanvas | null = null;
  private offscreenCtx: OffscreenCanvasRenderingContext2D | null = null;

  private isDirty = true;

  private fallbackSegmentIndex = 0;
  private fallbackSegmentsCount = 0;
  private previewUrl = "";

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createMediaControls() };
  }

  constructor(props: VideoProps) {
    super(props);
    console.warn("Props", props);
    this.id = props.id;
    this.tScale = props.tScale;
    this.objectCaching = false;
    this.rx = 0;
    this.ry = 0;
    this.display = props.display;
    this.trim = props.trim;
    this.duration = props.duration;
    this.prevDuration = props.duration;
    this.fill = "#27272a";
    this.borderOpacityWhenMoving = 1;
    this.metadata = props.metadata;

    this.aspectRatio = props.aspectRatio;

    this.src = props.src;
    this.strokeWidth = 0;

    this.transparentCorners = false;
    this.hasBorders = false;

    this.previewUrl = props.preview || props.metadata?.previewUrl || "";
    this.initOffscreenCanvas();
    this.initialize();
  }

  private initOffscreenCanvas() {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }

    // Resize if dimensions changed
    if (this.offscreenCanvas.width !== this.width || this.offscreenCanvas.height !== this.height) {
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.isDirty = true;
    }
  }

  public initDimensions() {
    this.thumbnailWidth = this.thumbnailHeight * this.aspectRatio;

    const segmentOptions = calculateThumbnailSegmentLayout(this.thumbnailWidth);
    this.thumbnailsPerSegment = segmentOptions.thumbnailsPerSegment;
    this.segmentSize = segmentOptions.segmentSize;
  }

  public async initialize() {
    await this.loadFallbackThumbnail();

    this.initDimensions();
    this.onScrollChange({ scrollLeft: 0 });

    this.canvas?.requestRenderAll();

    this.createFallbackPattern();

    this.onScrollChange({ scrollLeft: 0 });
  }

  public async prepareAssets() {
    // With mediabunny, we don't need to pre-initialize the clip.
    // The extractFrames function handles source loading dynamically.
  }

  private calculateFilmstripDimensions({
    segmentIndex,
    widthOnScreen,
  }: {
    segmentIndex: number;
    widthOnScreen: number;
  }) {
    const filmstripOffset = segmentIndex * this.segmentSize;
    const shouldUseLeftBacklog = segmentIndex > 0;
    const leftBacklogSize = shouldUseLeftBacklog ? this.segmentSize : 0;

    const totalWidth = timeUsToUnits(this.duration, this.tScale, this.playbackRate);

    const rightRemainingSize = totalWidth - widthOnScreen - leftBacklogSize - filmstripOffset;
    const rightBacklogSize = Math.min(this.segmentSize, rightRemainingSize);

    const filmstripStartTime = unitsToTimeUs(filmstripOffset, this.tScale);
    const filmstrimpThumbnailsCount =
      1 + Math.round((widthOnScreen + leftBacklogSize + rightBacklogSize) / this.thumbnailWidth);

    return {
      filmstripOffset,
      leftBacklogSize,
      rightBacklogSize,
      filmstripStartTime,
      filmstrimpThumbnailsCount,
    };
  }

  // load fallback thumbnail, resize it and cache it
  private async loadFallbackThumbnail() {
    let fallbackThumbnail = this.previewUrl;

    // If no preview URL provided, extract a frame from the video source
    if (!fallbackThumbnail && this.src) {
      fallbackThumbnail = await this.extractPreviewFrame();
      this.previewUrl = fallbackThumbnail;
    }

    if (!fallbackThumbnail) return;

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      // Only add cache-busting for HTTP URLs, not data URLs
      const isDataUrl = fallbackThumbnail.startsWith("data:");
      img.src = isDataUrl ? fallbackThumbnail : `${fallbackThumbnail}?t=${Date.now()}`;
      img.onload = () => {
        // Create a temporary canvas to resize the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Calculate new width maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        const targetHeight = 40;
        const targetWidth = Math.round(targetHeight * aspectRatio);
        // Set canvas size and draw resized image
        canvas.height = targetHeight;
        canvas.width = targetWidth;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Create new image from resized canvas
        const resizedImg = new Image();
        resizedImg.src = canvas.toDataURL();
        // Update aspect ratio and cache the resized image
        this.aspectRatio = aspectRatio;
        this.thumbnailWidth = targetWidth;
        this.thumbnailCache.setThumbnail("fallback", resizedImg);
        resolve();
      };
    });
  }

  private async extractPreviewFrame(): Promise<string> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const { signal } = controller;

      // Set a timeout to abort if it takes too long
      const timeout = setTimeout(() => controller.abort(), 30000);

      extractFrames({
        src: this.src,
        timestampsInSeconds: [0.1], // Extract at 100ms to avoid any black frames at start
        signal,
        onVideoSample: (sample) => {
          clearTimeout(timeout);

          using frame = sample;
          const canvas = document.createElement("canvas");
          canvas.width = frame.displayWidth;
          canvas.height = frame.displayHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Failed to get canvas context"));
            return;
          }

          frame.draw(ctx, 0, 0);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        },
      }).catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  private generateTimestamps(startTime: number, count: number): number[] {
    const timePerThumbnail = unitsToTimeUs(this.thumbnailWidth, this.tScale, this.playbackRate);

    return Array.from({ length: count }, (_, i) => {
      const timeInFilmstripe = startTime + i * timePerThumbnail;
      return Math.ceil(timeInFilmstripe / 1000);
    });
  }

  private createFallbackPattern() {
    const canvas = this.canvas;
    if (!canvas) return;

    const canvasWidth = canvas.width;
    const maxPatternSize = 12000;
    const fallbackSource = this.thumbnailCache.getThumbnail("fallback");

    if (!fallbackSource) return;

    // Compute the total width and number of segments needed
    const totalWidthNeeded = Math.min(canvasWidth * 20, maxPatternSize);
    const segmentsRequired = Math.ceil(totalWidthNeeded / this.segmentSize);
    this.fallbackSegmentsCount = segmentsRequired;
    const patternWidth = segmentsRequired * this.segmentSize;

    // Setup canvas dimensions
    const offCanvas = document.createElement("canvas");
    offCanvas.height = this.thumbnailHeight;
    offCanvas.width = patternWidth;

    const context = offCanvas.getContext("2d");
    if (!context) return;
    const thumbnailsTotal = segmentsRequired * this.thumbnailsPerSegment;

    // Draw the fallback image across the entirety of the canvas horizontally
    for (let i = 0; i < thumbnailsTotal; i++) {
      const x = i * this.thumbnailWidth;
      context.drawImage(fallbackSource, x, 0, this.thumbnailWidth, this.thumbnailHeight);
    }

    // Create the pattern and apply it
    const fillPattern = new Pattern({
      source: offCanvas,
      repeat: "no-repeat",
      offsetX: 0,
    });

    this.set("fill", fillPattern);
    this.canvas?.requestRenderAll();
  }
  public async loadAndRenderThumbnails() {
    if (this.isFetchingThumbnails) return;
    this.isFetchingThumbnails = true;

    // Abort previous extraction if any
    if (this.extractFramesController) {
      this.extractFramesController.abort();
    }
    this.extractFramesController = new AbortController();
    const { signal } = this.extractFramesController;

    this.loadingFilmstrip = { ...this.nextFilmstrip };
    const { startTime, thumbnailsCount } = this.loadingFilmstrip;
    const timestampsInMs = this.generateTimestamps(startTime, thumbnailsCount);

    // extractFrames expects seconds
    const timestampsInSeconds = timestampsInMs.map((ts) => ts / 1000);

    try {
      await extractFrames({
        src: this.src,
        timestampsInSeconds,
        signal,
        onVideoSample: (sample) => {
          using frame = sample;
          const timestampMs = Math.round(frame.timestamp * 1000);
          if (this.thumbnailCache.getThumbnail(timestampMs)) return;

          const canvas = document.createElement("canvas");
          canvas.width = this.thumbnailWidth;
          canvas.height = this.thumbnailHeight;
          const ctx = canvas.getContext("2d");

          if (!ctx) return;

          // Draw and scale to fit the thumbnail dimensions
          ctx.save();
          const scaleX = this.thumbnailWidth / frame.displayWidth;
          const scaleY = this.thumbnailHeight / frame.displayHeight;
          ctx.scale(scaleX, scaleY);
          frame.draw(ctx, 0, 0);
          ctx.restore();

          const img = new Image();
          img.src = canvas.toDataURL();
          this.thumbnailCache.setThumbnail(timestampMs, img);

          this.isDirty = true;
          this.canvas?.requestRenderAll();
        },
      });

      this.currentFilmstrip = { ...this.loadingFilmstrip };
    } catch (error: any) {
      if (error.name === "AbortError" || error.message === "Aborted") {
        // Normal cancellation
      } else {
        console.error("Failed to extract frames:", error);
      }
    } finally {
      this.isFetchingThumbnails = false;
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Clip the area to prevent drawing outside
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    this.renderToOffscreen();
    if (Math.floor(this.width) === 0) return;
    if (!this.offscreenCanvas) return;
    ctx.drawImage(this.offscreenCanvas, 0, 0);

    ctx.restore();
    // this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  public setDuration(duration: number) {
    this.duration = duration;
    this.prevDuration = duration;
  }

  public async setSrc(src: string) {
    super.setSrc(src);
    await this.initialize();
    await this.prepareAssets();
    this.thumbnailCache.clearCacheButFallback();
    this.onScale();
  }
  public onResizeSnap() {
    this.renderToOffscreen(true);
  }
  public onResize() {
    this.renderToOffscreen(true);
  }

  public renderToOffscreen(force?: boolean) {
    if (!this.offscreenCtx) return;
    if (!this.isDirty && !force) return;

    if (!this.offscreenCanvas) return;
    this.offscreenCanvas.width = this.width;
    const ctx = this.offscreenCtx;
    const { startTime, offset, thumbnailsCount } = this.currentFilmstrip;
    const thumbnailWidth = this.thumbnailWidth;
    const thumbnailHeight = this.thumbnailHeight;
    // Calculate the offset caused by the trimming
    const trimFromSize = timeUsToUnits(this.trim.from, this.tScale, this.playbackRate);

    let timeInFilmstripe = startTime;
    const timePerThumbnail = unitsToTimeUs(thumbnailWidth, this.tScale, this.playbackRate || 1);

    // Clear the offscreen canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Clip with rounded corners
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, this.rx);
    ctx.clip();
    // Draw thumbnails
    for (let i = 0; i < thumbnailsCount; i++) {
      let img = this.thumbnailCache.getThumbnail(Math.ceil(timeInFilmstripe / 1000));

      if (!img) {
        img = this.thumbnailCache.getThumbnail("fallback");
      }

      if (img?.complete) {
        const xPosition = i * thumbnailWidth + offset - trimFromSize;

        ctx.drawImage(img, xPosition, 0, thumbnailWidth, thumbnailHeight);
        timeInFilmstripe += timePerThumbnail;
      }
    }

    this.isDirty = false;
  }

  public drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const iconPath = new Path2D(
      "M16.5625 0.925L12.5 3.275V0.625L11.875 0H0.625L0 0.625V9.375L0.625 10H11.875L12.5 9.375V6.875L16.5625 9.2125L17.5 8.625V1.475L16.5625 0.925ZM11.25 8.75H1.25V1.25H11.25V8.75ZM16.25 7.5L12.5 5.375V4.725L16.25 2.5V7.5Z",
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 14);
    ctx.font = `400 12px ${SECONDARY_FONT}`;
    ctx.fillStyle = "#f4f4f5";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText("Video", 36, 10);

    ctx.translate(8, 1);

    ctx.fillStyle = "#f4f4f5";
    ctx.fill(iconPath);
    ctx.restore();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "rgba(255, 255, 255,1.0)" : "rgba(255, 255, 255,0.05)";
    const borderWidth = 1.5;
    const innerRadius = 0;

    ctx.save();
    ctx.fillStyle = borderColor;

    // Create a path for the outer rectangle (no radius)
    ctx.beginPath();
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);

    // Create a path for the inner rectangle with rounded corners (the hole)
    ctx.roundRect(
      -this.width / 2 + borderWidth,
      -this.height / 2 + borderWidth,
      this.width - borderWidth * 2,
      this.height - borderWidth * 2,
      innerRadius,
    );

    // Use even-odd fill rule to create the border effect
    ctx.fill("evenodd");
    ctx.restore();
  }

  public calulateWidthOnScreen() {
    const canvasEl = document.getElementById("designcombo-timeline-canvas");
    const canvasWidth = canvasEl?.clientWidth;
    const scrollLeft = this.scrollLeft;
    if (!canvasWidth) return 0;
    const timelineWidth = canvasWidth;
    const cutFromBottomEdge = Math.max(timelineWidth - (this.width + this.left + scrollLeft), 0);
    const visibleHeight = Math.min(timelineWidth - this.left - scrollLeft, timelineWidth);

    return Math.max(visibleHeight - cutFromBottomEdge, 0);
  }

  // Calculate the width that is not visible on the screen measured from the left
  public calculateOffscreenWidth({ scrollLeft }: { scrollLeft: number }) {
    const offscreenWidth = Math.min(this.left + scrollLeft, 0);

    return Math.abs(offscreenWidth);
  }

  public onScrollChange({ scrollLeft, force }: { scrollLeft: number; force?: boolean }) {
    const offscreenWidth = this.calculateOffscreenWidth({ scrollLeft });
    const trimFromSize = timeUsToUnits(this.trim.from, this.tScale, this.playbackRate);

    const offscreenSegments = calculateOffscreenSegments(
      offscreenWidth,
      trimFromSize,
      this.segmentSize,
    );

    this.offscreenSegments = offscreenSegments;

    // calculate start segment to draw
    const segmentToDraw = offscreenSegments;

    if (this.currentFilmstrip.segmentIndex === segmentToDraw) {
      return false;
    }

    if (segmentToDraw !== this.fallbackSegmentIndex) {
      const fillPattern = this.fill as Pattern;
      if (fillPattern instanceof Pattern) {
        fillPattern.offsetX =
          this.segmentSize * (segmentToDraw - Math.floor(this.fallbackSegmentsCount / 2));
      }

      this.fallbackSegmentIndex = segmentToDraw;
    }
    if (!this.isFetchingThumbnails || force) {
      this.scrollLeft = scrollLeft;
      const widthOnScreen = this.calulateWidthOnScreen();
      // With these lines:
      const { filmstripOffset, filmstripStartTime, filmstrimpThumbnailsCount } =
        this.calculateFilmstripDimensions({
          widthOnScreen: this.calulateWidthOnScreen(),
          segmentIndex: segmentToDraw,
        });

      this.nextFilmstrip = {
        segmentIndex: segmentToDraw,
        offset: filmstripOffset,
        startTime: filmstripStartTime,
        thumbnailsCount: filmstrimpThumbnailsCount,
        widthOnScreen,
      };

      this.loadAndRenderThumbnails();
    }
  }
  public onScale() {
    this.currentFilmstrip = { ...EMPTY_FILMSTRIP };
    this.nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
    this.loadingFilmstrip = { ...EMPTY_FILMSTRIP };
    this.onScrollChange({ scrollLeft: this.scrollLeft, force: true });
  }
}

export default Video;
