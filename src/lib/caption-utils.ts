import { IClip } from "@openvideo/engine-pixi";
import { generateCaptionClips } from "./caption-generator";
import { core, projectStore } from "./project";
import { nanoid } from "@openvideo/core";

export type WordsPerLineMode = "single" | "multiple";

interface RegenerateCaptionClipsOptions {
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
  captionClip,
  mode,
  fontSize,
  fontFamily,
  fontUrl,
  styleUpdate,
}: RegenerateCaptionClipsOptions) {
  if (!captionClip?.mediaId) return;

  const getAnimationObjects = (animation: string | string[], clipDuration: number) => {
    const animations = Array.isArray(animation) ? animation : [animation];
    return animations
      .filter((a) => a !== "undefined")
      .map((a) => ({
        type: a,
        options: {
          duration: CUSTOM_ANIMATIONS_CAPTIONS.includes(a) ? clipDuration : clipDuration * 0.2,
          delay: 0,
        },
      }));
  };

  const mediaId = captionClip.mediaId;
  const project = projectStore.getState();
  const clips = project.clips;
  const tracks = project.tracks;

  const siblingClips: any[] = [];

  tracks.forEach((track: any) => {
    track.clipIds.forEach((id: string) => {
      const c = clips[id];
      if (c && c.type === "Caption" && (c as any).mediaId === mediaId) {
        siblingClips.push(c);
      }
    });
  });

  siblingClips.sort((a, b) => a.display.from - b.display.from);

  if (siblingClips.length === 0) return;

  const mediaClip = clips[mediaId];
  if (!mediaClip || !mediaClip.display) return;

  const mediaStartUs = mediaClip.display.from;
  const allWords: any[] = [];

  siblingClips.forEach((c) => {
    const clipStartUs = c.display.from;
    const words = c.words || c.originalOpts?.words || c.originalOpts?.caption?.words || [];
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
    videoWidth: project.settings.width,
    videoHeight: project.settings.height,
    words: allWords,
    mode: mode,
    fontSize: fontSize || currentOpts.fontSize || 80,
    fontFamily: fontFamily || currentOpts.fontFamily || "Bangers-Regular",
    fontUrl: fontUrl || currentOpts.fontUrl,
    style: combinedStyle,
  });

  // Find track ID using project state
  const targetTrack = tracks.find((t) => t.clipIds.includes(captionClip.id));
  const trackId = targetTrack?.id;
  if (!trackId) return;

  const clipsToAdd: any[] = [];
  const paddingY = styleUpdate?.textBoxStyle?.verticalPadding ?? 0;

  for (const json of newClipsJSON) {
    const uniformTop = json.top != null ? json.top - paddingY * 3 : 0;
    const enrichedJson: any = {
      ...json,
      mediaId,
      wordsPerLine: mode,
      top: uniformTop,
      angle: captionClip.angle !== undefined ? captionClip.angle : json.angle,
      opacity: captionClip.opacity !== undefined ? captionClip.opacity : json.opacity,
      zIndex: captionClip.zIndex !== undefined ? captionClip.zIndex : json.zIndex,
      flip: captionClip.flip !== undefined ? captionClip.flip : json.flip,
      textBoxStyle: styleUpdate?.textBoxStyle,
      caption: {
        ...json.caption,
        ...(captionClip.caption || {}),
        words: json.caption.words,
        colors: {
          ...(json.caption?.colors || {}),
          ...(captionClip.caption?.colors || {}),
        },
        textBoxStyle: styleUpdate?.textBoxStyle,
      },
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
        ...(styleUpdate?.textBoxStyle ? { textBoxStyle: styleUpdate.textBoxStyle } : {}),
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
      if (styleUpdate.fill) enrichedJson.fill = styleUpdate.fill;
      if (styleUpdate.align) enrichedJson.align = styleUpdate.align;
      if (styleUpdate.fontFamily) enrichedJson.fontFamily = styleUpdate.fontFamily;
      if (styleUpdate.fontUrl) enrichedJson.fontUrl = styleUpdate.fontUrl;
      if (styleUpdate.fontSize) enrichedJson.fontSize = styleUpdate.fontSize;

      if (styleUpdate.strokeWidth !== undefined || styleUpdate.stroke) {
        if (typeof enrichedJson.stroke !== "object" || enrichedJson.stroke === null) {
          enrichedJson.stroke = {
            color: typeof enrichedJson.stroke === "string" ? enrichedJson.stroke : "#000000",
            width: 0,
          };
        }
        if (styleUpdate.strokeWidth !== undefined)
          enrichedJson.stroke.width = styleUpdate.strokeWidth;
        if (styleUpdate.stroke) enrichedJson.stroke.color = styleUpdate.stroke;
      }

      if (styleUpdate.dropShadow) {
        enrichedJson.dropShadow = {
          color: styleUpdate.dropShadow.color,
          alpha: styleUpdate.dropShadow.alpha,
          blur: styleUpdate.dropShadow.blur,
          distance: styleUpdate.dropShadow.distance,
          angle: styleUpdate.dropShadow.angle,
        };
      }

      if (styleUpdate.textCase) enrichedJson.textCase = styleUpdate.textCase;

      if (styleUpdate.wordAnimation) enrichedJson.wordAnimation = styleUpdate.wordAnimation;

      if (styleUpdate.textBoxStyle) {
        enrichedJson.textBoxStyle = styleUpdate.textBoxStyle;
        if (!enrichedJson.caption) enrichedJson.caption = {};
        enrichedJson.caption.textBoxStyle = styleUpdate.textBoxStyle;
      }

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

    clipsToAdd.push(enrichedJson);
  }

  // 3. Atomically remove and add clips via Core batch
  const fullClips = await Promise.all(clipsToAdd.map((c) => core.clip.prepare(c as any)));

  const removeCommand = {
    id: nanoid(),
    type: "clip.remove",
    payload: { ids: siblingClips.map((c) => c.id) },
  };

  const addCommands = fullClips.map((clip) => ({
    id: nanoid(),
    type: "clip.add",
    payload: { clip, trackId },
  }));

  core.batch([removeCommand, ...addCommands] as any[]);

  return clipsToAdd;
}
