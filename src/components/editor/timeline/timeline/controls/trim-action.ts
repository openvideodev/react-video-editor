import { TransformActionHandler, controlsUtils } from "fabric";
import { resolveOrigin, isTransformCentered } from "./utils";
import { CENTER, LEFT, RIGHT } from "./constants";
import { MICROSECONDS_PER_SECOND } from "@/types/timeline";
import { TIMELINE_CONSTANTS } from "../../timeline-constants";

const { wrapWithFireEvent, getLocalPoint, wrapWithFixedAnchor } = controlsUtils;

export const changeObjectWidth: TransformActionHandler = (_, transform, x, y) => {
  const localPoint = getLocalPoint(transform, transform.originX, transform.originY, x, y);

  if (
    resolveOrigin(transform.originX) === resolveOrigin(CENTER) ||
    (resolveOrigin(transform.originX) === resolveOrigin(RIGHT) && localPoint.x < 0) ||
    (resolveOrigin(transform.originX) === resolveOrigin(LEFT) && localPoint.x > 0)
  ) {
    const target: any = transform.target;

    const strokePadding = target.strokeWidth / (target.strokeUniform ? target.scaleX : 1);

    const multiplier = isTransformCentered(transform) ? 2 : 1;

    const oldWidth = target.width;

    let newWidth = Math.ceil(Math.abs((localPoint.x * multiplier) / target.scaleX) - strokePadding);

    const fromRight = transform.corner === "mr";
    const fromLeft = transform.corner === "ml";

    const zoom = target.timeScale || 1;
    const playbackRate = target.playbackRate || 1;
    const pixelsPerSecond = TIMELINE_CONSTANTS.PIXELS_PER_SECOND || 50;

    // Helper to convert pixels to microseconds for the content (respects playbackRate)
    const pixelsToContentUs = (pixels: number) => {
      return (pixels / (pixelsPerSecond * zoom)) * MICROSECONDS_PER_SECOND * playbackRate;
    };

    if (newWidth < 1) return false;

    if (fromRight) {
      const diffSize = newWidth - oldWidth;
      const diffUs = pixelsToContentUs(diffSize);
      const sourceDuration = target.sourceDuration;

      const newTo = target.trim.to + diffUs;

      if (newTo > sourceDuration) {
        const maxDiffUs = sourceDuration - target.trim.to;
        const maxDiffSize =
          (maxDiffUs / MICROSECONDS_PER_SECOND / playbackRate) * pixelsPerSecond * zoom;
        newWidth = oldWidth + maxDiffSize;
        target.set("width", Math.max(newWidth, 0));
        target.trim.to = sourceDuration;
      } else {
        target.set("width", Math.max(newWidth, 0));
        target.trim.to = newTo;
      }
    }

    if (fromLeft) {
      const diffPos = oldWidth - newWidth;
      const nextLeft = target.left + diffPos;

      if (nextLeft < 0) {
        const maxDiffPos = -target.left;
        const permittedNewWidth = oldWidth - maxDiffPos;
        newWidth = permittedNewWidth;
      }

      const diffSize = newWidth - oldWidth;
      const diffUs = pixelsToContentUs(diffSize);
      const newFrom = target.trim.from - diffUs;

      if (newFrom < 0) {
        const maxDiffUs = target.trim.from;
        const maxDiffSize =
          (maxDiffUs / MICROSECONDS_PER_SECOND / playbackRate) * pixelsPerSecond * zoom;
        newWidth = oldWidth + maxDiffSize;
        const finalDiffPos = oldWidth - newWidth;
        target.set("width", Math.max(newWidth, 0));
        target.set("left", target.left + finalDiffPos);
        target.trim.from = 0;
      } else {
        const finalDiffPos = oldWidth - newWidth;
        target.set("width", Math.max(newWidth, 0));
        target.set("left", target.left + finalDiffPos);
        target.trim.from = newFrom;
      }
    }

    target.setCoords();

    if (target.onResize) {
      target.onResize();
    }

    return oldWidth !== target.width;
  }

  return false;
};

export const changeTrim = wrapWithFireEvent("resizing", wrapWithFixedAnchor(changeObjectWidth));
