import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PanelState {
  toolsPanel: number;
  previewPanel: number;
  propertiesPanel: number;
  mainContent: number;
  timeline: number;
  setToolsPanel: (size: number) => void;
  setPreviewPanel: (size: number) => void;
  setPropertiesPanel: (size: number) => void;
  setMainContent: (size: number) => void;
  setTimeline: (size: number) => void;
}

export const usePanelStore = create<PanelState>()(
  persist(
    (set) => ({
      toolsPanel: 30,
      previewPanel: 50,
      propertiesPanel: 25,
      mainContent: 70,
      timeline: 30,
      setToolsPanel: (size) => set({ toolsPanel: size }),
      setPreviewPanel: (size) => set({ previewPanel: size }),
      setPropertiesPanel: (size) => set({ propertiesPanel: size }),
      setMainContent: (size) => set({ mainContent: size }),
      setTimeline: (size) => set({ timeline: size }),
    }),
    {
      name: "panel-sizes",
    },
  ),
);
