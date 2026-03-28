import { useEffect } from "react";
import { useTimelineStore } from "@/stores/timeline-store";
import { useStudioStore } from "@/stores/studio-store";
import { usePlaybackStore } from "@/stores/playback-store";
import type { ITimelineTrack, IClip, TrackType } from "@/types/timeline";
import type { TimelineCanvas } from "./timeline";
import { generateUUID } from "@/utils/id";
import { clipToJSON, type IClip as StudioClip } from "openvideo";

interface TimelineStudioSyncProps {
  timelineCanvas?: TimelineCanvas | null;
}

export const TimelineStudioSync = ({ timelineCanvas }: TimelineStudioSyncProps) => {
  const { studio } = useStudioStore();
  const { setTracks, tracks, updateClip, updateClips, removeClips } = useTimelineStore();

  // Sync Studio -> Store
  // When Studio emits events (e.g. from MediaPanel adding clips), update Store
  useEffect(() => {
    if (!studio) return;

    const handleClipAdded = ({ clip, trackId }: { clip: IClip; trackId: string }) => {
      // Sync duration on clip add
      // Studio uses microseconds, PlaybackStore uses seconds
      usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);

      // We need to add clip to the store
      // Check if clip already exists (avoid loops)
      const storeState = useTimelineStore.getState();
      if (storeState.clips[clip.id]) return;

      // Find or create track
      // Note: setTracks in store might be needed.
      // Complex part: Studio has the authoritative "Clip" object. Store needs it.
      const newClips = { ...storeState.clips, [clip.id]: clip };
      // Update track
      const newTracks = storeState._tracks.map((t) => {
        if (t.id === trackId) {
          return { ...t, clipIds: [...t.clipIds, clip.id] };
        }
        return t;
      });

      // If track didn't exist in store (e.g. new track from Studio), we might need to sync tracks first?
      // Let's rely on track:added event for that.

      // However, studio.addClip might auto-create a track.
      // Let's handle clip:added by manually updating store state fully.

      useTimelineStore.setState((state) => {
        const serializedClip = clipToJSON(clip as unknown as StudioClip);
        const updatedClips = {
          ...state.clips,
          [clip.id]: {
            ...serializedClip,
            id: (serializedClip.id || clip.id) as string,
            sourceDuration: (clip as any).meta?.duration || clip.duration,
          },
        };

        const updatedTracks = state._tracks.map((t) => {
          if (t.id === trackId && !t.clipIds.includes(clip.id)) {
            return { ...t, clipIds: [...t.clipIds, clip.id] };
          }
          return t;
        });
        return {
          ...state,
          clips: updatedClips,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    };

    const handleClipRemoved = ({ clipId }: { clipId: string }) => {
      // Sync duration on clip remove
      // Studio uses microseconds, PlaybackStore uses seconds
      usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);

      useTimelineStore.setState((state) => {
        const { [clipId]: removed, ...restClips } = state.clips;
        // Remove from tracks
        const updatedTracks = state._tracks.map((t) => ({
          ...t,
          clipIds: t.clipIds.filter((id) => id !== clipId),
        }));
        return {
          ...state,
          clips: restClips,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    };

    const handleClipsRemoved = ({ clipIds }: { clipIds: string[] }) => {
      // Sync duration on clips removed
      if (studio) {
        usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
      }

      useTimelineStore.setState((state) => {
        const newClips = { ...state.clips };
        clipIds.forEach((id) => delete newClips[id]);

        // Remove from tracks
        const updatedTracks = state._tracks.map((t) => ({
          ...t,
          clipIds: t.clipIds.filter((id) => !clipIds.includes(id)),
        }));

        return {
          ...state,
          clips: newClips,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    };

    const handleTrackAdded = ({ track, index }: { track: any; index?: number }) => {
      useTimelineStore.setState((state) => {
        if (state._tracks.find((t) => t.id === track.id)) return state;
        const updatedTracks = [...state._tracks];

        if (typeof index === "number") {
          updatedTracks.splice(index, 0, track);
        } else {
          updatedTracks.unshift(track);
        }

        return {
          ...state,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    };

    const handleTrackOrderChanged = ({ tracks }: { tracks: any[] }) => {
      useTimelineStore.setState((state) => ({
        ...state,
        _tracks: tracks,
        tracks: tracks,
      }));
    };

    const handleTrackRemoved = ({ trackId }: { trackId: string }) => {
      useTimelineStore.setState((state) => ({
        ...state,
        _tracks: state._tracks.filter((t) => t.id !== trackId),
        tracks: state.tracks.filter((t) => t.id !== trackId),
      }));
    };

    const handleClipUpdated = ({ clip }: { clip: IClip }) => {
      // Sync duration on clip update
      usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);

      useTimelineStore.setState((state) => {
        if (!state.clips[clip.id]) return state;

        const serializedClip = clipToJSON(clip as unknown as StudioClip);
        const updatedClips = {
          ...state.clips,
          [clip.id]: {
            ...state.clips[clip.id],
            ...serializedClip,
            id: (serializedClip.id || clip.id) as string,
            display: { ...serializedClip.display },
            trim: serializedClip.trim ? { ...serializedClip.trim } : undefined,
          },
        };

        return {
          ...state,
          clips: updatedClips,
        };
      });
    };

    // Playback Sync Events
    const handleTimeUpdate = ({ currentTime }: { currentTime: number }) => {
      // Studio emits microseconds, Store expects seconds
      usePlaybackStore.getState().setCurrentTime(currentTime / 1_000_000);
    };

    const handlePlay = () => {
      usePlaybackStore.getState().setIsPlaying(true);
    };

    const handlePause = () => {
      usePlaybackStore.getState().setIsPlaying(false);
    };

    const handleClipsAdded = ({ clips, trackId }: { clips: IClip[]; trackId?: string }) => {
      // Sync duration on clips add
      if (studio) {
        usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
      }

      useTimelineStore.setState((state) => {
        const newClipsMap = { ...state.clips };
        const clipsToAdd: string[] = [];

        // Update clips map
        clips.forEach((clip) => {
          if (!newClipsMap[clip.id]) {
            const serializedClip = clipToJSON(clip as unknown as StudioClip);
            newClipsMap[clip.id] = {
              ...serializedClip,
              id: (serializedClip.id || clip.id) as string,
              sourceDuration: (clip as any).meta?.duration || clip.duration,
            };
            clipsToAdd.push(clip.id);
          }
        });

        if (clipsToAdd.length === 0) return state;

        // Update track
        const updatedTracks = state._tracks.map((t) => {
          if (t.id === trackId || (t.id === trackId && trackId)) {
            // Check which clips are not already in track
            const uniqueNewIds = clipsToAdd.filter((id) => !t.clipIds.includes(id));
            if (uniqueNewIds.length > 0) {
              return { ...t, clipIds: [...t.clipIds, ...uniqueNewIds] };
            }
          }
          return t;
        });

        return {
          ...state,
          clips: newClipsMap,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    };

    const handleStudioRestored = ({
      clips,
      tracks,
    }: {
      clips: IClip[];
      tracks: ITimelineTrack[];
    }) => {
      // 1. Sync Duration
      if (studio) {
        usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
        usePlaybackStore.getState().setCurrentTime(0);
        usePlaybackStore.getState().setIsPlaying(false);
      }

      // 2. Map clips to store format
      const newClipsMap: Record<string, any> = {};
      clips.forEach((c) => {
        const serialized = clipToJSON(c as unknown as StudioClip);
        newClipsMap[c.id] = {
          ...serialized,
          id: (serialized.id || c.id) as string,
          sourceDuration: (c as any).meta?.duration || c.duration,
        };
      });

      // 3. Update Store fully
      useTimelineStore.setState((state) => ({
        ...state,
        clips: newClipsMap,
        _tracks: tracks,
        tracks: tracks,
      }));
    };

    const handleClipReplaced = ({
      newClip,
    }: {
      oldClip: IClip;
      newClip: IClip;
      trackId: string;
    }) => {
      useTimelineStore.setState((state) => {
        if (!state.clips[newClip.id]) return state;

        const serializedClip = clipToJSON(newClip as unknown as StudioClip);
        const updatedClips = {
          ...state.clips,
          [newClip.id]: {
            ...state.clips[newClip.id],
            ...serializedClip,
            id: (serializedClip.id || newClip.id) as string,
            display: { ...serializedClip.display },
            trim: serializedClip.trim ? { ...serializedClip.trim } : undefined,
            sourceDuration: (newClip as any).meta?.duration || newClip.duration,
          },
        };

        return {
          ...state,
          clips: updatedClips,
        };
      });
    };

    studio.on("clip:added", handleClipAdded);
    studio.on("clips:added", handleClipsAdded);
    studio.on("clip:removed", handleClipRemoved);
    studio.on("clips:removed", handleClipsRemoved);
    studio.on("clip:updated", handleClipUpdated);
    studio.on("clip:replaced", handleClipReplaced);
    studio.on("track:added", handleTrackAdded as any);
    studio.on("track:order-changed", handleTrackOrderChanged as any);
    studio.on("track:removed", handleTrackRemoved);
    studio.on("studio:restored", handleStudioRestored as any);

    studio.on("currentTime", handleTimeUpdate);
    studio.on("play", handlePlay);
    studio.on("pause", handlePause);

    // Initial sync
    // Studio uses microseconds, PlaybackStore uses seconds
    usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
    usePlaybackStore.getState().setCurrentTime(studio.getCurrentTime() / 1_000_000);
    usePlaybackStore.getState().setIsPlaying(studio.getIsPlaying());

    return () => {
      studio.off("clip:added", handleClipAdded);
      studio.off("clips:added", handleClipsAdded);
      studio.off("clip:removed", handleClipRemoved);
      studio.off("clips:removed", handleClipsRemoved);
      studio.off("clip:updated", handleClipUpdated);
      studio.off("clip:replaced", handleClipReplaced);
      studio.off("track:added", handleTrackAdded);
      studio.off("track:order-changed", handleTrackOrderChanged as any);
      studio.off("track:removed", handleTrackRemoved);
      studio.off("studio:restored", handleStudioRestored as any);

      studio.off("currentTime", handleTimeUpdate);
      studio.off("play", handlePlay);
      studio.off("pause", handlePause);
    };
  }, [studio]);

  // Sync TimelineCanvas -> Store
  // When clips are modified/moved in the timeline canvas, update the store
  useEffect(() => {
    if (!timelineCanvas) return;
    const handleClipModified = async ({
      clipId,
      displayFrom,
      duration,
      trim,
    }: {
      clipId: string;
      displayFrom: number;
      duration: number;
      trim?: { from: number; to: number };
    }) => {
      // TimelineCanvas Events are ALREADY in MICROSECONDS

      // Update Store
      updateClip(clipId, { displayFrom, duration, trim });

      if (!studio) return;

      // Transition clips need special handling: just calling studio.updateClip is not enough.
      // The engine also needs the adjacent clips' `transition` metadata updated and the
      // cached transition renderer cleared — exactly what handleUpdate in transition-properties does.
      const storeClip = useTimelineStore.getState().clips[clipId];
      if (storeClip?.type === "Transition") {
        const transitionClip = storeClip as any;
        const fromClipId = transitionClip.fromClipId;
        const toClipId = transitionClip.toClipId;
        const transitionKey = transitionClip.transitionEffect?.key ?? "GridFlip";

        if (fromClipId && toClipId) {
          const fromClip = studio.timeline.getClipById(fromClipId);
          const toClip = studio.timeline.getClipById(toClipId);

          if (fromClip && toClip) {
            const transitionStart = toClip.display.from - duration / 2;
            const transitionEnd = transitionStart + duration;

            const transitionMeta = {
              key: transitionKey,
              name: transitionKey,
              duration,
              fromClipId,
              toClipId,
              start: Math.max(0, transitionStart),
              end: transitionEnd,
            };

            // Clear the cached renderer so it picks up the new duration
            const rendererKey = `${fromClipId}_${toClipId}`;
            if ((studio as any).transitionRenderers?.has(rendererKey)) {
              (studio as any).transitionRenderers.get(rendererKey)?.destroy();
              (studio as any).transitionRenderers.delete(rendererKey);
            }

            await studio.updateClips([
              {
                id: clipId,
                updates: {
                  duration,
                  display: {
                    from: Math.max(0, transitionStart),
                    to: transitionEnd,
                  },
                },
              },
              {
                id: fromClipId,
                updates: { transition: transitionMeta } as any,
              },
              {
                id: toClipId,
                updates: { transition: transitionMeta } as any,
              },
            ]);

            studio.seek(studio.currentTime);
          }
        }
      } else {
        // Update Studio for non-transition clips
        const displayTo = displayFrom + duration;
        const display = { from: displayFrom, to: displayTo };

        await studio.updateClip(clipId, {
          display,
          duration,
          trim,
        });
      }

      // Update store duration (max duration might have changed)
      // Convert µs -> s
      usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
    };

    const handleClipsModified = async ({
      clips,
    }: {
      clips: Array<{
        clipId: string;
        displayFrom: number;
        duration?: number;
        trim?: { from: number; to: number };
      }>;
    }) => {
      // TimelineCanvas Events are ALREADY in MICROSECONDS

      // Update Store
      updateClips(clips);

      if (!studio) return;

      // Update Studio for each clip
      await Promise.all(
        clips.map(async (clip) => {
          const updates: any = {};

          // Inputs are already µs
          const displayFromUs = clip.displayFrom;
          const durationUs = clip.duration;

          // Note regarding storeClip:
          // We need the current state to calculate 'to'.
          // We can get it from Studio directly to be safe, or Store.
          // Studio is authoritative for engine state.

          if (displayFromUs !== undefined) {
            // Access store instead of private studio.clips
            const storeClip = useTimelineStore.getState().clips[clip.clipId];
            // currentClip duration is already in µs
            const currentDuration = durationUs ?? storeClip?.duration ?? 0;
            const displayToUs = displayFromUs + currentDuration;

            updates.display = {
              from: displayFromUs,
              to: displayToUs,
            };
          }
          if (durationUs !== undefined) {
            updates.duration = durationUs;
          }

          if (clip.trim !== undefined) {
            updates.trim = clip.trim;
          }
          await studio.updateClip(clip.clipId, updates);
        }),
      );

      // Update store duration (max duration might have changed)
      // Convert µs -> s
      usePlaybackStore.getState().setDuration(studio.getMaxDuration() / 1_000_000);
    };

    const handleClipMovedToTrack = ({ clipId, trackId }: { clipId: string; trackId: string }) => {
      // Update the store to move the clip to the target track
      useTimelineStore.setState((state) => {
        // Remove clip from all tracks
        const updatedTracks = state._tracks.map((track) => ({
          ...track,
          clipIds: track.clipIds.filter((id) => id !== clipId),
        }));

        // Add clip to target track
        const finalTracks = updatedTracks.map((track) => {
          if (track.id === trackId && !track.clipIds.includes(clipId)) {
            return {
              ...track,
              clipIds: [...track.clipIds, clipId],
            };
          }
          return track;
        });

        const filteredTracks = finalTracks.filter((t) => t.clipIds.length > 0);

        return {
          ...state,
          _tracks: filteredTracks,
          tracks: filteredTracks,
        };
      });

      // Update studio
      if (studio) {
        studio.setTracks(useTimelineStore.getState().tracks);
      }
    };

    const handleClipMovedToNewTrack = ({
      clipId,
      targetIndex,
    }: {
      clipId: string;
      targetIndex: number;
    }) => {
      const clip = useTimelineStore.getState().clips[clipId];
      if (!clip) return;

      const newTrackId = generateUUID();
      let newTrackType: TrackType = "Video";
      if (clip.type === "Audio") newTrackType = "Audio";
      else if (clip.type === "Text" || clip.type === "Caption") newTrackType = "Text";
      else if (clip.type === "Effect") newTrackType = "Effect";
      else if (clip.type === "Video" || clip.type === "Image") newTrackType = "Video";

      const newTrack: ITimelineTrack = {
        id: newTrackId,
        type: newTrackType,
        name: `${newTrackType} Track`,
        clipIds: [clipId],
        muted: false,
      };

      useTimelineStore.setState((state) => {
        // 1. Remove from all existing tracks and filter empty ones
        const filteredTracks = state._tracks
          .map((t) => ({
            ...t,
            clipIds: t.clipIds.filter((id) => id !== clipId),
          }))
          .filter((t) => t.clipIds.length > 0);

        // 2. Insert new track at targetIndex
        const updatedTracks = [...filteredTracks];
        updatedTracks.splice(targetIndex, 0, newTrack);

        return {
          ...state,
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });

      if (studio) {
        studio.setTracks(useTimelineStore.getState().tracks);
      }
    };

    const handleTimelineUpdated = ({ tracks }: { tracks: ITimelineTrack[] }) => {
      // 1. Update Store
      setTracks(tracks);

      // 2. Update Studio
      if (studio) {
        studio.setTracks(tracks);
      }
    };

    const handleClipsRemoved = async ({ clipIds }: { clipIds: string[] }) => {
      // 1. Update Store
      removeClips(clipIds);

      // 2. Update Studio
      if (!studio) return;

      // Use batch removal method
      await studio.removeClipsById(clipIds);
    };

    const handleSelectionDuplicated = async () => {
      if (!studio) return;
      await studio.duplicateSelected();
    };

    const handleSelectionSplit = async ({ splitTime }: { splitTime: number }) => {
      if (!studio) return;
      await studio.splitSelected(splitTime);
    };

    const handleTransitionAdd = async ({
      fromClipId,
      toClipId,
    }: {
      fromClipId: string;
      toClipId: string;
    }) => {
      if (!studio) return;
      const fromClip = studio.timeline.getClipById(fromClipId);
      const toClip = studio.timeline.getClipById(toClipId);

      const minDuration = Math.min(fromClip?.duration ?? Infinity, toClip?.duration ?? Infinity);

      const duration = minDuration === Infinity ? 2_000_000 : minDuration * 0.25;

      await studio.addTransition("GridFlip", duration, fromClipId, toClipId);
    };

    const handleSelectionDelete = async () => {
      if (!studio) return;
      await studio.deleteSelected();
    };

    timelineCanvas.on("clip:modified", handleClipModified);
    timelineCanvas.on("clips:modified", handleClipsModified);
    timelineCanvas.on("clip:movedToTrack", handleClipMovedToTrack);
    timelineCanvas.on("clip:movedToNewTrack", handleClipMovedToNewTrack);
    timelineCanvas.on("timeline:updated", handleTimelineUpdated);
    timelineCanvas.on("clips:removed", handleClipsRemoved);
    timelineCanvas.on("selection:delete", handleSelectionDelete);
    timelineCanvas.on("selection:duplicated", handleSelectionDuplicated);
    timelineCanvas.on("selection:split", handleSelectionSplit);
    timelineCanvas.on("transition:add", handleTransitionAdd);

    return () => {
      timelineCanvas.off("clip:modified", handleClipModified);
      timelineCanvas.off("clips:modified", handleClipsModified);
      timelineCanvas.off("clip:movedToTrack", handleClipMovedToTrack);
      timelineCanvas.off("clip:movedToNewTrack", handleClipMovedToNewTrack);
      timelineCanvas.off("timeline:updated", handleTimelineUpdated);
      timelineCanvas.off("clips:removed", handleClipsRemoved);
      timelineCanvas.off("selection:delete", handleSelectionDelete);
      timelineCanvas.off("selection:duplicated", handleSelectionDuplicated);
      timelineCanvas.off("selection:split", handleSelectionSplit);
      timelineCanvas.off("transition:add", handleTransitionAdd);
    };
  }, [timelineCanvas, updateClip, updateClips, setTracks, studio]);

  // Sync Store -> Studio
  // Render/Playback engine needs to know about track structure
  useEffect(() => {
    if (!studio) return;

    // We only want to set tracks if they differ, or rely on Studio to be smart.
    // Studio.setTracks triggers a re-render.
    // Ideally check deeply if changes? Or just pass it.
    // For now, pass it. Optimizing later.

    // NOTE: This might cause a loop if Studio.setTracks emits events.
    // Studio.setTracks DOES NOT emit events currently in my implementation.
    // `addTrack` etc emit events. `setTracks` just sets. Good.

    // However, if we change the Store, this effect runs.
    // Then we call studio.setTracks.
    // That's fine.

    // But what if Studio event triggered the Store change?
    // 1. Studio: emits `clip:added`
    // 2. Sync: updates Store
    // 3. Store: updates `tracks`
    // 4. Sync Effect: calls `studio.setTracks(tracks)`
    // 5. Studio: sets tracks.
    // Result: Redundant setTracks call, but functionally correct (idempotent-ish).
    // As long as `studio.setTracks` doesn't emit `track:added` we are good.

    // Convert store tracks to studio tracks (Types are identical currently)
    // Only set if they actually differ to avoid infinite loops if engine emits
    const studioTracks = studio.getTracks();
    const storeTracksJson = JSON.stringify(tracks);
    const studioTracksJson = JSON.stringify(studioTracks);

    if (storeTracksJson !== studioTracksJson) {
      studio.setTracks(tracks);
    }
  }, [studio, tracks]); // Depend on `tracks`.

  // Sync Selection (Bidirectional)
  useEffect(() => {
    if (!studio || !timelineCanvas) return;

    // Studio -> Timeline
    const handleStudioSelection = ({ selected }: { selected: IClip[] }) => {
      const ids = selected.map((c) => c.id);
      timelineCanvas.selectClips(ids);
    };

    const handleStudioSelectionCleared = () => {
      timelineCanvas.selectClips([]);
    };

    // Timeline -> Studio
    const handleTimelineSelection = ({ selectedIds }: { selectedIds: string[] }) => {
      studio.selectClipsByIds(selectedIds);
    };

    studio.on("selection:created", handleStudioSelection);
    studio.on("selection:updated", handleStudioSelection);
    studio.on("selection:cleared", handleStudioSelectionCleared);

    // Listen for studio reset (e.g. New Project)
    const handleStudioReset = () => {
      useTimelineStore.getState().setTracks([]);
      useTimelineStore.getState().setClips({});
    };
    studio.on("reset", handleStudioReset);

    timelineCanvas.on("selection:changed", handleTimelineSelection);

    return () => {
      studio.off("selection:created", handleStudioSelection);
      studio.off("selection:updated", handleStudioSelection);
      studio.off("selection:cleared", handleStudioSelectionCleared);
      studio.off("reset", handleStudioReset);

      timelineCanvas.off("selection:changed", handleTimelineSelection);
    };
  }, [studio, timelineCanvas]);

  return null;
};
