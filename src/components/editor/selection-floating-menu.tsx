"use client";

import { useState, useEffect, useCallback } from "react";
import { useStudioStore } from "@/stores/studio-store";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, LockKeyhole, LockKeyholeOpen, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoIcons } from "../shared/logos";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { OptionsFloatingMenu } from "./options-floating-menu";

export function SelectionFloatingMenu() {
  const { studio, selectedClips } = useStudioStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isLocked, setIsLocked] = useState(false);

  // Sync lock state from selected clips
  useEffect(() => {
    const clip = selectedClips[0] as any;
    setIsLocked(clip?.locked ?? false);
  }, [selectedClips]);

  const updatePosition = useCallback(() => {
    if (!studio || !studio.pixiApp) return;

    const transformer = studio.activeTransformer;
    if (!transformer) {
      setIsVisible(false);
      return;
    }

    const bounds = transformer.getBounds();

    setPosition({
      x: bounds.x + bounds.width / 2,
      y: bounds.y - 16,
    });
    setIsVisible(true);
  }, [studio]);

  const handleToggleLock = useCallback(async () => {
    if (!studio || selectedClips.length === 0) return;
    const clip = selectedClips[0] as any;
    const newLocked = !clip.locked;
    await studio.lockClip(clip.id, newLocked);
    setIsLocked(newLocked);
  }, [studio, selectedClips]);

  useEffect(() => {
    if (!studio) return;

    const handleSelectionChanged = () => {
      requestAnimationFrame(updatePosition);
    };

    const handleTransformStart = () => {
      setIsTransforming(true);
    };

    const handleTransformEnd = () => {
      setIsTransforming(false);
      updatePosition();
    };

    const handleLockChanged = ({ clip, locked }: { clip: any; locked: boolean }) => {
      const selected = selectedClips[0] as any;
      if (selected && selected.id === clip.id) {
        setIsLocked(locked);
      }
    };

    studio.on("selection:created", handleSelectionChanged);
    studio.on("selection:updated", handleSelectionChanged);
    studio.on("selection:cleared", handleSelectionChanged);
    studio.on("transform:start", handleTransformStart);
    studio.on("transform:end", handleTransformEnd);
    studio.on("clip:lock-changed", handleLockChanged);

    if (selectedClips.length > 0) {
      updatePosition();
    }

    return () => {
      studio.off("selection:created", handleSelectionChanged);
      studio.off("selection:updated", handleSelectionChanged);
      studio.off("selection:cleared", handleSelectionChanged);
      studio.off("transform:start", handleTransformStart);
      studio.off("transform:end", handleTransformEnd);
      studio.off("clip:lock-changed", handleLockChanged);
    };
  }, [studio, selectedClips, updatePosition]);

  // Ctrl+L keyboard shortcut to toggle lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "l") {
        e.preventDefault();
        if (selectedClips.length > 0) {
          handleToggleLock();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleToggleLock, selectedClips.length]);

  const showMenu = isVisible && !isTransforming && selectedClips.length > 0;

  return (
    <AnimatePresence>
      {showMenu && (
        <motion.div
          initial={{ opacity: 0, y: 10, x: "-50%", scale: 0.95 }}
          animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
          exit={{ opacity: 0, y: 5, x: "-50%", scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="absolute z-40 bg-background/95 backdrop-blur-md border border-border rounded-full shadow-xl pr-2 py-1.5 flex items-center gap-1 min-w-max h-12 select-none"
          style={{
            left: position.x,
            top: position.y,
            translateY: "-100%",
          }}
        >
          <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 hover:bg-accent/50 rounded-s-full cursor-pointer transition-all group overflow-hidden active:scale-95 border-r border-border">
            <div className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-md ">
              <LogoIcons.scenify width={24} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Ask Coco</span>
            <Sparkles className="w-4 h-4 text-primary group-hover:rotate-12 transition-transform" />
          </div>

          {/* Standard Actions */}
          <div className="flex items-center gap-0.5">
            <MenuButton
              icon={
                isLocked ? (
                  <LockKeyholeOpen className="w-4 h-4 text-amber-400" />
                ) : (
                  <LockKeyhole className="w-4 h-4" />
                )
              }
              tooltip={isLocked ? "Unlock" : "Lock"}
              onClick={handleToggleLock}
              className={isLocked ? "bg-amber-400/10" : ""}
            />
            {!isLocked && (
              <>
                <MenuButton
                  icon={<Copy className="w-4 h-4" />}
                  tooltip="Duplicate"
                  onClick={() => studio?.duplicateSelected()}
                />
                <MenuButton
                  icon={<Trash2 className="w-4 h-4 text-destructive" />}
                  tooltip="Delete"
                  onClick={() => studio?.deleteSelected()}
                />
                <OptionsFloatingMenu />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MenuButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  onClick?: () => void;
  className?: string;
}

function MenuButton({ icon, tooltip, onClick, className }: MenuButtonProps) {
  return (
    <Tooltip key={tooltip}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "w-9 h-9 rounded-full transition-all hover:bg-accent/50 active:scale-90",
            className,
          )}
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}
