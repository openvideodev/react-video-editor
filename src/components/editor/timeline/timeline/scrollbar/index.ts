import { Canvas, util, type TMat2D, type TPointerEvent } from "fabric";
import type Timeline from "../canvas";
import type { ScrollbarProps, ScrollbarsProps, ScrollbarXProps, ScrollbarYProps } from "./types";

export class Scrollbars {
  timeline: Timeline;
  fill = "rgba(255, 255, 255, 0.3)";
  stroke = "rgba(255, 255, 255, 0.1)";
  lineWidth = 1;
  hideX = false;
  hideY = false;
  scrollbarMinWidth = 40;
  scrollbarSize = 8;
  scrollSpace = 4;
  padding = 4;
  extraMarginX = 50;
  extraMarginY = 15;
  offsetX = 0;
  offsetY = 0;
  scrollbarWidth = 8;
  scrollbarColor = "rgba(255, 255, 255, 0.3)";
  onViewportChange?: (v: { left: number; scrollX: number; scrollY: number }) => void;

  private _bar?: { type: string; start: number; vpt: TMat2D };
  private _barViewport = {
    left: 1,
    right: -1,
    top: 1,
    bottom: -1,
    sx: 1,
    sy: 1,
  };

  private _originalMouseDown: any;
  private _originalMouseMove: any;
  private _originalMouseUp: any;

  constructor(timeline: Timeline, props: ScrollbarsProps = {}) {
    this.timeline = timeline;
    Object.assign(this, props);

    if (props.scrollbarWidth !== undefined) {
      this.scrollbarSize = props.scrollbarWidth;
    }
    if (props.scrollbarColor !== undefined) {
      this.fill = props.scrollbarColor;
    }

    const canvas = this.timeline.canvas;

    this._originalMouseDown = (canvas as any).__onMouseDown;
    this._originalMouseMove = (canvas as any)._onMouseMove;
    this._originalMouseUp = (canvas as any)._onMouseUp;

    (canvas as any).__onMouseDown = this.mouseDownHandler.bind(this);
    (canvas as any)._onMouseMove = this.mouseMoveHandler.bind(this);
    (canvas as any)._onMouseUp = this.mouseUpHandler.bind(this);

    this.beforeRenderHandler = this.beforeRenderHandler.bind(this);
    this.afterRenderHandler = this.afterRenderHandler.bind(this);

    this.initBehavior();
  }

  initBehavior() {
    this.timeline.canvas.on("before:render", this.beforeRenderHandler);
    this.timeline.canvas.on("after:render", this.afterRenderHandler);
  }

  getScrollbar(e: TPointerEvent) {
    const canvas = this.timeline.canvas;
    const p = canvas.getViewportPoint(e);
    const vpt = canvas.viewportTransform.slice(0) as TMat2D;

    if (!this.hideX) {
      const b =
        p.x > this._barViewport.left &&
        p.x < this._barViewport.right &&
        p.y > canvas.height - this.scrollbarSize - this.scrollSpace - this.padding &&
        p.y < canvas.height - this.scrollSpace + this.padding;

      if (b) return { type: "x", start: p.x, vpt };
    }

    if (!this.hideY) {
      const b =
        p.y > this._barViewport.top &&
        p.y < this._barViewport.bottom &&
        p.x > canvas.width - this.scrollbarSize - this.scrollSpace - this.padding &&
        p.x < canvas.width - this.scrollSpace + this.padding;

      if (b) return { type: "y", start: p.y, vpt };
    }
    return undefined;
  }

  mouseDownHandler(e: TPointerEvent) {
    this._bar = this.getScrollbar(e);
    if (!this._bar) {
      return (Canvas.prototype as any).__onMouseDown.call(this.timeline.canvas, e);
    }
  }

  mouseMoveHandler(e: TPointerEvent) {
    if (!this._bar) {
      return (Canvas.prototype as any)._onMouseMove.call(this.timeline.canvas, e);
    }

    const canvas = this.timeline.canvas;
    const p = canvas.getViewportPoint(e);
    const s = this._bar.type == "x" ? this._barViewport.sx : this._barViewport.sy;
    const n = this._bar.type == "x" ? 4 : 5;
    const end = this._bar.type == "x" ? p.x : p.y;
    const vpt = this._bar.vpt.slice(0) as TMat2D;
    vpt[n] -= (end - this._bar.start) * s;

    this.applyViewportLimits(vpt);

    canvas.setViewportTransform(vpt);

    // Update clip coords on scroll to keep controls aligned
    canvas.getObjects().forEach((obj) => {
      if (obj.hasControls) obj.setCoords();
    });

    canvas.requestRenderAll();
  }

