import { MICROSECONDS_PER_SECOND } from "@/types/timeline";
import { TIMELINE_CONSTANTS } from "../../timeline-constants";

export interface Filmstrip {
  segmentIndex: number;
  offset: number;
  startTime: number;
  thumbnailsCount: number;
  widthOnScreen: number;
}

export const EMPTY_FILMSTRIP: Filmstrip = {
  segmentIndex: 0,
  offset: 0,
  startTime: 0,
  thumbnailsCount: 0,
  widthOnScreen: 0,
};

export const calculateThumbnailSegmentLayout = (thumbnailWidth: number) => {
  // Calculate the maximum number of thumbnails based on the thumbnail width
  // 1200 is a magic number used in the reference code for segment size
  const maxThumbnails = Math.floor(1200 / thumbnailWidth);

  // Calculate the total width required for the thumbnails
  const segmentSize = maxThumbnails * thumbnailWidth;

  return {
    thumbnailsPerSegment: maxThumbnails,
    segmentSize,
  };
};

export const calculateOffscreenSegments = (
  offscreenWidth: number,
  trimFromSize: number,
  segmentSize: number,
) => {
  const offscreenSegments = Math.floor((offscreenWidth + trimFromSize) / segmentSize);
  return offscreenSegments;
};

export function timeMsToUnits(timeMs: number, tScale: number, playbackRate: number = 1) {
  return (
    ((timeMs / MICROSECONDS_PER_SECOND) * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * tScale) /
    playbackRate
  );
}

export function unitsToTimeMs(units: number, tScale: number, playbackRate: number = 1) {
  return (
    (units / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * tScale)) *
    playbackRate *
    MICROSECONDS_PER_SECOND
  );
}
