import React, { useEffect, useState, useCallback } from "react";
import { useStudioStore } from "@/stores/studio-store";
import type { TimelineCanvas } from "./timeline";
import { Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Copy, Clipboard, CopyPlus, LockKeyhole, LockKeyholeOpen, Trash2 } from "lucide-react";
import { useClipActions } from "../options-floating-menu";
import { IClip } from "openvideo";
import { getTrackHeight } from "./timeline-constants";
import { TrackType } from "@/types/timeline";

interface TimelineClipMenuProps {
  timelineCanvas: TimelineCanvas | null;
}

export function TimelineClipMenu({ timelineCanvas }: TimelineClipMenuProps) {
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null);
  const [isHoveringMenu, setIsHoveringMenu] = useState(false);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [selectedClips, setSelectedClips] = useState<IClip[]>([]);
  const { studio, setSelectedClips: setStudioSelectedClips } = useStudioStore();
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
    clipId: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const activeClipId = isDropdownOpen || isHoveringMenu ? menuPosition?.clipId : hoveredClipId;

  const activeClip = activeClipId ? studio?.timeline.getClipById(activeClipId) : null;

  useEffect(() => {
    if (!studio) return;

    const handleSelection = (data: any) => {
      setSelectedClips(data.selected);
      setStudioSelectedClips(data.selected);
    };

    const handleClear = () => {
      setSelectedClips([]);
    };

    studio.on("selection:created", handleSelection);
    studio.on("selection:updated", handleSelection);
    studio.on("selection:cleared", handleClear);

    return () => {
      studio.off("selection:created", handleSelection);
      studio.off("selection:updated", handleSelection);
      studio.off("selection:cleared", handleClear);
    };
  }, [studio]);

  const { hasClipboard, handleCopy, handlePaste, handleDuplicate, handleToggleLock, handleDelete } =
    useClipActions(activeClip || null);

  const updatePosition = useCallback(() => {
    if (!timelineCanvas || !activeClipId) {
      if (!isDropdownOpen && !isHoveringMenu) setMenuPosition(null);
      return;
    }

    const rect = timelineCanvas.getClipScreenPosition(activeClipId);
    if (!rect) {
      if (!isDropdownOpen && !isHoveringMenu) setMenuPosition(null);
      return;
    }
    const EXTRA_TOP = {
      Video: 13,
      Audio: 13,
      Image: 13,
      Text: 4,
      Caption: 4,
      Effect: 4,
      Transition: 4,
      Placeholder: 4,
    };

    const newX = rect.left + rect.width - 36;
    const newY = rect.top + EXTRA_TOP[activeClip?.type as TrackType];

    setMenuPosition((prev) => {
      if (prev && prev.x === newX && prev.y === newY && prev.clipId === activeClipId) {
        return prev;
      }
      return {
        x: newX,
        y: newY,
        clipId: activeClipId,
      };
    });
  }, [timelineCanvas, activeClipId, isDropdownOpen, isHoveringMenu]);

  // Sync position on animation frame to handle smooth dragging/scrolling
  useEffect(() => {
    if (!activeClipId || !timelineCanvas) {
      if (!isDropdownOpen && !isHoveringMenu) setMenuPosition(null);
      return;
    }

    updatePosition();

    let rafId: number;
    const loop = () => {
      updatePosition();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafId);
  }, [activeClipId, timelineCanvas, updatePosition, isDropdownOpen, isHoveringMenu]);

  // Listen to canvas hover events
  useEffect(() => {
    if (!timelineCanvas) return;

    const onHovered = ({ clipId }: { clipId: string }) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      setHoveredClipId(clipId);
    };
    const onUnhovered = ({ clipId }: { clipId: string }) => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      hoverTimeoutRef.current = setTimeout(() => {
        setHoveredClipId((prev) => (prev === clipId ? null : prev));
      }, 150);
    };

    timelineCanvas.on("clip:hovered", onHovered);
    timelineCanvas.on("clip:unhovered", onUnhovered);

    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      timelineCanvas.off("clip:hovered", onHovered);
      timelineCanvas.off("clip:unhovered", onUnhovered);
    };
  }, [timelineCanvas]);

  const isSelected = activeClip && selectedClips.some((c) => c.id === activeClip.id);

  if (!menuPosition || !activeClip || !isSelected || activeClip.type === "Transition") return null;

  const isLocked = activeClip.locked;

  return (
    <div
      style={{
        position: "absolute",
        left: menuPosition.x,
        top: menuPosition.y,
        zIndex: 100,
      }}
      onMouseEnter={() => setIsHoveringMenu(true)}
      onMouseLeave={() => setIsHoveringMenu(false)}
    >
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className="w-6 h-6 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-sm transition-colors border border-white/20"
            onClick={(e) => {
              e.stopPropagation();
              // If clip wasn't selected, maybe we want to select it here?
              if (studio && !selectedClips.find((c) => c.id === activeClip.id)) {
                studio.selection.clear();
                studio.selectClipsByIds([activeClip.id]);
              }
            }}
          >
            <Ellipsis className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!isLocked && (
            <>
              <DropdownMenuItem onClick={handleCopy}>
                <Copy className="mr-2 w-4 h-4" />
                Copy
                <DropdownMenuShortcut>⌘ C</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePaste} disabled={!hasClipboard}>
                <Clipboard className="mr-2 w-4 h-4" />
                Paste
                <DropdownMenuShortcut>⌘ V</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <CopyPlus className="mr-2 w-4 h-4" />
                Duplicate
                <DropdownMenuShortcut>⌘ D</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleToggleLock}>
            {isLocked ? (
              <LockKeyholeOpen className="mr-2 w-4 h-4" />
            ) : (
              <LockKeyhole className="mr-2 w-4 h-4" />
            )}
            {isLocked ? "Unlock Clip" : "Lock Clip"}
            <DropdownMenuShortcut>⌘ L</DropdownMenuShortcut>
          </DropdownMenuItem>

          {!isLocked && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete}>
                <Trash2 className="mr-2 w-4 h-4" />
                Delete
                <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
