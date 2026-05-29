import { Resizable, ResizableProps, Pattern, util, Control } from "@openvideo/timeline";
import { createResizeControls } from "../controls";

interface ImageProps extends ResizableProps {
  src: string;
}

class Image extends Resizable {
  static type = "Image";
  public src: string;
  public hasSrc = true;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(props: ImageProps) {
    super(props);
    this.id = props.id;
    this.src = props.src;
    this.display = props.display;
    this.tScale = props.tScale;
    this.rx = 0;
    this.ry = 0;
    this.loadImage();
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.updateSelected(ctx);
  }

  public loadImage() {
    util.loadImage(this.src).then((img) => {
      const imgHeight = img.height;
      const rectHeight = this.height;
      const scaleY = rectHeight / imgHeight;
      const pattern = new Pattern({
        source: img,
        repeat: "repeat-x",
        patternTransform: [scaleY, 0, 0, scaleY, 0, 0],
      });
      this.set("fill", pattern);
      this.canvas?.requestRenderAll();
    });
  }

  public setSrc(src: string) {
    this.src = src;
    this.loadImage();
    this.canvas?.requestRenderAll();
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "rgba(255, 255, 255,1.0)" : "rgba(255, 255, 255,0.1)";
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
}

export default Image;
