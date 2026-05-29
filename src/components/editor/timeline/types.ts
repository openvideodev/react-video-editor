export interface Filmstrip {
  segmentIndex?: number;
  offset: number;
  thumbnailsCount: number;
  startTime: number;
  widthOnScreen: number;
}

export interface FilmstripBacklogOptions {
  thumbnailsPerSegment: number; // Number of thumbnails preloaded for smooth scrolling
  segmentSize: number; // Total width required to display thumbnails side by side
}

export const calculateThumbnailSegmentLayout = (
  thumbnailHeight: number,
): FilmstripBacklogOptions => {
  // Calculate the maximum number of thumbnails based on the thumbnail width
  let maxThumbnails = Math.floor(1200 / thumbnailHeight);

  // Calculate the total width required for the thumbnails
  let segmentSize = maxThumbnails * thumbnailHeight;

  return {
    thumbnailsPerSegment: maxThumbnails,
    segmentSize,
  };
};

//  it calculates the number of segments that are offscreen
export const calculateOffscreenSegments = (
  offscreenHeight: number,
  trimFromSize: number,
  segmentSize: number,
) => {
  const offscreenSegments = Math.floor((offscreenHeight + trimFromSize) / segmentSize);
  return offscreenSegments;
};

interface Thumbnail {
  ts: number;
  url: string;
}

interface Result {
  ts: number;
  url: string;
}

export function matchTimestampsToNearestThumbnails(
  timestamps: number[],
  thumbnailsList: Thumbnail[],
): Result[] {
  const results: Result[] = [];

  timestamps.forEach((ts) => {
    // Find the closest thumbnail
    const closestThumbnail = thumbnailsList.reduce((prev, curr) => {
      return Math.abs(curr.ts - ts) < Math.abs(prev.ts - ts) ? curr : prev;
    });

    // Push the result into the results array
    results.push({
      ts,
      url: closestThumbnail.url,
    });
  });

  return results;
}
