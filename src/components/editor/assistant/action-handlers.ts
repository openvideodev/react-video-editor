import { clipToJSON, Effect, IClip, jsonToClip, Studio } from "openvideo";
import { generateUUID } from "@/utils/id";
import { usePlaybackStore } from "@/stores/playback-store";

export const duplicateClip = async (clipId: string, studio: Studio | null, timelineStore: any) => {
  if (!studio) return;

  const state = timelineStore.getState();
  const originalClip = state.clips[clipId];
  if (!originalClip) return;

  const track = state.tracks.find((t: any) => t.clipIds.includes(clipId));
  if (!track) return;

  const studioClip = studio.getClip(clipId);
  if (!studioClip) {
    return;
  }

  const json = clipToJSON(studioClip as any);
  const newClip = await jsonToClip(json);
  const newClipId = generateUUID();
  newClip.id = newClipId;

  const newTrackId = generateUUID();
  const newTrackName = `${track.name} (Copy)`;

  studio.addTrack({
    id: newTrackId,
    name: newTrackName,
    type: track.type,
  });

  await studio.addClip(newClip, { trackId: newTrackId });
  studio.selectClipsByIds([newClipId]);

  return newClipId;
};

export const deleteClip = async (
  clipId: string,
  studio: any,
  removeClips: (ids: string[]) => void,
) => {
  removeClips([clipId]);
  if (studio) {
    await studio.removeClipById(clipId);
  }
};

export const splitClip = async (
  clipId: string,
  splitTime: number,
  studio: Studio | null,
  timelineStore: any,
  updateClip: (id: string, updates: any) => void,
) => {
  const splitTimeUs = splitTime * 1000;

  if (!studio) return;

  const studioClip = studio.getClip(clipId);
  if (!studioClip) {
    return;
  }

  const originalJson = clipToJSON(studioClip as any);
  const splitOffset = splitTimeUs - studioClip.display.from;
  const playbackRate = studioClip.playbackRate || 1;
  const splitOffsetInSource = splitOffset * playbackRate;

  const updates: any = {
    duration: splitOffset,
    display: {
      from: studioClip.display.from,
      to: splitTimeUs,
    },
  };

  if (studioClip.trim) {
    updates.trim = {
      from: studioClip.trim.from,
      to: studioClip.trim.from + splitOffsetInSource,
    };
  }

  await studio.updateClip(clipId, updates);
  updateClip(clipId, updates);

  const newJson = { ...originalJson };
  newJson.display = {
    from: splitTimeUs,
    to: newJson.display.to,
  };
  newJson.duration = newJson.duration - splitOffset;

  if (newJson.trim) {
    newJson.trim = {
      from: newJson.trim.from + splitOffsetInSource,
      to: newJson.trim.to,
    };
  }

  const newClip = await jsonToClip(newJson);
  const newClipId = generateUUID();
  newClip.id = newClipId;

  const track = timelineStore.getState().tracks.find((t: any) => t.clipIds.includes(clipId));
  if (track) {
    await studio.addClip(newClip, { trackId: track.id });
    studio.selectClipsByIds([newClipId]);
  }

  return newClipId;
};

export const trimClip = async (
  clipId: string,
  timeline: { from: number; to: number }, // milliseconds (source trim range)
  display: { from: number; to: number }, // milliseconds (timeline position)
  studio: Studio | null,
  updateClip: (
    clipId: string,
    updates: {
      displayFrom?: number;
      duration?: number;
      trim?: { from: number; to: number };
    },
  ) => void,
) => {
  if (!studio) return;

  const currentClip = studio.getClip(clipId);
  if (!currentClip) {
    return;
  }

  const playbackRate = currentClip.playbackRate || 1;

  // 1. Calculate Trim (Source Range) in microseconds
  // Default to current trim if not provided
  const currentTrimFromUs = currentClip.trim?.from ?? 0;
  const currentTrimToUs =
    currentClip.trim?.to ?? ((currentClip as any).sourceDuration || currentClip.duration);

  const newTrimFromUs = timeline.from !== undefined ? timeline.from * 1000 : currentTrimFromUs;
  const newTrimToUs = timeline.to !== undefined ? timeline.to * 1000 : currentTrimToUs;

  // 2. Calculate Duration based on Trim and PlaybackRate
  // The user specified that the timeline range (trim) should predominate for duration
  const newSourceDurationUs = newTrimToUs - newTrimFromUs;
  const newDurationUs = newSourceDurationUs / playbackRate;

  // 3. Calculate Display (Timeline Position) in microseconds
  // Default to current display.from if not provided
  const newDisplayFromUs =
    display.from !== undefined ? display.from * 1000 : currentClip.display.from;
  const newDisplayToUs = newDisplayFromUs + newDurationUs;

  const updates: any = {
    duration: newDurationUs,
    display: {
      from: newDisplayFromUs,
      to: newDisplayToUs,
    },
    trim: {
      from: newTrimFromUs,
      to: newTrimToUs,
    },
  };

  await studio.updateClip(clipId, updates);

  // 4. Sync changes back to the store
  updateClip(clipId, {
    displayFrom: newDisplayFromUs,
    duration: newDurationUs,
    trim: { from: newTrimFromUs, to: newTrimToUs },
  });

  // Update global duration
  usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
};

export const applyEffectClip = async (
  name: string,
  timeline: { from: number; to: number },
  addClip: (clip: IClip, options?: any) => Promise<void>,
) => {
  const from = timeline.from * 1000;
  const to = timeline.to * 1000;
  const duration = to - from;

  const clip = new Effect(name);
  clip.duration = duration; // 5 seconds
  clip.display = { from, to };
  addClip(clip);
};
