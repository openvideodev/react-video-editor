import { Canvas, FabricObject, Line, TBBox } from "fabric";

const GUIDELINE_OFFSET = 10;

// some objects are used to show the guides and the transitions
// we need to remove them when the user moves the object
export const clearAuxiliaryObjects = (canvas: Canvas, allObjects: FabricObject[]) => {
  //@ts-ignore
  allObjects.forEach((obj) => obj.isAlignmentAuxiliary && canvas.remove(obj));
};

interface LineGuide {
  val: number;
  start: number;
  end: number;
}
type LineGuides = LineGuide[];

// figure out on which positions a object can be aligned to other objects?
// get the alignment value and the boundingBox for each possible alignment position
export const getLineGuideStops = (
  skipShapes: FabricObject[],
  canvas: Canvas,
): { vertical: LineGuide[]; horizontal: LineGuide[] } => {
  // objects can be aligned to canvas start, center and end of the canvas
  const vertical: LineGuides[] = [];
  const horizontal: LineGuides[] = [];

  // and objects can be aligned to start, center and end of other objects
  canvas
    .getObjects()
    .filter((o) => o.visible && (o as any).elementId)
    .forEach((guideObject) => {
      if (skipShapes.includes(guideObject) || (guideObject as any).isAlignmentAuxiliary) {
        return;
      }
      const box = guideObject.getBoundingRect();
      vertical.push(getStopsForObject(box.left, box.width, box.top, box.height));
    });

  return {
    vertical: vertical.flat(),
    horizontal: [],
  };
};

// find all alignment possibilities
export const getGuides = (
  lineGuideStops: { vertical: LineGuide[]; horizontal: LineGuide[] },
  itemBounds: {
    vertical: { guide: number; offset: number; snap: string }[];
    horizontal: { guide: number; offset: number; snap: string }[];
  },
): Guide[] => {
  const resultV: GuidelineResult[] = [];
  const resultH: GuidelineResult[] = [];

  lineGuideStops.vertical.forEach((lineGuide) => {
    itemBounds.vertical.forEach((itemBound) => {
      const diff = Math.abs(lineGuide.val - itemBound.guide);
      // if the distance between guide line and object snap point is close we can consider this for alignment
      if (diff < GUIDELINE_OFFSET) {
        resultV.push({
          lineGuide: lineGuide.val,
          diff: diff,
          orientation: "V",
          snap: itemBound.snap,
          offset: itemBound.offset,
          targetDim: { start: lineGuide.start, end: lineGuide.end },
        });
      }
    });
  });

  lineGuideStops.horizontal.forEach((lineGuide) => {
    itemBounds.horizontal.forEach((itemBound) => {
      const diff = Math.abs(lineGuide.val - itemBound.guide);
      if (diff < GUIDELINE_OFFSET) {
        resultH.push({
          lineGuide: lineGuide.val,
          diff: diff,
          orientation: "H",
          snap: itemBound.snap,
          offset: itemBound.offset,
          targetDim: { start: lineGuide.start, end: lineGuide.end },
        });
      }
    });
  });

  const guides: Guide[] = [];

  // find closest alignment options
  const minV = resultV.sort((a, b) => a.diff - b.diff)[0];
  const minH = resultH.sort((a, b) => a.diff - b.diff)[0];
  if (minV) {
    guides.push({
      lineGuide: minV.lineGuide,
      offset: minV.offset,
      orientation: "V",
      snap: minV.snap,
      targetDim: minV.targetDim,
    });
  }
  if (minH) {
    guides.push({
      lineGuide: minH.lineGuide,
      offset: minH.offset,
      orientation: "H",
      snap: minH.snap,
      targetDim: minH.targetDim,
    });
  }
  return guides;
};

interface GuidelineResult {
  lineGuide: number;
  diff: number;
  orientation: "V" | "H";
  snap: string;
  offset: number;
  targetDim: {
    start: number;
    end: number;
  };
}

interface Guide {
  lineGuide: number;
  offset: number;
  orientation: "V" | "H";
  snap: string;
  targetDim: {
    start: number;
    end: number;
  };
}

// the drawn lines are either vertical or horizontal, which means that those coordinates are the same
// in the other dimension, the line should not exceed the bounding rect of the target and the object to align it to
export const drawGuides = (guides: Guide[], _: TBBox, canvas: Canvas) => {
  guides.forEach((lineGuide) => {
    const alignmentLineOptions = getAlignmentLineOptions(canvas.getZoom());
    if (lineGuide.orientation === "H") {
      canvas.add(
        getAlignmentLine(
          [
            0,
            lineGuide.lineGuide - alignmentLineOptions.strokeWidth / 2,
            2000,
            lineGuide.lineGuide - alignmentLineOptions.strokeWidth / 2,
          ],
          { ...alignmentLineOptions, stroke: "#ffffff" },
        ),
      );
    } else if (lineGuide.orientation === "V") {
      canvas.add(
        getAlignmentLine(
          [
            lineGuide.lineGuide - alignmentLineOptions.strokeWidth / 2,
            0,
            lineGuide.lineGuide - alignmentLineOptions.strokeWidth / 2,
            2000,
          ],
          { ...alignmentLineOptions, stroke: "#ffffff" },
        ),
      );
    }
  });
};

const getAlignmentLineOptions = (zoom: number) => {
  const strokeWidth = 2 / zoom;
  return {
    strokeWidth,
  };
};

const getAlignmentLine = (points: [number, number, number, number], options: any) => {
  return new Line(points, {
    ...options,
    strokeLineCap: "square",
    excludeFromExport: true,
    isAlignmentAuxiliary: true,
    selectable: false,
    objectCaching: false,
  });
};

// guide: used to determine whether to trigger alignment
// offset: offset between object and its boundingBox
export const getObjectSnappingEdges = (
  target: FabricObject,
): {
  vertical: { guide: number; offset: number; snap: string }[];
  horizontal: { guide: number; offset: number; snap: string }[];
} => {
  const rect = target.getBoundingRect();
  return {
    vertical: [
      {
        guide: Math.round(rect.left),
        offset: Math.round(target.left - rect.left),
        snap: "start",
      },
      {
        guide: Math.round(rect.left + rect.width),
        offset: Math.round(target.left - rect.left - rect.width),
        snap: "end",
      },
    ],
    horizontal: [
      {
        guide: Math.round(rect.top),
        offset: Math.round(target.top - rect.top),
        snap: "start",
      },
      {
        guide: Math.round(rect.top + rect.height),
        offset: Math.round(target.top - rect.top - rect.height),
        snap: "end",
      },
    ],
  };
};

// get the lineGuideStops for an object on a dimension
// start is either left or top
// distance is either width or height
// the second pair of values are the start and distance from the other dimension
export const getStopsForObject = (
  start: number,
  distance: number,
  drawStart: number,
  drawDistance: number,
) => {
  const stops = [start, start + distance];
  return stops.map((stop) => {
    return {
      val: stop,
      start: drawStart,
      end: drawStart + drawDistance,
    };
  });
};
