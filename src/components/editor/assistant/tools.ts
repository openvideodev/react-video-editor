import { usePlaybackStore } from "@/stores/playback-store";
import {
  Video,
  Image,
  Text,
  Audio,
  Studio,
  Effect,
  IClip,
  fontManager,
  jsonToClip,
} from "openvideo";
import { duplicateClip, splitClip, trimClip } from "./action-handlers";
import { useTimelineStore } from "@/stores/timeline-store";
import { generateCaptionClips } from "@/lib/caption-generator";

export const handleAddClip = async (input: any, studio: Studio) => {
  const { text, prompt, assetType, targetId, duration, width, height, left, top, action } = input;
  const from = input.from ?? 0;
  const to = input.to ? (input.to - from < 1 ? 1 : input.to) : from + 5;

  let clip;
  const type =
    assetType ||
    (action === "add_text"
      ? "text"
      : action === "add_image"
        ? "image"
        : action === "add_video"
          ? "video"
          : action === "add_audio"
            ? "audio"
            : "video");

  if (type === "video" && prompt) {
    console.log("video prompt: ", prompt);
    const url =
      "https://cdn.scenify.io/AUTOCROP/VIDEO/e4545b0a-56e8-4982-80af-9b51094909f7/ec042fbe-01d8-4ef2-8389-c166eae76a77.mp4";
    clip = await Video.fromUrl(url);
  } else if (type === "image" && prompt) {
    console.log("image prompt: ", prompt);
    const url = "https://picsum.photos/800/600";
    clip = await Image.fromUrl(url);
  } else if (type === "text" && (text || input.text)) {
    clip = new Text(text || input.text, {
      fontSize: 100,
      fill: "#ffffff",
      fontFamily: "Inter",
    });
  } else if (type === "audio" && prompt) {
    console.log("audio prompt: ", prompt);
    const url =
      "https://cdn.scenify.io/AUTOCROP/VIDEO/e4545b0a-56e8-4982-80af-9b51094909f7/ec042fbe-01d8-4ef2-8389-c166eae76a77.mp4";
    clip = await Audio.fromUrl(url);
  }

  if (clip) {
    if (targetId) (clip as any).id = targetId;
    if (width) clip.width = width;
    if (height) clip.height = height;
    if (left !== undefined) clip.left = left;
    if (top !== undefined) clip.top = top;
    if (duration) clip.duration = duration * 1000000;

    // Apply display timing (convert to microseconds)
    clip.update({
      duration: (to - from) * 1000000,
      display: {
        from: from * 1000000,
        to: to * 1000000,
      },
    });

    studio.addClip(clip);
  }
};

export const handleUpdateClip = async (input: any, studio: Studio) => {
  const {
    left,
    top,
    width,
    height,
    start,
    targetId,
    clipId,
    fontSize,
    fontFamily,
    fill,
    opacity,
    volume,
    playbackRate,
  } = input;
  const id = targetId || clipId;
  if (!id) return;

  const updates: any = {};
  if (left !== undefined) updates.left = left;
  if (top !== undefined) updates.top = top;
  if (width !== undefined) updates.width = width;
  if (height !== undefined) updates.height = height;
  if (start !== undefined) updates.display = { ...updates.display, from: start * 1000000 };
  if (fontSize !== undefined) updates.fontSize = fontSize;
  if (fontFamily !== undefined) updates.fontFamily = fontFamily;
  if (fill !== undefined) updates.fill = fill;
  if (opacity !== undefined) updates.opacity = opacity;
  if (volume !== undefined) updates.volume = volume;
  if (playbackRate !== undefined) updates.playbackRate = playbackRate;

  await studio.updateClip(id, updates);
};

export const handleRemoveClip = async (input: any, studio: Studio) => {
  const id = input.targetId || input.clipId;
  const clip = studio.getClipById(id);
  if (clip) {
    console.log("delete clip:", clip);
    await studio.removeClip(id);
  }
};

export const handleSplitClip = async (input: any, studio: Studio) => {
  const id = input.targetId || input.clipId;
  const splitTime = input.time || usePlaybackStore.getState().currentTime;
  const clip = studio.getClipById(id);
  if (clip && splitTime) {
    await splitClip(
      id,
      splitTime,
      studio,
      useTimelineStore,
      useTimelineStore.getState().updateClip,
    );
  } else if (splitTime) {
    await studio.splitSelected(splitTime * 1_000_000);
  }
};

export const handleTrimClip = async (input: any, studio: Studio) => {
  const id = input.targetId || input.clipId;
  const clip = studio.getClipById(id);
  if (clip) {
    await trimClip(
      id,
      { from: input.trimFrom, to: 0 }, // This handler expects timeline and display, need to check logic
      { from: 0, to: 0 },
      studio,
      useTimelineStore.getState().updateClip,
    );
  } else {
    await studio.trimSelected(input.trimFrom);
  }
};

