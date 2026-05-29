import { Control, Resizable, ResizableProps } from "@openvideo/timeline";
import { editorFont } from "@/components/editor/constants";
import { createResizeControls } from "../controls";

interface EffectProps extends ResizableProps {
  name: string;
  effect: {
    key: string;
    name: string;
  };
}

class Effect extends Resizable {
  static type = "Effect";
  public name: string;
  public effect: { key: string; name: string };
  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(props: EffectProps) {
    super(props);
    this.id = props.id;
    this.rx = 0;
    this.ry = 0;
    this.display = props.display;
    this.tScale = props.tScale;
    this.name = props.name;
    this.effect = props.effect;
    this.fill = "#3f6212";
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
    ctx.translate(-this.width / 2 + 10, -this.height / 2 + 8);
    ctx.scale(1.2, 1.2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fill(svgPath);
    ctx.restore();

    ctx.save();
    ctx.translate(-this.width / 2 + 35, -this.height / 2 + 18);
    ctx.font = `600 11px ${editorFont.fontFamily}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "left";
    ctx.fillText(this.name, 0, 0);
    ctx.restore();
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    if (!this.isSelected) return;

    const borderColor = "rgba(255, 255, 255, 1.0)";
    const borderWidth = 1.5;
    const innerRadius = 0;

    ctx.save();
    ctx.fillStyle = borderColor;
    ctx.beginPath();
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.roundRect(
      -this.width / 2 + borderWidth,
      -this.height / 2 + borderWidth,
      this.width - borderWidth * 2,
      this.height - borderWidth * 2,
      innerRadius,
    );
    ctx.fill("evenodd");
    ctx.restore();
  }
}

export default Effect;
