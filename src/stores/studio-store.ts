import { create } from "zustand";
import { Studio, IClip } from "@openvideo/engine-pixi";

interface StudioState {
  studio: Studio | null;
  setStudio: (studio: Studio | null) => void;
  selectedClips: IClip[];
  setSelectedClips: (clips: IClip[]) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  studio: null,
  setStudio: (studio) => set({ studio }),
  selectedClips: [],
  setSelectedClips: (clips) => set({ selectedClips: clips }),
}));
