import { type TMat2D, type TPointerEventInfo, util } from "fabric";
import type Timeline from "../canvas";

type SizeProps = {
  min: number;
  max: number;
};

const getObjectsBoundingRect = (timeline: Timeline) => {
  const objects = timeline.canvas.getObjects().filter((x: any) => x.studioClipId);
  if (objects.length === 0) {
    return { left: 0, top: 0, right: 0, bottom: 0 };
  }

  const { left, top, width, height } = util.makeBoundingBoxFromPoints(
    objects.map((x) => x.getCoords()).flat(1),
  );
  return { left, top, right: left + width, bottom: top + height };
};

const limitViewport = (
  timeline: Timeline,
  vpt: TMat2D,
  offsetX = 0,
  offsetY = 0,
  extraMarginX = 50,
  extraMarginY = 15,
): TMat2D => {
  const zoom = vpt[0];

  const objectRect = getObjectsBoundingRect(timeline);

  const totalAreaLeft = Math.min(objectRect.left, -offsetX);
  const totalAreaTop = Math.min(objectRect.top, -offsetY);
  const totalAreaRight = objectRect.right + extraMarginX;
  const totalAreaBottom = Math.max(objectRect.bottom, timeline.totalTracksHeight) + extraMarginY;

  const totalWidth = totalAreaRight - totalAreaLeft;
  const totalHeight = totalAreaBottom - totalAreaTop;

  const canvasWidth = timeline.canvas.width / zoom;
  const canvasHeight = timeline.canvas.height / zoom;

  if (totalWidth <= canvasWidth) {
    vpt[4] = -totalAreaLeft * zoom;
  } else {
    const maxScrollLeft = offsetX * zoom;
    if (vpt[4] > maxScrollLeft) vpt[4] = maxScrollLeft;

    const minScrollRight = -(totalAreaRight * zoom - timeline.canvas.width);
    if (minScrollRight < 0 && vpt[4] < minScrollRight) {
      vpt[4] = minScrollRight;
    }
  }

  if (totalHeight <= canvasHeight) {
    vpt[5] = -totalAreaTop * zoom;
  } else {
    const maxScrollTop = offsetY * zoom;
    if (vpt[5] > maxScrollTop) vpt[5] = maxScrollTop;

    const minScrollBottom = -(totalAreaBottom * zoom - timeline.canvas.height);
    if (minScrollBottom < 0 && vpt[5] < minScrollBottom) {
      vpt[5] = minScrollBottom;
    }
  }

  return vpt;
};

type MouseWheelOptions = {
  offsetX?: number;
  offsetY?: number;
  extraMarginX?: number;
  extraMarginY?: number;
  onZoom?: (zoom: number) => void;
} & Partial<SizeProps>;

export const makeMouseWheel =
  (timeline: Timeline, options: MouseWheelOptions = {}) =>
  (wheelEvent: TPointerEventInfo<WheelEvent>) => {
    const e = wheelEvent.e;
    if (e.target == timeline.canvas.upperCanvasEl) e.preventDefault();

    const isTouchScale = Math.floor(e.deltaY) != Math.ceil(e.deltaY);

    if (e.ctrlKey || e.metaKey) {
      const speed = isTouchScale ? 0.99 : 0.998;
      const oldZoom = timeline.timeScale;
      let newZoom = oldZoom * speed ** e.deltaY;

      if (options.max != undefined && newZoom > options.max) newZoom = options.max;
      if (options.min != undefined && newZoom < options.min) newZoom = options.min;

      if (oldZoom !== newZoom) {
        const vpt = timeline.canvas.viewportTransform.slice(0) as TMat2D;
        const pointer = wheelEvent.viewportPoint;

        // Formula to keep pointer point visually fixed:
        // P_viewport = P_world * oldZoom + vpt4_old
        // P_viewport = P_world * newZoom + vpt4_new
        // vpt4_new = vpt4_old + P_world * (oldZoom - newZoom)
        // Since P_world = (P_viewport - vpt4_old) / oldZoom
        // vpt4_new = vpt4_old + (P_viewport - vpt4_old) * (1 - newZoom / oldZoom)

        vpt[4] = vpt[4] + (pointer.x - vpt[4]) * (1 - newZoom / oldZoom);

        const limitedVpt = limitViewport(
          timeline,
          vpt,
          options.offsetX ?? 0,
          options.offsetY ?? 0,
          options.extraMarginX ?? 200,
          options.extraMarginY ?? 200,
        );

        timeline.canvas.setViewportTransform(limitedVpt);
        if (options.onZoom) options.onZoom(newZoom);
      }
      timeline.canvas.requestRenderAll();
      return;
    }

    const vpt = timeline.canvas.viewportTransform.slice(0) as TMat2D;

    if (e.shiftKey) {
      vpt[4] -= e.deltaY;
    } else {
      vpt[4] -= e.deltaX;
      vpt[5] -= e.deltaY;
    }

    const limitedVpt = limitViewport(
      timeline,
      vpt,
      options.offsetX ?? 0,
      options.offsetY ?? 0,
      options.extraMarginX ?? 200,
      options.extraMarginY ?? 200,
    );
    timeline.canvas.setViewportTransform(limitedVpt);
    timeline.canvas.requestRenderAll();
  };
