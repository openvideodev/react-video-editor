import { Group, Rect, type GroupProps } from "fabric";

export interface TransitionPlaceholderProps extends Partial<GroupProps> {
  width?: number;
  height?: number;
}

export class TransitionPlaceholder extends Group {
  static type = "TransitionPlaceholder";
  public isTransitionPlaceholder = true;
  public isAlignmentAuxiliary = true;

  constructor(options: TransitionPlaceholderProps = {}) {
    const width = options.width || 40;
    const height = options.height || 52; // Default track height

    const box = new Rect({
      width,
      height,
      fill: "rgba(0, 242, 255, 0.6)",
      stroke: "white",
      strokeWidth: 4,
      strokeDashArray: [4, 4],
      rx: 4,
      ry: 4,
      originX: "center",
      originY: "center",
    });

    super([box], {
      ...options,
      selectable: false,
      evented: false,
      originX: "center",
      originY: "center",
    });
  }
}
