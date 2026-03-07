import { create } from "zustand";
import {
  type ITimelineTrack,
  type IClip,
  MICROSECONDS_PER_SECOND,
  type TrackType,
} from "@/types/timeline";
import { generateUUID } from "@/utils/id";
import { loadStudioData } from "@/components/editor/timeline/timeline/data";

interface TimelineStore {
  // Normalized State
  _tracks: ITimelineTrack[];
  clips: Record<string, IClip>;

  // Computed / Exposed
  tracks: ITimelineTrack[];

  // Selection
  selectedClipIds: string[];
  selectClip: (clipId: string, multi?: boolean) => void;
  clearSelection: () => void;

  // Actions
  setTracks: (tracks: ITimelineTrack[]) => void;
  setClips: (clips: Record<string, IClip>) => void;
  updateClip: (
    clipId: string,
    updates: {
      displayFrom?: number;
      duration?: number;
      trim?: { from: number; to: number };
    },
  ) => void;
  updateClips: (
    updates: Array<{
      clipId: string;
      displayFrom?: number;
      duration?: number;
      trim?: { from: number; to: number };
    }>,
  ) => void;
  removeClips: (clipIds: string[]) => void;

  // Helpers
  getClip: (id: string) => IClip | undefined;
  getTotalDuration: () => number; // in seconds

  // Legacy / Hybrid Support (for now just basics)
  addTrack: (type: TrackType, index?: number) => string;
  moveTrack: (trackId: string, newIndex: number) => void;
  setTrackOrder: (trackIds: string[]) => void;
  removeTrack: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
}

export const useTimelineStore = create<TimelineStore>((set, get) => {
  // Initial Load - using the exported data from data.ts
  const { tracks: initialTracks, clips: initialClips } = loadStudioData();

  return {
    _tracks: initialTracks,
    clips: initialClips,
    tracks: initialTracks,
    selectedClipIds: [],

    setTracks: (tracks) => {
      set({ _tracks: tracks, tracks: tracks });
    },

    setClips: (clips) => {
      set({ clips });
    },

    updateClip: (clipId, updates) => {
      set((state) => {
        const clip = state.clips[clipId];
        if (!clip) return state;

        const updatedClip = { ...clip };

        // Update duration if provided
        if (updates.duration !== undefined) {
          updatedClip.duration = updates.duration;
        }

        // Update display.from if displayFrom is provided
        if (updates.displayFrom !== undefined) {
          updatedClip.display = {
            ...clip.display,
            from: updates.displayFrom,
          };
        }

        // Update trim if provided
        if (updates.trim !== undefined) {
          updatedClip.trim = updates.trim;
        }

        return {
          clips: {
            ...state.clips,
            [clipId]: updatedClip,
          },
        };
      });
    },

    updateClips: (updates) => {
      set((state) => {
        const updatedClips = { ...state.clips };

        for (const update of updates) {
          const clip = updatedClips[update.clipId];
          if (!clip) continue;

          const updatedClip = { ...clip };

          // Update duration if provided
          if (update.duration !== undefined) {
            updatedClip.duration = update.duration;
          }

          // Update display.from if displayFrom is provided
          if (update.displayFrom !== undefined) {
            updatedClip.display = {
              ...clip.display,
              from: update.displayFrom,
            };
          }

          // Update trim if provided
          if (update.trim !== undefined) {
            updatedClip.trim = update.trim;
          }

          updatedClips[update.clipId] = updatedClip;
        }

        return { clips: updatedClips };
      });
    },

    removeClips: (clipIds) => {
      set((state) => {
        const updatedClips = { ...state.clips };
        const updatedTracks = state._tracks
          .map((track) => ({
            ...track,
            clipIds: track.clipIds.filter((id) => !clipIds.includes(id)),
          }))
          .filter((track) => track.clipIds.length > 0);

        clipIds.forEach((id) => {
          delete updatedClips[id];
        });

        return {
          clips: updatedClips,
          _tracks: updatedTracks,
          tracks: updatedTracks,
          selectedClipIds: state.selectedClipIds.filter((id) => !clipIds.includes(id)),
        };
      });
    },

    selectClip: (clipId, multi = false) => {
      set((state) => {
        if (multi) {
          return {
            selectedClipIds: state.selectedClipIds.includes(clipId)
              ? state.selectedClipIds.filter((id) => id !== clipId)
              : [...state.selectedClipIds, clipId],
          };
        }
        return { selectedClipIds: [clipId] };
      });
    },

    clearSelection: () => set({ selectedClipIds: [] }),

    getClip: (id) => get().clips[id],

    getTotalDuration: () => {
      const { clips } = get();
      let maxTime = 0;
      Object.values(clips).forEach((clip) => {
        const endTime = (clip.display.from + clip.duration) / MICROSECONDS_PER_SECOND;
        if (endTime > maxTime) maxTime = endTime;
      });
      return maxTime;
    },

    addTrack: (type, index) => {
      const newTrack: ITimelineTrack = {
        id: generateUUID(),
        name: `${type} Track`,
        type,
        clipIds: [],
        muted: false,
      };
      set((state) => {
        const updatedTracks = [...state._tracks];
        if (typeof index === "number") {
          updatedTracks.splice(index, 0, newTrack);
        } else {
          updatedTracks.unshift(newTrack);
        }
        return {
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
      return newTrack.id;
    },

    moveTrack: (trackId, newIndex) => {
      set((state) => {
        const currentIndex = state._tracks.findIndex((t) => t.id === trackId);
        if (currentIndex === -1) return state;

        const track = state._tracks[currentIndex];
        const updatedTracks = [...state._tracks];
        updatedTracks.splice(currentIndex, 1);
        updatedTracks.splice(newIndex, 0, track);

        return {
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    },

    setTrackOrder: (trackIds) => {
      set((state) => {
        const currentTracksMap = new Map(state._tracks.map((t) => [t.id, t]));
        const updatedTracks: ITimelineTrack[] = [];

        for (const id of trackIds) {
          const track = currentTracksMap.get(id);
          if (track) {
            updatedTracks.push(track);
          }
        }

        return {
          _tracks: updatedTracks,
          tracks: updatedTracks,
        };
      });
    },

    removeTrack: (trackId) => {
      set((state) => ({
        _tracks: state._tracks.filter((t) => t.id !== trackId),
        tracks: state.tracks.filter((t) => t.id !== trackId),
      }));
    },

    toggleTrackMute: (trackId) => {
      set((state) => ({
        tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
      }));
    },
  };
});
