import { BaseTimelineClip, BaseClipProps } from "./base";
import { createResizeControls } from "../controls";
import { Control, util } from "fabric";
import { editorFont } from "@/components/editor/constants";
import { unitsToTimeMs } from "../utils/filmstrip";

const MICROSECONDS_IN_SECOND = 1_000_000;

export class Image extends BaseTimelineClip {
  private _imgElement: HTMLImageElement | null = null;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  static ownDefaults = {
    rx: 6,
    ry: 6,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#164e63",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };

  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Image.ownDefaults);
    if (this.src) {
      this.loadImage();
    }
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Apply global rounded clip for thumbnails and identity
    const radius = this.rx || 6;
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, radius);
    ctx.clip();

    this.drawFilmstrip(ctx);
    this.drawIdentity(ctx);
    ctx.restore();

    this.updateSelected(ctx);
  }

  private async loadImage() {
    if (!this.src) return;
    try {
      const img = await util.loadImage(this.src);
      this._imgElement = img;
      this.set({ dirty: true });
      this.canvas?.requestRenderAll();
    } catch (error) {
      console.error("Failed to load image for timeline clip:", error);
    }
  }

  private drawFilmstrip(ctx: CanvasRenderingContext2D) {
    if (!this._imgElement) return;

    const imgHeight = this._imgElement.height;
    const imgWidth = this._imgElement.width;
    const scale = this.height / imgHeight;
    const thumbnailWidth = imgWidth * scale;
    const thumbnailHeight = this.height;

    const count = Math.ceil(this.width / thumbnailWidth);
    for (let i = 0; i < count; i++) {
      ctx.drawImage(this._imgElement, i * thumbnailWidth, 0, thumbnailWidth, thumbnailHeight);
    }
  }

  public setSrc(src: string) {
    this.src = src;
    this.loadImage();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const text = this.text || this.src?.split("/").pop() || "";
    const durationUs = unitsToTimeMs(this.width, this.timeScale, 1);
    const seconds = Math.round(durationUs / MICROSECONDS_IN_SECOND);
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

    // Helper to draw a text block with background
    const drawBlock = (content: string, isDimmed = false) => {
      const metrics = ctx.measureText(content);
      const bgWidth = metrics.width + paddingX * 2;

      // Draw background
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.roundRect(currentX, y, bgWidth, bgHeight, 4);
      ctx.fill();

      // Draw text
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
    const borderColor = this.isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.1)";
    const borderWidth = 2;
    const radius = 6;

    ctx.save();
    ctx.fillStyle = borderColor;

    // Create a path for the outer rectangle
    ctx.beginPath();
    ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, radius);

    // Create a path for the inner rectangle (the hole)
    ctx.roundRect(
      -this.width / 2 + borderWidth,
      -this.height / 2 + borderWidth,
      this.width - borderWidth * 2,
      this.height - borderWidth * 2,
      radius - borderWidth,
    );

    // Use even-odd fill rule to create the border effect
    ctx.fill("evenodd");
    ctx.restore();
  }
}
