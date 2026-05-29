import { findIndex } from "./search";
import { MICROSECONDS_PER_SECOND, PIXELS_PER_SECOND } from "@openvideo/timeline";
import { ITimelineScaleState } from "@openvideo/timeline";
import { TIMELINE_ZOOM_LEVELS } from "../constants/scale";

export function getPreviousZoomLevel(currentZoom: ITimelineScaleState): ITimelineScaleState {
  const previousZoom = getPreviousZoom(currentZoom);

  return previousZoom || TIMELINE_ZOOM_LEVELS[0];
}

export function getZoomByIndex(index: number) {
  return TIMELINE_ZOOM_LEVELS[index];
}
export function getNextZoomLevel(currentZoom: ITimelineScaleState): ITimelineScaleState {
  const nextZoom = getNextZoom(currentZoom);

  return nextZoom || TIMELINE_ZOOM_LEVELS[TIMELINE_ZOOM_LEVELS.length - 1];
}

export const getPreviousZoom = (currentZoom: ITimelineScaleState): ITimelineScaleState | null => {
  // Filter zoom levels that are smaller than the current zoom
  const smallerZoomLevels = TIMELINE_ZOOM_LEVELS.filter((level) => level.zoom < currentZoom.zoom);

  // If there are no smaller zoom levels, return null (no previous zoom)
  if (smallerZoomLevels.length === 0) {
    return null;
  }

  // Get the zoom level with the largest zoom value that's still smaller than the current zoom
  const previousZoom = smallerZoomLevels.reduce((prev, curr) =>
    curr.zoom > prev.zoom ? curr : prev,
  );

  return previousZoom;
};

export const getNextZoom = (currentZoom: ITimelineScaleState): ITimelineScaleState | null => {
  // Filter zoom levels that are larger than the current zoom
  const largerZoomLevels = TIMELINE_ZOOM_LEVELS.filter((level) => level.zoom > currentZoom.zoom);

  // If there are no larger zoom levels, return null (no next zoom)
  if (largerZoomLevels.length === 0) {
    return null;
  }

  // Get the zoom level with the smallest zoom value that's still larger than the current zoom
  const nextZoom = largerZoomLevels.reduce((prev, curr) => (curr.zoom < prev.zoom ? curr : prev));

  return nextZoom;
};

export function getFitZoomLevel(
  totalLengthMs: number,
  zoom = 1,
  scrollOffset = 8, // Default fallback value
): ITimelineScaleState {
  const getVisibleWidth = () => {
    const clampedScrollOffset = Math.max(0, scrollOffset);

    const timelineCanvas = document.getElementById("designcombo-timeline-canvas") as HTMLElement;
    const offsetWidth = timelineCanvas?.offsetWidth ?? document.body.offsetWidth;

    // Use 1 to prevent NaN because of dividing by 0.
    return Math.max(1, offsetWidth - clampedScrollOffset);
  };

  const getFullWidth = () => {
    if (typeof totalLengthMs === "number") {
      return timeUsToUnits(totalLengthMs, zoom);
    }

    return calculateTimelineWidth(totalLengthMs, zoom);
  };

  const multiplier = getVisibleWidth() / getFullWidth();
  const targetZoom = zoom * multiplier;

  const fitZoomIndex = findIndex(TIMELINE_ZOOM_LEVELS, (level) => {
    return level.zoom > targetZoom;
  });

  // const clampedIndex = clamp(fitZoomIndex, 0, TIMELINE_ZOOM_LEVELS.length - 1);

  return {
    segments: 5,
    index: fitZoomIndex,
    zoom: targetZoom,
    unit: 1,
  };
}

export function timeUsToUnits(timeUs: number, zoom = 1): number {
  return (timeUs / MICROSECONDS_PER_SECOND) * PIXELS_PER_SECOND * zoom;
}

export function unitsToTimeUs(units: number, zoom = 1): number {
  return (units / (PIXELS_PER_SECOND * zoom)) * MICROSECONDS_PER_SECOND;
}

export function calculateTimelineWidth(totalLengthUs: number, zoom = 1): number {
  return timeUsToUnits(totalLengthUs, zoom);
}
