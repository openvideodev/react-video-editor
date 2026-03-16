import { fontManager } from "openvideo";
import * as PIXI from "pixi.js";

/**
 * Fetches caption data from a URL
 */
export const fetchCaptionData = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch caption data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching caption data:", error);
    return null;
  }
};

/**
 * Groups words by width using canvas text measurement
 * Words are accumulated until the text width exceeds maxWidth, then a new caption is created
 */
export const groupWordsByWidth = (
  words: any[],
  maxWidth: number = 800,
  fontSize: number = 80,
  fontFamily: string = "Bangers-Regular",
  maxLines: number = 1,
): any[] => {
  if (!words || words.length === 0) return [];

  // Create canvas for text measurement
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];

  ctx.font = `${fontSize}px ${fontFamily}`;

  const captions: any[] = [];
  let currentWords: any[] = [];
  let currentText = "";
  let lastLineText = "";
  let currentLineCount = 1;

  const finalizeCaption = () => {
    if (currentWords.length === 0) return;

    const firstWord = currentWords[0];
    const lastWord = currentWords[currentWords.length - 1];

    // Measure actual height of the block
    const metrics = ctx.measureText("AaFfLMZpPqQ");
    const singleLineHeight =
      metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent || fontSize;
    const totalHeight = singleLineHeight * currentLineCount * 1.2; // Add some leading

    // Calculate max width among all lines
    const lines = currentText.split("\n");
    let maxW = 0;
    lines.forEach((line) => {
      maxW = Math.max(maxW, ctx.measureText(line).width);
    });

    captions.push({
      text: currentText,
      width: maxW + 160,
      height: totalHeight,
      words: currentWords.map((w, idx) => ({
        text: w.word || w.text || "",
        from: idx === 0 ? 0 : (w.start - firstWord.start) * 1000,
        to: (w.end - firstWord.start) * 1000,
        isKeyWord: idx === 0 || idx === currentWords.length - 1,
        paragraphIndex: w.paragraphIndex ?? "",
      })),
      from: firstWord.start,
      to: lastWord.end,
    });
  };

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordText = word.word || word.text || "";

    const testLineText = lastLineText ? `${lastLineText} ${wordText}` : wordText;
    const bitmapText = new PIXI.BitmapText(testLineText, {
      fontFamily,
      fontSize,
    });
    const testLineWidth = bitmapText.width + 160;

    if (testLineWidth > maxWidth && lastLineText !== "") {
      if (currentLineCount < maxLines) {
        // Add newline and continue chunk
        currentLineCount++;
        currentText += "\n" + wordText;
        lastLineText = wordText;
        currentWords.push(word);
      } else {
        // finalize and start new chunk
        finalizeCaption();
        currentWords = [word];
        currentText = wordText;
        lastLineText = wordText;
        currentLineCount = 1;
      }
    } else {
      // fits in current line
      currentWords.push(word);
      if (lastLineText === "") {
        currentText += (currentText ? " " : "") + wordText;
      } else {
        currentText =
          currentText.substring(0, currentText.length - lastLineText.length) + testLineText;
      }
      lastLineText = testLineText;
    }
  }

  finalizeCaption();

  return captions;
};

/**
 * Converts schema.json format to exported.json format compatible with Studio
 */
