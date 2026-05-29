import { clipToJSON, type IClip as StudioClip, Studio, jsonToClip } from "@openvideo/engine-pixi";
import CanvasTimeline, { TIMELINE_SEEK } from "@openvideo/timeline";
import { IClip } from "@/types/timeline";
import { core, projectStore } from "@/lib/project";
import { useStudioStore } from "@/stores/studio-store";
import { nanoid } from "nanoid";

/**
 * Connects the Timeline instance to the Zustand store for Store -> Engine sync.
 */
// Note: addTimelineStoreSync has been consolidated into addStudioSync
// to follow a pure Core-First synchronization flow.

/**
 * Connects the Studio instance to the Store and Timeline.
 */
export const addStudioSync = (studio: Studio, timeline: CanvasTimeline): (() => void) => {
  // --- 1. ENGINES -> CORE (Interaction Capture) ---

  // Captures changes from Studio (e.g. property panel or direct canvas edits)
  // After a transform ends, the SelectionManager already calls core.execute internally
  // (when core is attached). Here we only listen to emit real-time transforming events.
  const handleClipTransforming = ({ clip }: { clip: IClip }) => {
    const serialized = clipToJSON(clip as unknown as StudioClip) as any;
    // Real-time signaling only — no state commit yet
    core.emit("clip:transforming", { id: clip.id, updates: serialized });
  };

  // When Core is attached (via StudioBridge) the Studio no longer needs to write
  // back to the store directly — the core command pipeline handles it. We only
  // sync selection which is still a lightweight store write.
  studio.on("clip:transforming", handleClipTransforming as any);

  // Captures timeline seek events
  const handleTimelineSeek = ({ payload }: any) => {
    core.seek(payload.time);
  };

  timeline.emitter.on(TIMELINE_SEEK, handleTimelineSeek);

  // Timeline drop events → route through core.clip.add
  const handleAddClip = async ({ payload, options }: any) => {
    await core.clip.add(payload, options);
  };

  timeline.emitter.on("add:video", handleAddClip);
  timeline.emitter.on("add:image", handleAddClip);
  timeline.emitter.on("add:audio", handleAddClip);
  timeline.emitter.on("add:text", handleAddClip);
  timeline.emitter.on("add:transition", handleAddClip);
  timeline.emitter.on("add:effect", handleAddClip);

  // --- 2. CORE -> ENGINES (Reconciliation via store subscription) ---
  // The StudioBridge + TimelineBridge handle patch-driven reconciliation.
  // This subscription handles scale sync and selection cross-sync only.
  let prevState = projectStore.getState();

  const unsubCore = projectStore.subscribe(async (state) => {
    const currentPrevState = prevState;
    prevState = state;

    try {
      // Scale
      if (state.scale !== currentPrevState.scale) {
        timeline.syncScale({ scale: state.scale });
      }

      // Selection cross-sync (Studio <-> Core)
      if (state.selectedIds !== currentPrevState.selectedIds) {
        // Sync StudioStore (Global UI State)
        const { setSelectedClips } = useStudioStore.getState();
        const engineClips = state.selectedIds
          .map((id) => studio.timeline.getClipById(id))
          .filter(Boolean);
        setSelectedClips(engineClips as any[]);
      }
    } catch (e) {
      console.warn("Core subscription error:", e);
    }
  });

  return () => {
    studio.off("clip:transforming", handleClipTransforming as any);
    timeline.emitter.off(TIMELINE_SEEK, handleTimelineSeek);
    timeline.emitter.off("add:video", handleAddClip);
    timeline.emitter.off("add:image", handleAddClip);
    timeline.emitter.off("add:audio", handleAddClip);
    timeline.emitter.off("add:text", handleAddClip);
    timeline.emitter.off("add:transition", handleAddClip);
    timeline.emitter.off("add:effect", handleAddClip);
    unsubCore();
  };
};
