import { create } from "zustand";
import type { PlaybackState, PlaybackControls } from "@/types/playback";
import { useStudioStore } from "@/stores/studio-store";

interface PlaybackStore extends PlaybackState, PlaybackControls {
  setDuration: (duration: number) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (isPlaying: boolean) => void;
}

export const usePlaybackStore = create<PlaybackStore>((set, get) => ({
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  previousVolume: 1,
  speed: 1.0,

  play: async () => {
    const { studio } = useStudioStore.getState();
    if (!studio) return;
    await studio.play();
    set({ isPlaying: true });
  },

  pause: () => {
    const { studio } = useStudioStore.getState();
    if (!studio) return;
    studio.pause();
    set({ isPlaying: false });
  },

  toggle: () => {
    const { isPlaying } = get();
    if (isPlaying) {
      get().pause();
    } else {
      get().play();
    }
  },

  seek: (time: number) => {
    const { studio } = useStudioStore.getState();
    const { duration } = get();
    // Clamp time
    const clampedTime = Math.max(0, Math.min(duration, time));

    if (studio) {
      // Convert seconds to microseconds
      studio.seek(clampedTime * 1_000_000);
    }

    // Optimistic update
    set({ currentTime: clampedTime });
  },

  setVolume: (volume: number) =>
    set((state) => ({
      volume: Math.max(0, Math.min(1, volume)),
      muted: volume === 0,
      previousVolume: volume > 0 ? volume : state.previousVolume,
    })),

  setSpeed: (speed: number) => {
    const newSpeed = Math.max(0.1, Math.min(2.0, speed));
    set({ speed: newSpeed });
    // TODO: Sync speed to Studio if supported
  },

  setDuration: (duration: number) => set({ duration }),
  setCurrentTime: (time: number) => set({ currentTime: time }),
  setIsPlaying: (isPlaying: boolean) => set({ isPlaying }),
}));
