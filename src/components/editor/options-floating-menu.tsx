"use client";

import * as React from "react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clipboard,
  Copy,
  CopyPlus,
  LockKeyhole,
  LockKeyholeOpen,
  MoreHorizontalIcon,
  Trash2,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/stores/studio-store";

// Module-level clipboard — persists across renders
export let clipboardClipId: string | null = null;

export function useClipActions(clipOverride?: any) {
  const { studio, selectedClips } = useStudioStore();
  const [hasClipboard, setHasClipboard] = React.useState(clipboardClipId !== null);
  const [isLocked, setIsLocked] = React.useState(false);

  const selectedClip = clipOverride || (selectedClips[0] as any);

  // Sync lock state
  React.useEffect(() => {
    const clip = selectedClips[0] as any;
    setIsLocked(clip?.locked ?? false);
    setHasClipboard(clipboardClipId !== null);
  }, [selectedClips]);

  React.useEffect(() => {
    if (!studio) return;
    const handleLockChanged = ({ clip, locked }: { clip: any; locked: boolean }) => {
      const selected = selectedClips[0] as any;
      if (selected && selected.id === clip.id) {
        setIsLocked(locked);
      }
    };
    studio.on("clip:lock-changed", handleLockChanged);
    return () => {
      studio.off("clip:lock-changed", handleLockChanged);
    };
  }, [studio, selectedClips]);

  const handleCopy = useCallback(() => {
    if (!selectedClip) return;
    clipboardClipId = selectedClip.id;
    setHasClipboard(true);
  }, [selectedClip]);

  const handlePaste = useCallback(async () => {
    if (!studio || !clipboardClipId) return;
    // Find the clip by id and duplicate it
    const clip = studio.timeline.getClipById(clipboardClipId);
    if (!clip) return;
    // Select the clip then duplicate it
    studio.selection.selectClipsByIds([clipboardClipId]);
    await studio.duplicateSelected();
  }, [studio]);

  const handleDuplicate = useCallback(async () => {
    if (!studio) return;
    await studio.duplicateSelected();
  }, [studio]);

  const handleToggleLock = useCallback(async () => {
    if (!studio || !selectedClip) return;
    await studio.lockClip(selectedClip.id, !selectedClip.locked);
  }, [studio, selectedClip]);

  const handleDelete = useCallback(async () => {
    if (!studio) return;
    await studio.deleteSelected();
  }, [studio]);

  return {
    selectedClip,
    isLocked,
    hasClipboard,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleToggleLock,
    handleDelete,
  };
}

export function OptionsFloatingMenu() {
  const {
    selectedClip,
    isLocked,
    hasClipboard,
    handleCopy,
    handlePaste,
    handleDuplicate,
    handleToggleLock,
    handleDelete,
  } = useClipActions();

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "w-9 h-9 rounded-full transition-all hover:bg-accent/50 active:scale-90",
              )}
            >
              <MoreHorizontalIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>More</p>
        </TooltipContent>
      </Tooltip>

      <DropdownMenuContent className="w-44">
        <DropdownMenuGroup>
          {!isLocked && (
            <>
              <DropdownMenuItem onClick={handleCopy} disabled={!selectedClip}>
                <Copy />
                Copy
                <DropdownMenuShortcut>⌘ C</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handlePaste} disabled={!hasClipboard}>
                <Clipboard />
                Paste
                <DropdownMenuShortcut>⌘ V</DropdownMenuShortcut>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDuplicate} disabled={!selectedClip}>
                <CopyPlus />
                Duplicate
                <DropdownMenuShortcut>⌘ D</DropdownMenuShortcut>
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem onClick={handleToggleLock} disabled={!selectedClip}>
            {isLocked ? <LockKeyholeOpen /> : <LockKeyhole />}
            {isLocked ? "Unlock" : "Lock"}
            <DropdownMenuShortcut>⌘ L</DropdownMenuShortcut>
          </DropdownMenuItem>

          {!isLocked && (
            <DropdownMenuItem onClick={handleDelete} disabled={!selectedClip}>
              <Trash2 />
              Delete
              <DropdownMenuShortcut>⌫</DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
