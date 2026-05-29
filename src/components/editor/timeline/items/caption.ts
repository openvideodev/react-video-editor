import { Control, Resizable, ResizableProps } from "@openvideo/timeline";
import { IDisplay } from "@openvideo/timeline";
import { createResizeControls } from "../controls";
import { SECONDARY_FONT } from "../../constants/constants";

interface CaptionsProps extends ResizableProps {
  tScale: number;
  display: IDisplay;
  text: string;
}

class Caption extends Resizable {
  static type = "Caption";
  public text: string;

  static createControls(): { controls: Record<string, Control> } {
    return { controls: createResizeControls() };
  }

  constructor(props: CaptionsProps) {
    super(props);
    this.fill = "#701a75";
    this.tScale = props.tScale;
    this.display = props.display;
    this.text = props.text;
    this.rx = 0;
    this.ry = 0;

    this.borderColor = "transparent";
    this.stroke = "transparent";
    this.strokeWidth = 0;
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const textPath = new Path2D(
      "M4 4.8C3.55817 4.8 3.2 5.15817 3.2 5.6C3.2 6.04183 3.55817 6.4 4 6.4H5.6C6.04183 6.4 6.4 6.04183 6.4 5.6C6.4 5.15817 6.04183 4.8 5.6 4.8H4Z M8.8 4.8C8.35817 4.8 8 5.15817 8 5.6C8 6.04183 8.35817 6.4 8.8 6.4H12C12.4418 6.4 12.8 6.04183 12.8 5.6C12.8 5.15817 12.4418 4.8 12 4.8H8.8Z M4 8C3.55817 8 3.2 8.35817 3.2 8.8C3.2 9.24183 3.55817 9.6 4 9.6H7.2C7.64183 9.6 8 9.24183 8 8.8C8 8.35817 7.64183 8 7.2 8H4Z M10.4 8C9.95817 8 9.6 8.35817 9.6 8.8C9.6 9.24183 9.95817 9.6 10.4 9.6H12C12.4418 9.6 12.8 9.24183 12.8 8.8C12.8 8.35817 12.4418 8 12 8H10.4Z M2.4 0C1.07452 0 0 1.07452 0 2.4V10.4C0 11.7255 1.07452 12.8 2.4 12.8H13.6C14.9255 12.8 16 11.7255 16 10.4V2.4C16 1.07452 14.9255 0 13.6 0H2.4ZM1.6 2.4C1.6 1.95817 1.95817 1.6 2.4 1.6H13.6C14.0418 1.6 14.4 1.95817 14.4 2.4V10.4C14.4 10.8418 14.0418 11.2 13.6 11.2H2.4C1.95817 11.2 1.6 10.8418 1.6 10.4V2.4Z",
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 8);
    ctx.font = `400 12px ${SECONDARY_FONT}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "left";

    // Calculate available width for text (full width minus icon space and right padding)
    const iconSpace = 28; // space for the icon
    const rightPadding = 5; // 5px padding before ellipsis
    const availableWidth = this.width - iconSpace - rightPadding;

    // Measure and truncate text if needed
    let displayText = this.text;
    const textWidth = ctx.measureText(this.text).width;

    if (textWidth > availableWidth) {
      let currentText = this.text;

      while (
        ctx.measureText(`${currentText}...`).width > availableWidth &&
        currentText.length > 0
      ) {
        currentText = currentText.slice(0, -1);
      }

      displayText = `${currentText}...`;
    }

    ctx.clip();
    ctx.fillText(displayText, 28, 12);

    ctx.translate(8, 1);
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fill(textPath);
    ctx.restore();
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
}

export default Caption;
