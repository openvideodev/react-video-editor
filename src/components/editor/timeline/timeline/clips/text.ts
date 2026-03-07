import { BaseTimelineClip, BaseClipProps } from "./base";
import { Control } from "fabric";
import { createResizeControls } from "../controls";
import { editorFont } from "@/components/editor/constants";

export interface TextClipProps extends BaseClipProps {}

export class Text extends BaseTimelineClip {
  text: string;
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
    fill: "#134e4a",
    borderOpacityWhenMoving: 1,
    hoverCursor: "default",
  };

  constructor(options: TextClipProps) {
    super(options);
    Object.assign(this, Text.ownDefaults);
    this.text = options.text;
    this.set({
      // fill: TRACK_COLORS.text.solid,
    });
  }

  public _render(ctx: CanvasRenderingContext2D) {
    super._render(ctx);
    this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  public drawTextIdentity(ctx: CanvasRenderingContext2D) {
    const textPath = new Path2D(
      "M6.23982 0.361968C6.18894 0.253743 6.10832 0.162234 6.00736 0.0981357C5.9064 0.034038 5.78929 0 5.6697 0C5.55012 0 5.433 0.034038 5.33204 0.0981357C5.23109 0.162234 5.15046 0.253743 5.09959 0.361968L0.0599035 11.0713C0.0246926 11.1462 0.00457285 11.2272 0.000693114 11.3099C-0.00318662 11.3925 0.00924959 11.4751 0.0372917 11.553C0.0939253 11.7102 0.210687 11.8384 0.361891 11.9095C0.513095 11.9806 0.686354 11.9888 0.843555 11.9322C1.00076 11.8755 1.12902 11.7588 1.20013 11.6075L2.51202 8.81998H8.82738L10.1393 11.6075C10.1745 11.6824 10.2241 11.7496 10.2853 11.8053C10.3465 11.861 10.418 11.9041 10.4958 11.9322C10.5737 11.9602 10.6563 11.9726 10.7389 11.9687C10.8216 11.9649 10.9026 11.9447 10.9775 11.9095C11.0524 11.8743 11.1196 11.8247 11.1753 11.7635C11.231 11.7023 11.2741 11.6308 11.3021 11.553C11.3302 11.4751 11.3426 11.3925 11.3387 11.3099C11.3348 11.2272 11.3147 11.1462 11.2795 11.0713L6.23982 0.361968ZM3.10498 7.56005L5.6697 2.11011L8.23443 7.56005H3.10498ZM15.1191 3.78029C14.1143 3.78029 13.3292 4.05354 12.7859 4.59294C12.6721 4.71153 12.6092 4.86987 12.6106 5.03419C12.6119 5.19851 12.6774 5.3558 12.7931 5.4725C12.9088 5.58921 13.0655 5.6561 13.2298 5.6589C13.3941 5.6617 13.553 5.60018 13.6726 5.48748C13.9718 5.19062 14.46 5.04021 15.1191 5.04021C16.1609 5.04021 17.009 5.74892 17.009 6.61511V6.86867C16.45 6.49465 15.7917 6.29663 15.1191 6.30013C13.382 6.30013 11.9693 7.57187 11.9693 9.13495C11.9693 10.698 13.382 11.9698 15.1191 11.9698C15.792 11.9727 16.4503 11.7739 17.009 11.3989C17.0168 11.566 17.0907 11.7231 17.2144 11.8357C17.3381 11.9483 17.5014 12.0071 17.6685 11.9993C17.8356 11.9915 17.9927 11.9176 18.1053 11.7939C18.2179 11.6702 18.2767 11.5069 18.2689 11.3398V6.61511C18.2689 5.05202 16.8562 3.78029 15.1191 3.78029ZM15.1191 10.7099C14.0773 10.7099 13.2292 10.0012 13.2292 9.13495C13.2292 8.26876 14.0773 7.56005 15.1191 7.56005C16.1609 7.56005 17.009 8.26876 17.009 9.13495C17.009 10.0012 16.1609 10.7099 15.1191 10.7099Z",
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 8);
    ctx.font = `400 12px ${editorFont.fontFamily}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText(this.text, 36, 12);

    ctx.translate(8, 1);

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.fill(textPath);
    ctx.restore();
  }
  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }

  public updateSelected(ctx: CanvasRenderingContext2D) {
    const borderColor = this.isSelected ? "#0f766e" : "#115e59";
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
