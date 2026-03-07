import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GeneratedAsset {
  id: string;
  url: string;
  text: string; // The prompt
  type: "voiceover" | "sfx" | "music";
  createdAt: number;
}

interface GeneratedState {
  voiceovers: GeneratedAsset[];
  sfx: GeneratedAsset[];
  music: GeneratedAsset[];

  // Track in-progress generations
  isGenerating: {
    voiceover: boolean;
    sfx: boolean;
    music: boolean;
  };

  addAsset: (asset: GeneratedAsset) => void;
  removeAsset: (id: string, type: GeneratedAsset["type"]) => void;
  setGenerating: (type: GeneratedAsset["type"], isGenerating: boolean) => void;
}

export const useGeneratedStore = create<GeneratedState>()(
  persist(
    (set) => ({
      voiceovers: [],
      sfx: [],
      music: [],
      isGenerating: {
        voiceover: false,
        sfx: false,
        music: false,
      },

      addAsset: (asset) =>
        set((state) => {
          const key =
            asset.type === "voiceover" ? "voiceovers" : asset.type === "sfx" ? "sfx" : "music";
          return { [key]: [asset, ...state[key]] };
        }),

      removeAsset: (id, type) =>
        set((state) => {
          const key = type === "voiceover" ? "voiceovers" : type === "sfx" ? "sfx" : "music";
          return { [key]: state[key].filter((a) => a.id !== id) };
        }),

      setGenerating: (type, isGenerating) =>
        set((state) => {
          const key = type === "voiceover" ? "voiceover" : type === "sfx" ? "sfx" : "music";
          return {
            isGenerating: {
              ...state.isGenerating,
              [key]: isGenerating,
            },
          };
        }),
    }),
    {
      name: "generated-assets-storage",
      partialize: (state) => ({
        voiceovers: state.voiceovers,
        sfx: state.sfx,
        music: state.music,
      }), // Don't persist isGenerating
    },
  ),
);
