import { type FabricObject } from "fabric";
import type Timeline from "../canvas";
import { clearAuxiliaryObjects } from "../guidelines/utils";
import { generateUUID } from "@/utils/id";
import { type ITimelineTrack, MICROSECONDS_PER_SECOND, type TrackType } from "@/types/timeline";
import { TIMELINE_CONSTANTS } from "../../timeline-constants";

const SNAP_OVERLAP_TOLERANCE_US = 10000; // 10ms tolerance for rounding errors during snap

/**
 * Helper to safely update the local clips map in Timeline to reflect the new visual state
 * before the asynchronous store update comes back.
 */
function updateClipTimeLocally(timeline: Timeline, clipId: string, newDisplayFrom: number) {
  const clip = timeline.clipsMap[clipId];
  if (!clip) return;

  const updatedClip = {
    ...clip,
    display: {
      ...clip.display,
      from: newDisplayFrom,
      to: newDisplayFrom + clip.duration,
    },
  };

  timeline.clipsMap[clipId] = updatedClip;
}

export function handleTrackRelocation(timeline: Timeline, options: any) {
  const target = options.target as FabricObject | undefined;
  if (!target || (target as any).isTransitionClip || target.type === "Transition") return;

  clearAuxiliaryObjects(timeline.canvas, timeline.canvas.getObjects());

  const targetAny = target as any;
  const clipId = targetAny.elementId;

  // Identify transitions involving this clip; relocation breaks them
  const transitionsToDelete = clipId
    ? Object.values(timeline.clipsMap)
        .filter(
          (c: any) => c.type === "Transition" && (c.fromClipId === clipId || c.toClipId === clipId),
        )
        .map((c) => c.id)
    : [];

  // ---------------------------------------------------------
  // 1. Handle Drop on Separator (Single Clip Only - Reverted Multi-clip)
  // ---------------------------------------------------------
  if (timeline.activeSeparatorIndex !== null) {
    // If it's an active selection, we skip separator logic to avoid issues (as requested to remove 3)
    if (targetAny.type === "activeSelection" || target.type === "activeSelection") {
      timeline.clearSeparatorHighlights();
      timeline.setActiveSeparatorIndex(null);
      timeline.canvas.requestRenderAll();
      return;
    }

    if (clipId) {
      const index = timeline.activeSeparatorIndex;

      const tracks = timeline.tracks;
      const currentTrackIndex = tracks.findIndex((t) => t.clipIds.includes(clipId));

      // Restore original Logic for Single Clip Separator Drop (plus the negative time fix)
      if (currentTrackIndex === -1) {
        // Look up via map if not found in tracks array directly?
        // Actually, let's use the same logic as before but with the local time update
      }

      const clip = timeline.clipsMap[clipId];
      if (!clip) {
        timeline.clearSeparatorHighlights();
        timeline.setActiveSeparatorIndex(null);
        return;
      }

      // Calculate new time (clamped)
      let left = target.left || 0;
      if (left < 0) left = 0;
      let newDisplayFrom = Math.round(
        (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
          MICROSECONDS_PER_SECOND,
      );
      if (newDisplayFrom < 0) newDisplayFrom = 0;

      updateClipTimeLocally(timeline, clipId, newDisplayFrom);

      let newTrackType: TrackType = "Video";
      if (clip.type === "Audio") newTrackType = "Audio";
      else if (clip.type === "Text" || clip.type === "Caption") newTrackType = "Text";
      else if (clip.type === "Effect") newTrackType = "Effect";
      else if (clip.type === "Video" || clip.type === "Image") newTrackType = "Video";

      const newTrackId = generateUUID();
      const newTrack: ITimelineTrack = {
        id: newTrackId,
        type: newTrackType,
        name: `${newTrackType} Track`,
        clipIds: [clipId],
        muted: false,
      };

      // Remove from old track
      // If the clip was in a track, we need to remove it.
      // But unlike overlap, here we have precise index target.
      const affectedTrackIds = new Set<string>();
      const currentTrack = tracks.find((t) => t.clipIds.includes(clipId));
      if (currentTrack) affectedTrackIds.add(currentTrack.id);

      const newTracksList = tracks
        .map((t) => {
          const isFilterNeeded =
            affectedTrackIds.has(t.id) || t.clipIds.some((id) => transitionsToDelete.includes(id));
          if (isFilterNeeded) {
            return {
              ...t,
              clipIds: t.clipIds.filter((id) => id !== clipId && !transitionsToDelete.includes(id)),
            };
          }
          return t;
        })
        .filter((t) => t.clipIds.length > 0);

      newTracksList.splice(index, 0, newTrack);

      timeline.setTracksInternal(newTracksList);
      timeline.render();
      timeline.emit("timeline:updated", { tracks: newTracksList });

      if (transitionsToDelete.length > 0) {
        timeline.emit("clips:removed", { clipIds: transitionsToDelete });
      }

      // Also emit clip modification to save time?
      // Yes
      timeline.emit("clip:modified", {
        clipId,
        displayFrom: newDisplayFrom,
        duration: clip.duration, // use current duration
      });

      timeline.clearSeparatorHighlights();
      timeline.setActiveSeparatorIndex(null);
      return;
    }
  }

  // ---------------------------------------------------------
  // 2. Handle Multi-selection Move (General)
  // ---------------------------------------------------------
  if (targetAny.type === "activeSelection" || target.type === "activeSelection") {
    timeline.clearSeparatorHighlights();
    timeline.setActiveSeparatorIndex(null);
    timeline.canvas.requestRenderAll();
    return;
  }

  // ---------------------------------------------------------
  // 3. Handle Single Clip Drop on Track (Check Overlap)
  // ---------------------------------------------------------
  const centerPoint = target.getCenterPoint();
  const trackRegion = timeline.getTrackAt(centerPoint.y);

  if (trackRegion) {
    const clipId = targetAny.elementId;

    if (clipId) {
      let left = target.left || 0;
      if (left < 0) left = 0; // Visual clamp

      const width = target.width || 0;

      const proposedStart = Math.round(
        (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
          MICROSECONDS_PER_SECOND,
      );
      const proposedDuration = Math.round(
        (width / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
          MICROSECONDS_PER_SECOND,
      );
      const proposedEnd = proposedStart + proposedDuration;

      const targetTrack = timeline.tracks.find((t) => t.id === trackRegion.id);
      let hasOverlap = false;

      if (targetTrack) {
        for (const otherClipId of targetTrack.clipIds) {
          if (otherClipId === clipId) continue;
          const otherClip = timeline.clipsMap[otherClipId];
          if (!otherClip) continue;

          // Transitions naturally overlap with clips they connect; ignore them in collision detection
          if (otherClip.type === "Transition") continue;

          // Check for actual overlap: clips overlap if one starts before the other ends
          // and ends after the other starts
          const otherStart = otherClip.display.from;
          const otherEnd = otherClip.display.to;

          // Two clips overlap if:
          // proposedStart < otherEnd AND proposedEnd > otherStart
          // We use a small tolerance to account for microsecond rounding errors during snapping.
          if (
            proposedStart < otherEnd - SNAP_OVERLAP_TOLERANCE_US &&
            proposedEnd > otherStart + SNAP_OVERLAP_TOLERANCE_US
          ) {
            hasOverlap = true;
            break;
          }
        }
      }

      if (hasOverlap) {
        // --- OVERLAP: CREATE NEW TRACK ---
        updateClipTimeLocally(timeline, clipId, proposedStart);

        const clipInfo = timeline.clipsMap[clipId];
        let newTrackType: TrackType = "Video";
        if (targetTrack) newTrackType = targetTrack.type;
        else if (clipInfo) {
          if (clipInfo.type === "Audio") newTrackType = "Audio";
          else if (clipInfo.type === "Text" || clipInfo.type === "Caption") newTrackType = "Text";
          else if (clipInfo.type === "Effect") newTrackType = "Effect";
          else if (clipInfo.type === "Video" || clipInfo.type === "Image") newTrackType = "Video";
        }

        const newTrackId = generateUUID();
        const newTrack: ITimelineTrack = {
          id: newTrackId,
          type: newTrackType,
          name: `${newTrackType} Track`,
          clipIds: [clipId],
          muted: false,
        };

        const currentTracks = timeline.tracks;
        const newTracksList = currentTracks
          .map((t: ITimelineTrack) => ({
            ...t,
            clipIds: t.clipIds.filter((id) => id !== clipId && !transitionsToDelete.includes(id)),
          }))
          .filter((t: ITimelineTrack) => t.clipIds.length > 0);

        const targetTrackIndex = newTracksList.findIndex((t) => t.id === trackRegion.id);

        const insertIndex = targetTrackIndex !== -1 ? targetTrackIndex + 1 : newTracksList.length;
        newTracksList.splice(insertIndex, 0, newTrack);

        timeline.setTracksInternal(newTracksList);
        timeline.render();

        timeline.emit("timeline:updated", { tracks: newTracksList });

        if (transitionsToDelete.length > 0) {
          timeline.emit("clips:removed", { clipIds: transitionsToDelete });
        }

        const trim = targetAny.trim;
        timeline.emit("clip:modified", {
          clipId,
          displayFrom: proposedStart,
          duration: proposedDuration,
          trim,
        });
      } else {
        // --- NO OVERLAP: MOVE ---
        const originalClip = timeline.clipsMap[clipId];
        const positionChanged = originalClip && proposedStart !== originalClip.display.from;

        const currentTrack = timeline.tracks.find((t) => t.clipIds.includes(clipId));
        if (currentTrack && (currentTrack.id !== trackRegion.id || positionChanged)) {
          if (transitionsToDelete.length > 0) {
            const newTracksList = timeline.tracks
              .map((t) => ({
                ...t,
                clipIds: t.clipIds.filter((id) => !transitionsToDelete.includes(id)),
              }))
              .filter((t) => t.clipIds.length > 0);

            timeline.setTracksInternal(newTracksList);
            timeline.emit("clips:removed", { clipIds: transitionsToDelete });
          }
        }

        target.set("top", trackRegion.top);
        target.setCoords();
        timeline.emit("clip:movedToTrack", {
          clipId: clipId,
          trackId: trackRegion.id,
        });
      }
    }
  } else {
    // ---------------------------------------------------------
    // 4. Handle Drop in Empty Space
    // ---------------------------------------------------------
    const clipId = targetAny.elementId;
    if (clipId) {
      const originalClip = timeline.clipsMap[clipId];
      if (originalClip) {
        const startTimeSeconds = originalClip.display.from / MICROSECONDS_PER_SECOND;
        const originalLeft =
          startTimeSeconds * TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale;

        target.set("left", originalLeft);

        const tracks = timeline.tracks;
        const originalTrack = tracks.find((t) => t.clipIds.includes(clipId));
        if (originalTrack) {
          const originalRegion = timeline.trackRegions.find((r) => r.id === originalTrack.id);
          if (originalRegion) {
            target.set("top", originalRegion.top);
          }
        }
        target.setCoords();
      }
    }
  }

  timeline.clearSeparatorHighlights();
  timeline.setActiveSeparatorIndex(null);
  timeline.canvas.requestRenderAll();
}

export function handleClipModification(timeline: Timeline, options: any) {
  const target = options.target as FabricObject | undefined;
  if (!target) return;

  clearAuxiliaryObjects(timeline.canvas, timeline.canvas.getObjects());

  const targetAny = target as any;

  if (targetAny.type === "activeSelection" && targetAny._objects) {
    const clips: Array<{ clipId: string; displayFrom: number }> = [];

    for (const obj of targetAny._objects) {
      const objAny = obj as any;
      if (!objAny.elementId) continue;

      const left = (obj.left || 0) + (target.left || 0);

      let displayFrom = Math.round(
        (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
          MICROSECONDS_PER_SECOND,
      );

      if (displayFrom < 0) displayFrom = 0;

      clips.push({
        clipId: objAny.elementId,
        displayFrom,
      });
    }

    if (clips.length > 0) {
      const transitionsToDelete = new Set<string>();
      for (const mod of clips) {
        const originalClip = timeline.clipsMap[mod.clipId];
        if (!originalClip) continue;

        const newFrom = mod.displayFrom;
        const newTo = mod.displayFrom + originalClip.duration;

        Object.values(timeline.clipsMap).forEach((c: any) => {
          if (c.type !== "Transition") return;
          if (c.toClipId === mod.clipId && newFrom !== originalClip.display.from) {
            transitionsToDelete.add(c.id);
          } else if (c.fromClipId === mod.clipId && newTo !== originalClip.display.to) {
            transitionsToDelete.add(c.id);
          }
        });
      }

      if (transitionsToDelete.size > 0) {
        const transitionIds = Array.from(transitionsToDelete);
        const newTracksList = timeline.tracks
          .map((t) => ({
            ...t,
            clipIds: t.clipIds.filter((id) => !transitionsToDelete.has(id)),
          }))
          .filter((t) => t.clipIds.length > 0);

        timeline.setTracksInternal(newTracksList);
        timeline.emit("clips:removed", { clipIds: transitionIds });
        timeline.emit("timeline:updated", { tracks: newTracksList });
      }

      timeline.emit("clips:modified", { clips });
    }
  } else {
    const clipId = targetAny.elementId;
    if (!clipId) return;

    let left = target.left || 0;
    const width = target.width || 0;

    if (left < 0) {
      left = 0;
      target.set("left", 0);
      target.setCoords();
    }

    let displayFrom = Math.round(
      (left / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
        MICROSECONDS_PER_SECOND,
    );

    if (displayFrom < 0) displayFrom = 0;

    const duration = Math.round(
      (width / (TIMELINE_CONSTANTS.PIXELS_PER_SECOND * timeline.timeScale)) *
        MICROSECONDS_PER_SECOND,
    );

    const trim = targetAny.trim;

    const originalClip = timeline.clipsMap[clipId];
    if (originalClip) {
      const transitionsToDelete = new Set<string>();
      const newFrom = displayFrom;
      const newTo = displayFrom + duration;

      Object.values(timeline.clipsMap).forEach((c: any) => {
        if (c.type !== "Transition") return;
        if (c.toClipId === clipId && newFrom !== originalClip.display.from) {
          transitionsToDelete.add(c.id);
        } else if (c.fromClipId === clipId && newTo !== originalClip.display.to) {
          transitionsToDelete.add(c.id);
        }
      });

      if (transitionsToDelete.size > 0) {
        const transitionIds = Array.from(transitionsToDelete);
        const newTracksList = timeline.tracks
          .map((t) => ({
            ...t,
            clipIds: t.clipIds.filter((id) => !transitionsToDelete.has(id)),
          }))
          .filter((t) => t.clipIds.length > 0);

        timeline.setTracksInternal(newTracksList);
        timeline.emit("clips:removed", { clipIds: transitionIds });
        timeline.emit("timeline:updated", { tracks: newTracksList });
      }
    }

    timeline.emit("clip:modified", {
      clipId,
      displayFrom,
      duration,
      trim,
    });
  }
}
