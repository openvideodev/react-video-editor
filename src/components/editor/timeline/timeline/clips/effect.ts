import { BaseTimelineClip, BaseClipProps } from "./base";
import { Control } from "fabric";
import { createResizeControls } from "../controls";
import { editorFont } from "@/components/editor/constants";

export class Effect extends BaseTimelineClip {
  isSelected: boolean;
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  static ownDefaults = {
    rx: 10,
    ry: 10,
    objectCaching: false,
    borderColor: "transparent",
    stroke: "transparent",
    strokeWidth: 0,
    fill: "#7c2d12",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };
  constructor(options: BaseClipProps) {
    super(options);
    Object.assign(this, Effect.ownDefaults);
    this.set({
      // fill: options.fill || TRACK_COLORS.effect.solid,
    });
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawIdentity(ctx: CanvasRenderingContext2D) {
    const svgPath = new Path2D(
      "M9.68569 9.66541C9.89548 9.45253 10.2365 9.4515 10.4473 9.66328L12.8416 12.0704C13.0523 12.2824 13.0528 12.6268 12.843 12.8397C12.6331 13.0525 12.2921 13.0537 12.0814 12.8418L9.68779 10.4347C9.47711 10.2229 9.47622 9.87838 9.68569 9.66541ZM9.06292 0.0702502C9.23195 -0.0261934 9.43941 -0.0230872 9.60574 0.0780425C9.77204 0.179214 9.87193 0.363034 9.86662 0.55904L9.76283 4.28801L12.5028 6.80422C12.6467 6.93648 12.7091 7.1369 12.6656 7.32843C12.6218 7.52005 12.4786 7.67334 12.2918 7.72867L8.7312 8.78275L7.19814 12.1809C7.11758 12.359 6.94809 12.4797 6.75491 12.4968C6.56168 12.5139 6.37396 12.4245 6.264 12.2631L4.16708 9.18441L0.478897 8.76788C0.285491 8.746 0.118599 8.62019 0.0426821 8.43918C-0.0331031 8.25826 -0.00676252 8.0499 0.112112 7.89443L2.37524 4.93831L1.63045 1.28443C1.59136 1.09227 1.65797 0.893382 1.80437 0.764473C1.95089 0.635713 2.15499 0.59694 2.33807 0.662465L5.8341 1.91348L9.06292 0.0702502ZM6.15109 2.98315C6.01542 3.06053 5.85332 3.07469 5.70646 3.02212L2.87737 2.00912L3.4805 4.96452C3.51203 5.11979 3.47481 5.28116 3.37881 5.40656L1.5505 7.79384L4.53176 8.13103L4.58927 8.14024C4.72128 8.17001 4.83791 8.24964 4.91538 8.36338L6.61185 10.8541L7.85316 8.10553L7.88052 8.05311C7.94966 7.93553 8.06062 7.84763 8.1919 7.80871L11.068 6.95652L8.85534 4.92485C8.73942 4.81826 8.67502 4.66589 8.67931 4.50761L8.76276 1.49199L6.15109 2.98315Z",
    );

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 8);
    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText("Effect", 36, 12);

    ctx.translate(8, 1);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fill(svgPath);
    ctx.restore();
  }

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }
  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "#c2410c" : "#9a3412";
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
}
