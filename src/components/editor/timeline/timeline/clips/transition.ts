import { BaseTimelineClip, BaseClipProps } from "./base";
import { Control, Path } from "fabric";

export class Transition extends BaseTimelineClip {
  isSelected: boolean;
  private arrowIcon: Path;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: {} };
  }

  static ownDefaults = {
    rx: 4,
    ry: 4,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#ffffff", // White
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };

  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Transition.ownDefaults);
    this.set({
      fill: options.fill || Transition.ownDefaults.fill,
    });

    // Arrow Left Right icon (Lucide-like)
    this.arrowIcon = new Path(
      "M 16 7 L 11 12 L 16 17 M 11 12 H 30 M 24 28 L 29 23 L 24 18 M 29 23 H 13",
      {
        stroke: "#18181b", // Dark gray/black
        strokeWidth: 1,
        fill: "transparent",
        strokeLineCap: "round",
        strokeLineJoin: "round",
        originX: "center",
        originY: "center",
        scaleX: 0.6,
        scaleY: 0.6,
        top: 0,
        left: 0,
      },
    );
  }

  public _render(ctx: CanvasRenderingContext2D) {
    // We override default render to draw a fixed 20x20 square centered
    // properly regardless of the actual clip width (duration).

    const size = 20;
    const radius = 4;

    ctx.save();

    // Draw Background
    ctx.fillStyle = this.fill as string;
    ctx.beginPath();
    ctx.roundRect(-size / 2, -size / 2, size, size, radius);
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
    const radius = 4;
    const size = 20;

    ctx.save();
    ctx.fillStyle = borderColor;

    // Create a path for the outer rectangle
    ctx.beginPath();
    ctx.roundRect(
      -size / 2 - borderWidth, // Expand outward for border
      -size / 2 - borderWidth,
      size + borderWidth * 2,
      size + borderWidth * 2,
      radius,
    );

    // Create a path for the inner rectangle (the hole)
    ctx.roundRect(-size / 2, -size / 2, size, size, radius);

    // Use even-odd fill rule to create the border effect
    ctx.fill("evenodd");
    ctx.restore();
  }
}
