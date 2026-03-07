import { Group, Rect, Path, type GroupProps } from "fabric";

export interface TransitionButtonProps extends Partial<GroupProps> {
  onClick?: () => void;
}

export class TransitionButton extends Group {
  static type = "TransitionButton";
  public isTransitionButton = true;
  public isAlignmentAuxiliary = true; // To be cleaned up easily

  constructor(options: TransitionButtonProps = {}) {
    // 2. Button Body (Center)
    const buttonBg = new Rect({
      width: 20,
      height: 20,
      fill: "white",
      rx: 4,
      ry: 4,
      originX: "center",
      originY: "center",
    });

    // Plus icon
    const plusIcon = new Path("M 5 12 H 19 M 12 5 V 19", {
      stroke: "#18181b",
      strokeWidth: 2,
      fill: "transparent",
      strokeLineCap: "round",
      strokeLineJoin: "round",
      originX: "center",
      originY: "center",
      scaleX: 0.6,
      scaleY: 0.6,
      top: 0,
      left: 0,
    });

    const button = new Group([buttonBg, plusIcon], {
      originX: "center",
      originY: "center",
    });

    super([button], {
      ...options,
      selectable: false,
      evented: true,
      hoverCursor: "pointer",
      originX: "center",
      originY: "center",
    });

    this.on("mousedown", (e) => {
      if (options.onClick) {
        options.onClick();
      }
    });
  }
}
