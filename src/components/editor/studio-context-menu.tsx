"use client";

import * as React from "react";
import { useCallback } from "react";
import { useStore } from "zustand";
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
import { core, projectStore } from "@/lib/project";
import { nanoid, AnyClip } from "@openvideo/core";

// Module-level clipboard — persists across renders
export let clipboardClipJSON: AnyClip | null = null;

export function useClipActions(clipOverride?: any) {
  const selectedIds = useStore(projectStore, (s) => s.selectedIds);
  const primaryId = clipOverride?.id || selectedIds[0];
  const selectedClip = useStore(projectStore, (s) => s.clips[primaryId]);

  const [hasClipboard, setHasClipboard] = React.useState(clipboardClipJSON !== null);

  const isLocked = selectedClip?.locked ?? false;

  // Sync clipboard state
  React.useEffect(() => {
    const interval = setInterval(() => {
      setHasClipboard(clipboardClipJSON !== null);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = useCallback(() => {
    if (!selectedClip) return;
    clipboardClipJSON = JSON.parse(JSON.stringify(selectedClip));
    setHasClipboard(true);
  }, [selectedClip]);

  const handlePaste = useCallback(async () => {
    if (!clipboardClipJSON) return;

    const newId = nanoid();
    const currentTime = core.store.getState().currentTime;

    const newClip = {
      ...clipboardClipJSON,
      id: newId,
      display: {
        ...clipboardClipJSON.display,
        from: currentTime,
        to: currentTime + (clipboardClipJSON.duration ?? 0),
      },
    };

    await core.clip.add(newClip as any);
  }, []);

  const handleDuplicate = useCallback(async () => {
    const ids = clipOverride ? [clipOverride.id] : selectedIds;
    if (ids.length === 0) return;
    core.clip.duplicate(ids);
  }, [selectedIds, clipOverride]);

  const handleToggleLock = useCallback(async () => {
    if (!selectedClip) return;
    core.clip.update(selectedClip.id, { locked: !isLocked });
  }, [selectedClip, isLocked]);

  const handleDelete = useCallback(async () => {
    const ids = clipOverride ? [clipOverride.id] : selectedIds;
    if (ids.length === 0) return;
    core.clip.remove(ids);
  }, [selectedIds, clipOverride]);

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

export function StudioContextMenu() {
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
