import { useMemo } from "react";
import { useStore } from "zustand";
import { projectStore, core } from "@/lib/project";
import { ICaptionStyle, ICaptionColors } from "@openvideo/core";
import { fontManager } from "@openvideo/engine-pixi";
import { getFontByPostScriptName } from "@/utils/font-utils";

/**
 * Clean caption update hook.
 *
 * Centralizes all caption update routing — the component just calls
 * the right method and passes a delta. No manual deep-merging, no
 * "single vs multiple" option flags.
 *
 * Broadcasting (all captions) vs scoping (single clip) is determined
 * by the method itself, mirroring how CapCut/Premiere handle this:
 * style/color changes are always global, position changes are per-group.
 */
export function useCaptionUpdate(clipId: string) {
  const clips = useStore(projectStore, (s) => s.clips);

  /** IDs of all Caption-type clips sharing the same mediaId (siblings). */
  const siblingIds = useMemo(() => {
    const clip = clips[clipId] as any;
    const mediaId = clip?.mediaId;
    if (!mediaId) return [clipId];
    return Object.keys(clips).filter(
      (id) => clips[id].type === "Caption" && (clips[id] as any).mediaId === mediaId,
    );
  }, [clips, clipId]);

  return {
    /**
     * Update a root-level property on this clip only.
     * Use for: left, top, opacity, angle, text, etc.
     */
    updateOne: (updates: Record<string, any>) => {
      core.clip.update(clipId, updates as any);
    },

    /**
     * Apply a style delta to ALL caption clips (global broadcast).
     * Use for: fontSize, fontFamily, fill, textCase, stroke, shadow, etc.
     */
    setStyle: (style: Partial<ICaptionStyle>) => {
      core.caption.setStyle(style);
    },

    /**
     * Apply a color delta to ALL caption clips (global broadcast).
     * Use for: appeared, active, activeFill, background, keyword.
     */
    setColors: (colors: Partial<ICaptionColors>) => {
      core.caption.setColors(colors);
    },

    /**
     * Move this clip and its siblings to a vertical position slot.
     * Uses mediaId siblings, not all captions — intentionally scoped.
     */
    setVerticalPosition: (position: "top" | "center" | "bottom") => {
      core.caption.setVerticalPosition(position, siblingIds);
    },

    /**
     * Load a font and apply it (family + url) to all captions.
     */
    setFont: async (postScriptName: string) => {
      const font = getFontByPostScriptName(postScriptName);
      if (!font) return;
      await fontManager.addFont({ name: font.postScriptName, url: font.url });
      core.caption.setStyle({
        fontFamily: font.postScriptName,
        fontUrl: font.url,
      });
    },
  };
}