export const handleAddTransition = async (input: any, studio: Studio) => {
  const { fromId, toId, transitionType } = input;
  if (fromId && toId && transitionType) {
    await studio.addTransition(transitionType || "GridFlip", 2_000_000, fromId, toId);
  }
};

export const handleAddEffect = async (input: any, studio: Studio) => {
  const from = input.from ?? 0;
  const to = input.to ? (input.to - from < 1 ? 1 : input.to) : from + 5;

  const effectClip = new Effect(input.effectName);

  // Default positioning (5 seconds)
  effectClip.display.from = from * 1_000_000;
  effectClip.duration = (to - from) * 1_000_000;
  effectClip.display.to = to * 1_000_000;

  // In a real scenario, we might want to attach this effect to the targetId
  // For now, we just add it to the timeline as requested by the tool
  await studio.addClip(effectClip);
};

export const handleDuplicateClip = async (input: any, studio: Studio) => {
  const id = input.targetId || input.clipId;
  const clip = studio.getClipById(id);
  if (clip) {
    console.log("duplicate clip:", clip);
    await duplicateClip(id, studio, useTimelineStore);
  } else {
    await studio.duplicateSelected();
  }
};

export const handleSearchAndAddMedia = async (input: any, studio: Studio) => {
  const { query, type, targetId, from: fromTime } = input;
  const from = fromTime ?? usePlaybackStore.getState().currentTime / 1000;
  console.log({ input });
  try {
    const response = await fetch(
      `/api/pexels?query=${encodeURIComponent(query)}&type=${type || "video"}`,
    );
    const data = await response.json();

    let clip;
    if (type === "image") {
      const imageUrl = data.photos?.[0]?.src?.large;
      if (imageUrl) {
        clip = await Image.fromUrl(imageUrl);
      }
    } else {
      const videoUrl = data.videos?.[0]?.video_files?.[0]?.link;
      if (videoUrl) {
        clip = await Video.fromUrl(videoUrl);
      }
    }

    if (clip) {
      if (targetId) (clip as any).id = targetId;
      // clip.update({
      //   display: {
      //     from: from * 1000000,
      //     to: (from + 5) * 1000000,
      //   },
      // });
      await studio.scaleToFit(clip);
      await studio.centerClip(clip);
      studio.addClip(clip);
    }
  } catch (error) {
    console.error("Failed to search and add media:", error);
  }
};

export const handleGenerateVoiceover = async (input: any, studio: Studio) => {
  const { text, voiceId, targetId, from: fromTime } = input;
  const from = fromTime ?? usePlaybackStore.getState().currentTime / 1000;

  try {
    const response = await fetch("/api/elevenlabs/voiceover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    });
    const data = await response.json();

    if (data.url) {
      const clip = await Audio.fromUrl(data.url);
      if (targetId) (clip as any).id = targetId;
      clip.update({
        display: {
          from: from * 1000000,
          to: (from + clip.duration / 1000000) * 1000000,
        },
      });
      studio.addClip(clip);
    }
  } catch (error) {
    console.error("Failed to generate voiceover:", error);
  }
};

export const handleSeekToTime = async (input: any, studio: Studio) => {
  const { time } = input;
  usePlaybackStore.getState().seek(time * 1000); // seeks uses ms
};

export const handleGenerateCaptions = async (input: any, studio: Studio) => {
  const { clipIds } = input;
  const targetIds =
    clipIds ||
    studio.clips
      .filter((c: IClip) => c.type === "video" || c.type === "audio")
      .map((c: IClip) => c.id);

  console.log({ clipIds, targetIds });

  try {
    const fontName = "Bangers-Regular";
    const fontUrl = "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf";

    await fontManager.addFont({
      name: fontName,
      url: fontUrl,
    });

    const captionTrackId = `track_captions_${Date.now()}`;
    const clipsToAdd: IClip[] = [];

    for (const id of targetIds) {
      const clip = studio.getClipById(id);
      console.log({ clip });
      if (!clip || !clip.src) continue;

      try {
        const response = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: clip.src }),
        });
        const data = await response.json();

        const words = data.results?.main?.words || data.words || [];

        if (words.length > 0) {
          const captionClipsJSON = await generateCaptionClips({
            videoWidth: (studio as any).opts.width,
            videoHeight: (studio as any).opts.height,
            words,
          });

          for (const json of captionClipsJSON) {
            const enrichedJson = {
              ...json,
              mediaId: clip.id,
              metadata: {
                ...json.metadata,
                sourceClipId: clip.id,
              },
              display: {
                from: json.display.from + clip.display.from,
                to: json.display.to + clip.display.from,
              },
            };
            const captionClip = await jsonToClip(enrichedJson);
            clipsToAdd.push(captionClip);
          }
        }
      } catch (error) {
        console.error(`Failed to generate captions for clip ${id}:`, error);
      }
    }

    if (clipsToAdd.length > 0) {
      await studio.addClip(clipsToAdd, { trackId: captionTrackId });
    }
  } catch (error) {
    console.error("Failed to generate captions:", error);
  }
};
