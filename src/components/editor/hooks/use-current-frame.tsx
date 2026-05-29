import { useStore } from "zustand";
import { projectStore } from "@/lib/project";

export const useCurrentPlayerFrame = (_ref: React.RefObject<any> | null) => {
  const currentTimeUs = useStore(projectStore, (state) => state.currentTime);
  return currentTimeUs / 1_000_000;
};