export const convertSchemaToExported = async (schemaJson: any): Promise<any> => {
  const schema = schemaJson.schema || schemaJson;
  const clips: any[] = [];

  // Load Bangers font for caption text measurement
  await fontManager.loadFonts([
    {
      name: "Bangers-Regular",
      url: "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf",
    },
  ]);

  // Extract aspect ratio to calculate dimensions
  const aspectRatio = schema.aspectRatio || "9:16";
  const [widthRatio, heightRatio] = aspectRatio.split(":").map(Number);

  // Default dimensions for 9:16 aspect ratio
  let width = 1080;
  let height = 1920;

  // Adjust based on aspect ratio
  if (widthRatio && heightRatio) {
    if (widthRatio > heightRatio) {
      // Landscape
      width = 1280;
      height = Math.round((1280 * heightRatio) / widthRatio);
    } else {
      // Portrait or square
      height = 1920;
      width = Math.round((1920 * widthRatio) / heightRatio);
    }
  }

  // Process segments
  let cumulativeTime = 0; // Track time across segments in milliseconds
  if (schema.segments && Array.isArray(schema.segments)) {
    for (const segment of schema.segments) {
      const segmentDurationMs = segment.duration || 0;

      // Add video clips from segment
      if (segment.clips && Array.isArray(segment.clips)) {
        for (const clip of segment.clips) {
          if (clip.type === "video" && clip.src && Array.isArray(clip.src) && clip.src.length > 0) {
            // Convert milliseconds to microseconds
            const durationMs = clip.duration || segmentDurationMs;
            const durationUs = durationMs * 1000;
            const fromMs = clip.display?.from !== undefined ? clip.display.from : cumulativeTime;
            const toMs =
              clip.display?.to !== undefined ? clip.display.to : cumulativeTime + durationMs;
            const fromUs = fromMs * 1000;
            const toUs = toMs * 1000;

            clips.push({
              type: "Video",
              src: clip.src[0], // Use first video source
              display: {
                from: fromUs,
                to: toUs,
              },
              playbackRate: 1,
              duration: durationUs,
              // Don't set width/height - let video load naturally
              // Will be scaled to fit canvas in post-processing
              angle: 0,
              zIndex: 0,
              opacity: 1,
              flip: null,
              audio: true,
            });
          } else if (
            clip.type === "image" &&
            clip.src &&
            Array.isArray(clip.src) &&
            clip.src.length > 0
          ) {
            // Handle image clips - use segment duration if clip doesn't have display values
            const durationMs = clip.duration || segmentDurationMs;
            const durationUs = durationMs * 1000;
            const fromMs = clip.display?.from !== undefined ? clip.display.from : cumulativeTime;
            const toMs =
              clip.display?.to !== undefined ? clip.display.to : cumulativeTime + durationMs;
            const fromUs = fromMs * 1000;
            const toUs = toMs * 1000;

            clips.push({
              type: "Image",
              src: clip.src[0], // Use first image source
              display: {
                from: fromUs,
                to: toUs,
              },
              playbackRate: 1,
              duration: durationUs,
              left: 0,
              top: 0,
              width: width,
              height: height,
              angle: 0,
              zIndex: 0,
              opacity: 1,
              flip: null,
            });
          }
        }
      }

      // Add audio from textToSpeech (before incrementing cumulative time)
      if (segment.textToSpeech && segment.textToSpeech.src) {
        // Convert milliseconds to microseconds
        const durationMs = segment.textToSpeech.duration || segmentDurationMs;
        const durationUs = durationMs * 1000;
        // Audio starts at the beginning of this segment (cumulativeTime)
        const fromMs = cumulativeTime;
        const toMs = cumulativeTime + durationMs;
        const fromUs = fromMs * 1000;
        const toUs = toMs * 1000;

        clips.push({
          type: "Audio",
          src: segment.textToSpeech.src,
          display: {
            from: fromUs,
            to: toUs,
          },
          playbackRate: 1,
          duration: durationUs,
          left: 0,
          top: 0,
          width: 0,
          height: 0,
          angle: 0,
          zIndex: 0,
          opacity: 1,
          flip: null,
          loop: false,
          volume: 1,
        });
      }

      // Add captions from speechToText
      if (segment.speechToText && segment.speechToText.src) {
        try {
          // Fetch caption data from URL
          const captionData = await fetchCaptionData(segment.speechToText.src);

          if (
            captionData &&
            captionData.results &&
            captionData.results.main &&
            captionData.results.main.words
          ) {
            const words = captionData.results.main.words;

            // Group words by width
            const captionChunks = groupWordsByWidth(words, 800, 80, "Bangers-Regular", 1);

            // Create Caption clips for each chunk
            for (const chunk of captionChunks) {
              // Convert seconds to milliseconds, then to microseconds
              const chunkFromMs = chunk.from * 1000; // seconds to ms
              const chunkToMs = chunk.to * 1000; // seconds to ms
              const chunkDurationMs = chunkToMs - chunkFromMs;

              // Add cumulative time to get absolute timeline position
              const fromUs = (cumulativeTime + chunkFromMs) * 1000; // ms to μs
              const toUs = (cumulativeTime + chunkToMs) * 1000; // ms to μs
              const durationUs = chunkDurationMs * 1000; // ms to μs

              // Use actual measured dimensions from chunk, with padding
              const captionWidth = Math.ceil(chunk.width) + 40; // Add 40px horizontal padding
              const captionHeight = Math.ceil(chunk.height) + 20; // Add 20px vertical padding

              clips.push({
                type: "Caption",
                src: "",
                display: {
                  from: fromUs,
                  to: toUs,
                },
                playbackRate: 1,
                duration: durationUs,
                left: (width - captionWidth) / 2, // Center horizontally based on actual width
                top: height - 200, // Position near bottom
                width: captionWidth,
                height: captionHeight,
                angle: 0,
                zIndex: 10, // Above video/image
                opacity: 1,
                flip: null,
                text: chunk.text,
                style: {
                  fontSize: 80,
                  fontFamily: "Bangers-Regular",
                  fontWeight: "700",
                  fontStyle: "normal",
                  color: "#ffffff",
                  align: "center",
                  fontUrl:
                    "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf",
                  stroke: {
                    color: "#000000",
                    width: 4,
                  },
                  shadow: {
                    color: "#000000",
                    alpha: 0.5,
                    blur: 4,
                    offsetX: 2,
                    offsetY: 2,
                  },
                },
                caption: {
                  words: chunk.words,
                  colors: {
                    appeared: "#ffffff",
                    active: "#ffffff",
                    activeFill: "#FF5700",
                    background: "",
                    keyword: "#ffffff",
                  },
                  preserveKeywordColor: true,
                  positioning: {
                    videoWidth: width,
                    videoHeight: height,
                  },
                },
              });
            }
          }
        } catch (error) {
          console.error("Error processing caption data:", error);
        }
      }

      // Increment cumulative time by segment duration
      cumulativeTime += segmentDurationMs;
    }
  }

  return {
    clips,
    settings: {
      width,
      height,
      fps: 30,
      bgColor: "#000000",
    },
  };
};
