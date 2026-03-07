import { Rect, RectProps } from "fabric";

export interface BaseClipProps extends Partial<RectProps> {
  elementId: string;
  text: string;
  src?: string;
}

export abstract class BaseTimelineClip extends Rect {
  elementId: string;
  text: string;
  src?: string;
  public timeScale: number = 1;

  constructor(options: BaseClipProps) {
    super(options);
    this.elementId = options.elementId;
    this.text = options.text;
    this.src = options.src;

    this.set({
      rx: 4, // Rounded corners
      ry: 4,
      cornerSize: 6,
      selectable: true,
      hasControls: true,
      lockRotation: true,
      lockScalingY: true, // Only horizontal resizing makes sense usually
    });
  }

  isSelected: boolean = false;

  public setSelected(selected: boolean) {
    this.isSelected = selected;
    this.set({ dirty: true });
  }
}
