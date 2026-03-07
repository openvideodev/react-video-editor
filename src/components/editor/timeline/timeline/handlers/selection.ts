import { ActiveSelection } from "fabric";
import type Timeline from "../canvas";

export function handleSelectionCreate(timeline: Timeline, e: any) {
  const activeSelection = timeline.canvas.getActiveObject();

  if (activeSelection instanceof ActiveSelection) {
    activeSelection.set({
      borderColor: "rgba(255, 255, 255, 0.5)",
      hasControls: false,
      hoverCursor: "default",
      padding: 0,
      borderScaleFactor: 1,
    });

    // Update individual clip selection state
    activeSelection.getObjects().forEach((obj: any) => {
      if ((obj as any).setSelected) (obj as any).setSelected(true);
    });
  } else {
    // Single object selection
    const obj = activeSelection as any;
    if (obj && obj.setSelected) {
      obj.setSelected(true);
    }
  }

  timeline.emitSelectionChange();
}

export function handleSelectionUpdate(timeline: Timeline, e: any) {
  const { selected, deselected } = e;
  const activeSelection = timeline.canvas.getActiveObject();

  if (activeSelection instanceof ActiveSelection) {
    activeSelection.set({
      borderColor: "transparent",
      hasControls: false,
      hoverCursor: "default",
    });
  }

  // Handle Deselected
  if (deselected) {
    deselected.forEach((obj: any) => {
      if ((obj as any).setSelected) (obj as any).setSelected(false);
    });
  }

  // Handle Selected
  if (selected) {
    selected.forEach((obj: any) => {
      if ((obj as any).setSelected) (obj as any).setSelected(true);
    });
  }

  timeline.emitSelectionChange();
}

export function handleSelectionClear(timeline: Timeline, e: any) {
  const { deselected } = e;
  if (deselected) {
    deselected.forEach((obj: any) => {
      if ((obj as any).setSelected) (obj as any).setSelected(false);
    });
  }
  timeline.emitSelectionChange();
}
