import { generateId } from "@openvideo/timeline";
import { ICaption } from "@openvideo/timeline";

interface Word {
  start: number;
  end: number;
  word: string;
}

interface ICaptionLine {
  text: string;
  words: Word[];
  width: number;
  start: number;
  end: number;
}

export const generateCaption = (
  captionLine: ICaptionLine,
  fontInfo: FontInfo,
  options: Options,
  sourceUrl: string,
): ICaption => {
  const caption = {
    id: generateId(),
    type: "Caption",
    name: "Caption",
    display: {
      from: options.displayFrom + captionLine.start * 1000,
      to: options.displayFrom + captionLine.end * 1000,
    },
    src: "",
    playbackRate: 1,
    duration: (captionLine.end - captionLine.start) * 1000,
    left: 0,
    top: 0,
    width: options.containerWidth,
    height: 100,
    angle: 0,
    zIndex: 1,
    opacity: 100,
    flip: null,
    chromaKey: { enabled: false, color: "#000000", similarity: 0, spill: 0 },
    locked: false,
    effects: [],
    sourceUrl,
    parentId: options.parentId,
    text: captionLine.text,
    words: captionLine.words.map((w) => ({
      ...w,
      start: w.start * 1000,
      end: w.end * 1000,
    })),
    style: {
      appearedColor: "#FFFFFF",
      activeColor: "#50FF12",
      activeFillColor: "#7E12FF",
      color: "#DADADA",
      backgroundColor: "transparent",
      borderColor: "#000000",
      borderWidth: 5,
      fontSize: fontInfo.fontSize,
      fontFamily: fontInfo.fontFamily,
      fontUrl: fontInfo.fontUrl,
      textAlign: "center",
      linesPerCaption: options.linesPerCaption,
    },
  };
  return caption as any;
};

interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

interface CaptionsInput {
  sourceUrl: string;
  results: {
    main: {
      words: Word[];
    };
  };
}

function createCaptionLines(
  input: CaptionsInput,
  fontInfo: FontInfo,
  options: Options,
): ICaptionLine[] {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return [];
  context.font = `${fontInfo.fontSize}px ${fontInfo.fontFamily}`;

  const captionLines: ICaptionLine[] = [];
  const words: Word[] = input.results.main.words;

  let currentLine: ICaptionLine = {
    text: "",
    words: [],
    width: 0,
    start: words.length > 0 ? words[0].start : 0,
    end: 0,
  };
  let linesCount = 0;

  words.forEach((wordObj, index) => {
    const wordWidth = context.measureText(wordObj.word).width;

    if (
      currentLine.width + wordWidth > options.containerWidth - 100 ||
      currentLine.text.endsWith(".")
    ) {
      const advance = currentLine.text.endsWith(".");
      // Check if it's time to start a new caption set
      if (linesCount + 1 === options.linesPerCaption || advance) {
        // Only push when lines count is correct
        captionLines.push(currentLine);
        linesCount = 0;

        // Reset currentLine for the next set of lines
        currentLine = {
          text: "",
          words: [],
          width: 0,
          start: wordObj.start,
          end: wordObj.end,
        };
      } else {
        linesCount += 1;

        // Reset currentLine.width but keep other details to continue accumulation
        currentLine.width = 0;
      }
    }

    // Accumulate words and width for the current line
    currentLine.text += (currentLine.text ? " " : "") + wordObj.word;
    currentLine.words.push(wordObj);
    currentLine.width += wordWidth;
    currentLine.end = wordObj.end;

    // Push the final line if it's the last word
    if (index === words.length - 1 && currentLine.text) {
      captionLines.push(currentLine);
    }
  });

  return captionLines;
}
interface FontInfo {
  fontFamily: string;
  fontUrl: string;
  fontSize: number;
}

interface Options {
  containerWidth: number;
  linesPerCaption: number;
  parentId: string;
  displayFrom: number;
}

export function generateCaptions(
  input: CaptionsInput,
  fontInfo: FontInfo,
  options: Options,
): ICaption[] {
  const captionLines = createCaptionLines(input, fontInfo, options);

  const captions = captionLines.map((line) =>
    generateCaption(line, fontInfo, options, input.sourceUrl),
  );

  return captions;
}
