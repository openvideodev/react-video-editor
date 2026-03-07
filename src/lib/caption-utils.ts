import { Studio, IClip, jsonToClip } from "openvideo";
import { generateCaptionClips } from "./caption-generator";

export type WordsPerLineMode = "single" | "multiple";

interface RegenerateCaptionClipsOptions {
  studio: Studio;
  captionClip: any;
  mode: WordsPerLineMode;
  fontSize?: number;
  fontFamily?: string;
  fontUrl?: string;
  styleUpdate?: any;
}

const CUSTOM_ANIMATIONS_CAPTIONS = [
  "charTypewriter",
  "scaleMidCaption",
  "scaleDownCaption",
  "upDownCaption",
  "upLeftCaption",
  "fadeByWord",
  "slideFadeByWord",
];

export async function regenerateCaptionClips({
  studio,
  captionClip,
  mode,
  fontSize,
  fontFamily,
  fontUrl,
  styleUpdate,
}: RegenerateCaptionClipsOptions) {
  if (!studio || !captionClip?.mediaId) return;
  console.log("styleUpdate", styleUpdate);

  const getAnimationObjects = (animation: string | string[], clipDuration: number) => {
    const animations = Array.isArray(animation) ? animation : [animation];
    return animations
      .filter((a) => a !== "undefined")
      .map((a) => ({
        type: a,
        opts: {
          duration: CUSTOM_ANIMATIONS_CAPTIONS.includes(a) ? clipDuration : clipDuration * 0.2,
          delay: 0,
        },
      }));
  };

  const mediaId = captionClip.mediaId;
  const tracks = studio.getTracks();
  const siblingClips: any[] = [];

  tracks.forEach((track: any) => {
    track.clipIds.forEach((id: string) => {
      const c = studio.getClipById(id);
      if (c && c.type === "Caption" && (c as any).opts.mediaId === mediaId) {
        siblingClips.push(c);
      }
    });
  });

  siblingClips.sort((a, b) => a.display.from - b.display.from);

  if (siblingClips.length === 0) return;

  const uniformTop = captionClip.top ?? 0;

  const mediaClip = studio.getClipById(mediaId);
  if (!mediaClip) return;

  const mediaStartUs = mediaClip.display.from;
  const allWords: any[] = [];

  siblingClips.forEach((c) => {
    const clipStartUs = c.display.from;
    const words = c.words || [];
    words.forEach((w: any) => {
      allWords.push({
        ...w,
        start: (clipStartUs + w.from * 1000 - mediaStartUs) / 1000000,
        end: (clipStartUs + w.to * 1000 - mediaStartUs) / 1000000,
      });
    });
  });

  if (allWords.length === 0) return;

  // Merge style updates if provided
  const combinedStyle = {
    ...captionClip.style,
    ...(styleUpdate || {}),
  };

  const currentOpts = captionClip.originalOpts || {};
  const newClipsJSON = await generateCaptionClips({
    videoWidth: (studio as any).opts.width,
    videoHeight: (studio as any).opts.height,
    words: allWords,
    mode: mode,
    fontSize: fontSize || currentOpts.fontSize || 80,
    fontFamily: fontFamily || currentOpts.fontFamily || "Bangers-Regular",
    fontUrl: fontUrl || currentOpts.fontUrl,
    style: combinedStyle,
  });

  const trackId = studio.findTrackIdByClipId(captionClip.id);
  if (!trackId) return;

  // Optimistically update siblings (though they will be replaced)
  siblingClips.forEach((c) => {
    try {
      (c as any).wordsPerLine = mode;
      if ((c as any).opts) (c as any).opts.wordsPerLine = mode;
      if ((c as any).originalOpts) (c as any).originalOpts.wordsPerLine = mode;
      (c as any).emit && (c as any).emit("propsChange", {});
    } catch (e) {
      // ignore
    }
  });

  const clipsToAdd: IClip[] = [];

  for (const json of newClipsJSON) {
    const enrichedJson = {
      ...json,
      mediaId,
      wordsPerLine: mode,
      top: uniformTop,
      originalOpts: {
        ...(json.originalOpts || {}),
        wordsPerLine: mode,
        ...(styleUpdate?.caption ? { caption: styleUpdate.caption } : {}),
        ...(styleUpdate?.animation && {
          animations: getAnimationObjects(
            styleUpdate.animation,
            json.display.to - json.display.from,
          ),
        }),
        ...(styleUpdate?.wordAnimation ? { wordAnimation: styleUpdate.wordAnimation } : {}),
      },
      opts: {
        ...(json.opts || {}),
        wordsPerLine: mode,
        ...(styleUpdate?.caption ? { caption: styleUpdate.caption } : {}),
        ...(styleUpdate?.animation && {
          animations: getAnimationObjects(
            styleUpdate.animation,
            json.display.to - json.display.from,
          ),
        }),
        ...(styleUpdate?.wordAnimation ? { wordAnimation: styleUpdate.wordAnimation } : {}),
      },
      animations: styleUpdate?.animation
        ? getAnimationObjects(styleUpdate.animation, json.display.to - json.display.from)
        : [],
      display: {
        from: json.display.from + mediaStartUs,
        to: json.display.to + mediaStartUs,
      },
    };

    // If styleUpdate contains other caption fields, ensure they are applied
    if (styleUpdate) {
      if (styleUpdate.fill) enrichedJson.style.color = styleUpdate.fill;
      if (styleUpdate.align) enrichedJson.style.align = styleUpdate.align;
      if (styleUpdate.fontFamily) enrichedJson.style.fontFamily = styleUpdate.fontFamily;
      if (styleUpdate.fontUrl) enrichedJson.style.fontUrl = styleUpdate.fontUrl;

      if (styleUpdate.strokeWidth !== undefined || styleUpdate.stroke) {
        if (typeof enrichedJson.style.stroke !== "object" || enrichedJson.style.stroke === null) {
          enrichedJson.style.stroke = {
            color:
              typeof enrichedJson.style.stroke === "string" ? enrichedJson.style.stroke : "#000000",
            width: 0,
          };
        }
        if (styleUpdate.strokeWidth !== undefined)
          enrichedJson.style.stroke.width = styleUpdate.strokeWidth;
        if (styleUpdate.stroke) enrichedJson.style.stroke.color = styleUpdate.stroke;
      }

      if (styleUpdate.dropShadow) {
        enrichedJson.style.shadow = {
          color: styleUpdate.dropShadow.color,
          alpha: styleUpdate.dropShadow.alpha,
          blur: styleUpdate.dropShadow.blur,
          offsetX: styleUpdate.dropShadow.distance * Math.cos(styleUpdate.dropShadow.angle),
          offsetY: styleUpdate.dropShadow.distance * Math.sin(styleUpdate.dropShadow.angle),
        };
      }

      if (styleUpdate.textCase) enrichedJson.style.textCase = styleUpdate.textCase;

      if (styleUpdate.wordAnimation) enrichedJson.style.wordAnimation = styleUpdate.wordAnimation;

      if (styleUpdate.caption) {
        if (!enrichedJson.caption) enrichedJson.caption = {};
        enrichedJson.caption = {
          ...enrichedJson.caption,
          ...styleUpdate.caption,
          colors: {
            ...(enrichedJson.caption.colors || {}),
            ...(styleUpdate.caption.colors || {}),
          },
        };
      }
    }

    const clip = await jsonToClip(enrichedJson);
    clipsToAdd.push(clip);
  }

  siblingClips.forEach((c) => studio.removeClipById(c.id));
  await studio.addClip(clipsToAdd, { trackId });

  return clipsToAdd;
}