  mouseUpHandler(e: TPointerEvent) {
    if (!this._bar) {
      (Canvas.prototype as any)._onMouseUp.call(this.timeline.canvas, e);
    }
    delete this._bar;
  }

  beforeRenderHandler() {
    const ctx = this.timeline.canvas.contextTop;
    if (!ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
  }

  afterRenderHandler() {
    const canvas = this.timeline.canvas;
    const { tl, br } = canvas.calcViewportBoundaries();
    const mapRect = { left: tl.x, top: tl.y, right: br.x, bottom: br.y };
    const objectRect = this.getObjectsBoundingRect();

    const objectRectWithMargin = {
      left: Math.min(objectRect.left, -this.offsetX),
      top: Math.min(objectRect.top, -this.offsetY),
      right: objectRect.right + this.extraMarginX,
      bottom: Math.max(objectRect.bottom, this.timeline.totalTracksHeight) + this.extraMarginY,
    };

    if (objectRectWithMargin.left > mapRect.left) objectRectWithMargin.left = mapRect.left;
    if (objectRectWithMargin.top > mapRect.top) objectRectWithMargin.top = mapRect.top;
    if (objectRectWithMargin.bottom < mapRect.bottom) objectRectWithMargin.bottom = mapRect.bottom;
    if (objectRectWithMargin.right < mapRect.right) objectRectWithMargin.right = mapRect.right;

    const ctx = canvas.contextTop;
    if (ctx) {
      this.render(ctx, mapRect, objectRectWithMargin);
    }

    if (this.onViewportChange) {
      const vpt = canvas.viewportTransform;
      const scrollX = -vpt[4] + this.offsetX;
      const scrollY = -vpt[5] + this.offsetY;

      if (
        Math.abs(scrollX - (this._lastScrollX || 0)) > 0.1 ||
        Math.abs(scrollY - (this._lastScrollY || 0)) > 0.1
      ) {
        this._lastScrollX = scrollX;
        this._lastScrollY = scrollY;
        this.onViewportChange({ left: tl.x, scrollX, scrollY });
      }
    }
  }

  private _lastScrollX = 0;
  private _lastScrollY = 0;

  render(ctx: CanvasRenderingContext2D, mapRect: ScrollbarProps, objectRect: ScrollbarProps) {
    const canvas = this.timeline.canvas;
    // Clear only scrollbar areas
    if (!this.hideX) {
      ctx.clearRect(
        0,
        canvas.height - this.scrollbarSize - this.scrollSpace - this.lineWidth,
        canvas.width,
        this.scrollbarSize + this.scrollSpace + this.lineWidth,
      );
    }

    if (!this.hideY) {
      ctx.clearRect(
        canvas.width - this.scrollbarSize - this.scrollSpace - this.lineWidth,
        0,
        this.scrollbarSize + this.scrollSpace + this.lineWidth,
        canvas.height,
      );
    }

    ctx.save();
    ctx.fillStyle = this.fill;
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.lineWidth;

    if (!this.hideX) this.drawScrollbarX(ctx, mapRect, objectRect);
    if (!this.hideY) this.drawScrollbarY(ctx, mapRect, objectRect);

    ctx.restore();
  }

  drawScrollbarX(
    ctx: CanvasRenderingContext2D,
    mapRect: ScrollbarXProps,
    objectRect: ScrollbarXProps,
  ) {
    const canvas = this.timeline.canvas;
    const mapWidth = mapRect.right - mapRect.left;
    const objectWidth = objectRect.right - objectRect.left;
    if (mapWidth >= objectWidth) {
      this._barViewport.left = 1;
      this._barViewport.right = -1;
      this._barViewport.sx = 1;
      return;
    }

    const scaleX = Math.min(mapWidth / objectWidth, 1);
    const w = canvas.width - this.scrollbarSize - this.scrollSpace * 2;
    const width = Math.max((w * scaleX) | 0, this.scrollbarMinWidth);
    const left = ((mapRect.left - objectRect.left) / (objectWidth - mapWidth)) * (w - width);

    const x = this.scrollSpace + left;
    const y = canvas.height - this.scrollbarSize - this.scrollSpace;
    this._barViewport.left = x;
    this._barViewport.right = x + width;
    this._barViewport.sx = objectWidth / mapWidth;

    this.drawRect(ctx, {
      x,
      y,
      w: width,
      h: this.scrollbarSize,
    });
  }

  drawScrollbarY(
    ctx: CanvasRenderingContext2D,
    mapRect: ScrollbarYProps,
    objectRect: ScrollbarYProps,
  ) {
    const canvas = this.timeline.canvas;
    const mapHeight = mapRect.bottom - mapRect.top;
    const objectHeight = objectRect.bottom - objectRect.top;
    if (mapHeight >= objectHeight) {
      this._barViewport.top = 1;
      this._barViewport.bottom = -1;
      this._barViewport.sy = 1;
      return;
    }

    const scaleY = Math.min(mapHeight / objectHeight, 1);
    const h = canvas.height - this.scrollbarSize - this.scrollSpace * 2;
    const height = Math.max((h * scaleY) | 0, this.scrollbarMinWidth);
    const top = ((mapRect.top - objectRect.top) / (objectHeight - mapHeight)) * (h - height);

    const x = canvas.width - this.scrollbarSize - this.scrollSpace;
    const y = this.scrollSpace + top;
    this._barViewport.top = y;
    this._barViewport.bottom = y + height;
    this._barViewport.sy = objectHeight / mapHeight;
    this.drawRect(ctx, {
      x,
      y,
      w: this.scrollbarSize,
      h: height,
    });
  }

  drawRect(ctx: CanvasRenderingContext2D, props: { x: number; y: number; w: number; h: number }) {
    const { x, y, w, h } = props;
    const r = Math.min(w, h) / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  getObjectsBoundingRect() {
    const objects = this.timeline.canvas.getObjects().filter((x: any) => x.studioClipId);
    if (objects.length === 0) {
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }
    const { left, top, width, height } = util.makeBoundingBoxFromPoints(
      objects.map((x) => x.getCoords()).flat(1),
    );
    return { left, top, right: left + width, bottom: top + height };
  }

  applyViewportLimits(vpt: TMat2D) {
    const canvas = this.timeline.canvas;
    const zoom = vpt[0];

    const objectRect = this.getObjectsBoundingRect();

    const totalAreaLeft = Math.min(objectRect.left, -this.offsetX);
    const totalAreaTop = Math.min(objectRect.top, -this.offsetY);
    const totalAreaRight = objectRect.right + this.extraMarginX;
    const totalAreaBottom =
      Math.max(objectRect.bottom, this.timeline.totalTracksHeight) + this.extraMarginY;

    const totalWidth = totalAreaRight - totalAreaLeft;
    const totalHeight = totalAreaBottom - totalAreaTop;

    const canvasWidth = canvas.width / zoom;
    const canvasHeight = canvas.height / zoom;

    if (totalWidth <= canvasWidth) {
      vpt[4] = -totalAreaLeft * zoom;
    } else {
      const maxScrollLeft = this.offsetX * zoom;
      if (vpt[4] > maxScrollLeft) vpt[4] = maxScrollLeft;

      const minScrollRight = -(totalAreaRight * zoom - canvas.width);
      if (minScrollRight < 0 && vpt[4] < minScrollRight) {
        vpt[4] = minScrollRight;
      }
    }

    if (totalHeight <= canvasHeight) {
      vpt[5] = -totalAreaTop * zoom;
    } else {
      const maxScrollTop = this.offsetY * zoom;
      if (vpt[5] > maxScrollTop) vpt[5] = maxScrollTop;

      const minScrollBottom = -(totalAreaBottom * zoom - canvas.height);
      if (minScrollBottom < 0 && vpt[5] < minScrollBottom) {
        vpt[5] = minScrollBottom;
      }
    }
  }

  dispose() {
    const canvas = this.timeline.canvas;
    if (this._originalMouseDown) {
      (canvas as any).__onMouseDown = this._originalMouseDown;
    }
    if (this._originalMouseMove) {
      (canvas as any)._onMouseMove = this._originalMouseMove;
    }
    if (this._originalMouseUp) {
      (canvas as any)._onMouseUp = this._originalMouseUp;
    }

    canvas.off("before:render", this.beforeRenderHandler);
    canvas.off("after:render", this.afterRenderHandler);
  }

  updateColors(fill: string, stroke: string) {
    this.fill = fill;
    this.stroke = stroke;
    this.timeline.canvas.requestRenderAll();
  }
}
