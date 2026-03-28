import { Group, Rect, Path, type GroupProps } from "fabric";

export interface TransitionButtonProps extends Partial<GroupProps> {
  onClick?: () => void;
  width?: number;
  height?: number;
}

export class TransitionButton extends Group {
  static type = "TransitionButton";
  public isTransitionButton = true;
  public isAlignmentAuxiliary = true; // To be cleaned up easily

  constructor(options: TransitionButtonProps = {}) {
    const width = options.width || 40;
    const height = options.height || 52;

    // 2. Button Body (Center)
    const buttonBg = new Rect({
      width: width,
      height: height,
      fill: "black",
      rx: 4,
      ry: 4,
      originX: "center",
      originY: "center",
    });

    // Plus icon
    const plusIcon = new Path(
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
