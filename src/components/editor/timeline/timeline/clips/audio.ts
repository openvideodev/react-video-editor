import { BaseTimelineClip, BaseClipProps } from "./base";
import { Control } from "fabric";
import { createTrimControls } from "../controls";
import { editorFont } from "@/components/editor/constants";

export class Audio extends BaseTimelineClip {
  isSelected: boolean;
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTrimControls() };
  }

  static ownDefaults = {
    rx: 10,
    ry: 10,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#1e3a8a",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };

  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Audio.ownDefaults);
    this.text = options.text;
    this.set({
      // fill: options.fill || TRACK_COLORS.audio.solid,
      fill: "#1e3a8a",
    });
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const svgPath = new Path2D(
      "M13.9326 0C14.264 0 14.5332 0.268239 14.5332 0.599609V11.4326L14.5293 11.5869C14.4912 12.353 14.17 13.08 13.625 13.625C13.0436 14.2064 12.2548 14.5332 11.4326 14.5332C10.6106 14.5331 9.82248 14.2062 9.24121 13.625C8.65985 13.0436 8.33301 12.2548 8.33301 11.4326C8.33309 10.6106 8.65992 9.8225 9.24121 9.24121C9.8225 8.65992 10.6106 8.33309 11.4326 8.33301C12.125 8.33301 12.792 8.56695 13.333 8.9873V4.5332H6.19922V11.4326C6.19922 12.2547 5.87325 13.0437 5.29199 13.625C4.71063 14.2064 3.92178 14.5332 3.09961 14.5332C2.27744 14.5332 1.48859 14.2064 0.907227 13.625C0.325965 13.0437 0 12.2547 0 11.4326C8.61069e-05 10.6107 0.326144 9.82247 0.907227 9.24121C1.48859 8.65985 2.27744 8.33301 3.09961 8.33301C3.79208 8.33301 4.45894 8.56685 5 8.9873V0.599609C5 0.268239 5.26824 0 5.59961 0H13.9326ZM3.09961 9.5332C2.5957 9.5332 2.11218 9.73352 1.75586 10.0898C1.39982 10.4461 1.1993 10.929 1.19922 11.4326C1.19922 11.9365 1.39964 12.4201 1.75586 12.7764C2.11218 13.1327 2.5957 13.333 3.09961 13.333C3.60352 13.333 4.08704 13.1327 4.44336 12.7764C4.79958 12.4201 5 11.9365 5 11.4326C4.99991 10.929 4.7994 10.4461 4.44336 10.0898C4.08704 9.73352 3.60352 9.5332 3.09961 9.5332ZM11.4326 9.5332C10.9288 9.53329 10.4461 9.7336 10.0898 10.0898C9.7336 10.4461 9.53329 10.9288 9.5332 11.4326C9.5332 11.9365 9.73352 12.42 10.0898 12.7764C10.4461 13.1325 10.9289 13.3329 11.4326 13.333C11.9365 13.333 12.42 13.1327 12.7764 12.7764C13.1327 12.42 13.333 11.9365 13.333 11.4326C13.3329 10.9289 13.1325 10.4461 12.7764 10.0898C12.42 9.73352 11.9365 9.5332 11.4326 9.5332ZM6.19922 3.33301H13.333V1.19922H6.19922V3.33301Z",
    );

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 8);
    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText(this.text || "", 36, 12);

    ctx.translate(8, 1);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fill(svgPath);
    ctx.restore();
  }
  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "#3b82f6" : "#1d4ed8";
    const borderWidth = 2;
    const radius = 10;

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
  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }
}
