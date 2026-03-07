import { type FabricObject } from "fabric";
import type Timeline from "../canvas";
import {
  getLineGuideStops,
  getObjectSnappingEdges,
  getGuides,
  drawGuides,
  clearAuxiliaryObjects,
} from "../guidelines/utils";

export function handleDragging(timeline: Timeline, options: any) {
  const target = options.target as FabricObject;
  if (!target) return;

  // --- Snapping Guidelines ---
  const allObjects = timeline.canvas.getObjects();
  const targetRect = target.getBoundingRect();
  target.setCoords();

  const skipObjects = [target, ...timeline.canvas.getActiveObjects()];
  const lineGuideStops = getLineGuideStops(skipObjects, timeline.canvas);
  const itemBounds = getObjectSnappingEdges(target);
  const guides = getGuides(lineGuideStops, itemBounds);

  if (timeline.enableGuideRedraw) {
    clearAuxiliaryObjects(timeline.canvas, allObjects);
    if (guides.length > 0) {
      drawGuides(guides, targetRect, timeline.canvas);
    }
    timeline.enableGuideRedraw = false;
    setTimeout(() => {
      timeline.enableGuideRedraw = true;
    }, 50);
  }

  guides.forEach((lineGuide) => {
    if (lineGuide.orientation === "V") {
      target.set("left", lineGuide.lineGuide + lineGuide.offset);
      target.setCoords();
    }
  });
  // ---------------------------

  // Get the pointer position (cursor position) instead of object center
  const pointer = timeline.canvas.getPointer(options.e);
  const cursorY = pointer.y;

  if (timeline.isOverTrack(cursorY)) {
    timeline.clearSeparatorHighlights();
    timeline.setActiveSeparatorIndex(null);
    timeline.canvas.requestRenderAll();
    return;
  }

  const potentialSeparator = timeline.checkSeparatorIntersection(cursorY);
  timeline.clearSeparatorHighlights();

  if (potentialSeparator) {
    potentialSeparator.highlight.set("fill", "white");
    timeline.setActiveSeparatorIndex(potentialSeparator.index);
  } else {
    timeline.setActiveSeparatorIndex(null);
  }

  timeline.canvas.requestRenderAll();
}
