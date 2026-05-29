import { Core, CoreConfig, BrowserMetadataProvider } from "@openvideo/core";
import { useProjectStore } from "@/stores/project-store";

// Initialize browser metadata provider for core
CoreConfig.setMetadataProvider(new BrowserMetadataProvider());

const { canvasSize, fps } = useProjectStore.getState();

export const core = new Core({
  settings: {
    width: canvasSize.width,
    height: canvasSize.height,
    fps,
    duration: 30_000_000,
  },
});

// Legacy alias — remove once all consumers migrate
export const engine = core;
export const projectStore = core.store;
export const playbackController = core.playback;

if (typeof window !== "undefined") {
  (window as any).core = core;
  // Keep legacy global for gradual migration
  (window as any).engine = core;
}
