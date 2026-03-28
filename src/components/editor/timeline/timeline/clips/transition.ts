import { BaseTimelineClip, BaseClipProps } from "./base";
import { Control, Path } from "fabric";
import { createTransitionControls } from "../controls";

export class Transition extends BaseTimelineClip {
  public isTransitionClip = true;
  isSelected: boolean;
  private arrowIcon: Path;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createTransitionControls() };
  }

  static ownDefaults = {
    rx: 4,
    ry: 4,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#000000",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
    lockMovementX: true,
    lockMovementY: true,
  };

  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Transition.ownDefaults);
    this.set({
      fill: options.fill || Transition.ownDefaults.fill,
    });

    // Arrow Left Right icon (Lucide-like)
    this.arrowIcon = new Path(
      "M3 5.30359C3 3.93159 4.659 3.24359 5.629 4.21359L11.997 10.5826L10.583 11.9966L5 6.41359V17.5856L10.586 11.9996L10.583 11.9966L11.997 10.5826L12 10.5856L18.371 4.21459C19.341 3.24459 21 3.93159 21 5.30359V18.6956C21 20.0676 19.341 20.7556 18.371 19.7856L12 13.5L13.414 11.9996L19 17.5866V6.41359L13.414 11.9996L13.421 12.0056L12.006 13.4206L12 13.4136L5.629 19.7846C4.659 20.7546 3 20.0676 3 18.6956V5.30359Z",
      {
        stroke: "white",
        strokeWidth: 1.5,
        fill: "transparent",
        strokeLineCap: "round",
        strokeLineJoin: "round",
        originX: "center",
        originY: "center",
        scaleX: 0.8,
        scaleY: 0.8,
        top: 0,
        left: 0,
      },
    );
  }

  public _render(ctx: CanvasRenderingContext2D) {
    // Use the object's width and height determined by duration and track height
    const width = this.width;
    const height = this.height;
    const radius = this.rx || 4;

    ctx.save();

    // Draw Background
    ctx.fillStyle = this.fill as string;
    ctx.beginPath();
    ctx.roundRect(-width / 2, -height / 2, width, height, radius);
    ctx.fill();

    // Draw Icon
    // Fabric objects render applies their own transform.
    // Since ctx is already at center, and arrowIcon is at 0,0 locally, this works.
    this.arrowIcon.render(ctx);

    ctx.restore();

    this.updateSelected(ctx);
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "rgba(200, 200, 200, 1.0)" : "rgba(0, 0, 0, 0.5)";
    const borderWidth = 2;
    const radius = this.rx || 4;
    const width = this.width;
    const height = this.height;

    ctx.save();
    ctx.fillStyle = borderColor;

    ctx.beginPath();
    ctx.roundRect(
      -width / 2 - borderWidth,
      -height / 2 - borderWidth,
      width + borderWidth * 2,
      height + borderWidth * 2,
      radius,
    );

    ctx.roundRect(-width / 2, -height / 2, width, height, radius);

    ctx.fill("evenodd");

    ctx.restore();
  }
}
