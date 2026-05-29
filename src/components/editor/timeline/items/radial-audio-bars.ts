import { Resizable, ResizableProps } from "@openvideo/timeline";

interface RadialAudioBarsProps extends ResizableProps {
  src: string;
}

class RadialAudioBars extends Resizable {
  static type = "RadialAudioBars";
  declare src: string;
  public backgroundColorDiv: string = "#808080";

  public hasSrc = true;
  constructor(props: RadialAudioBarsProps) {
    super(props);
    this.id = props.id;
    this.display = props.display;
    this.tScale = props.tScale;
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.updateSelected(ctx);
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "rgba(255, 255, 255,1.0)" : "rgba(255, 255, 255,0.1)";
    const borderWidth = 2;
    const innerRadius = 4;

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
}

export default RadialAudioBars;
