import { useEffect, useRef, useMemo, useState } from "react";
import {
  Studio,
  fontManager,
  registerCustomTransition,
  registerCustomEffect,
} from "@openvideo/engine-pixi";
import { useStudioStore } from "@/stores/studio-store";
import { useProjectStore } from "@/stores/project-store";
import { core } from "@/lib/project";
import { editorFont } from "./constants";
import { CUSTOM_TRANSITIONS } from "./transition-custom";
import { CUSTOM_EFFECTS } from "./effect-custom";
import { useClipActions } from "./studio-context-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Clipboard, Copy, CopyPlus, LockKeyhole, LockKeyholeOpen, Trash2 } from "lucide-react";

const STUDIO_CONFIG = {
  fps: 30,
  interactivity: true,
  spacing: 20,
} as const;

interface CanvasPanelProps {
  onReady?: () => void;
}

/**
 * CanvasPanel - The main interactive canvas component for the video editor.
 * Manages the Studio instance, canvas rendering, and responsive layout updates.
 */
export function CanvasPanel({ onReady }: CanvasPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const onReadyRef = useRef(onReady);
  const { setStudio, setSelectedClips } = useStudioStore();
  const { canvasSize, initialStudioJSON } = useProjectStore();
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
  const [editingClip, setEditingClip] = useState<any | null>(null);

  // Keep onReady ref up to date
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Handle dimension changes
  useEffect(() => {
    if (studioRef.current) {
      studioRef.current.setSize(canvasSize.width, canvasSize.height);
    }
    core.store.getState().updateSettings({
      width: canvasSize.width,
      height: canvasSize.height,
    });
  }, [canvasSize]);

  // Setup Studio and ResizeObserver (only once on mount)
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create studio instance
    studioRef.current = new Studio({
      ...canvasSize,
      ...STUDIO_CONFIG,
      backgroundColor: "#111111",
      canvas: canvasRef.current,
      core: core,
    });

    // Initialize fonts and notify when ready
    const initializeStudio = async () => {
      if (!studioRef.current) return;

      try {
        await Promise.all([
          fontManager.loadFonts([
            {
              name: editorFont.fontFamily,
              url: editorFont.fontUrl,
            },
          ]),
          studioRef.current.ready,
        ]);

        // If there's initial data from the project store, load it now

        onReadyRef.current?.();
      } catch (error) {
        console.error("Failed to initialize studio:", error);
      }
    };

    initializeStudio();

    // Update global store
    setStudio(studioRef.current);

    // Setup ResizeObserver for responsive layout
    const canvas = canvasRef.current;
    const parentElement = canvas.parentElement;
    let resizeObserver: ResizeObserver | null = null;

    if (parentElement) {
      resizeObserver = new ResizeObserver(() => {
        if (studioRef.current && (studioRef.current as any).updateArtboardLayout) {
          (studioRef.current as any).updateArtboardLayout();
        }
      });
      resizeObserver.observe(parentElement);
    }

    // Cleanup function
    return () => {
      // Disconnect ResizeObserver
      if (resizeObserver && parentElement) {
        resizeObserver.unobserve(parentElement);
        resizeObserver.disconnect();
      }

      // Destroy Studio instance
      if (studioRef.current) {
        studioRef.current.destroy();
        studioRef.current = null;
        setStudio(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    CUSTOM_TRANSITIONS.forEach((t) => {
      registerCustomTransition(t.key, t as any);
    });
    CUSTOM_EFFECTS.forEach((e) => {
      registerCustomEffect(e.key, e as any);
    });
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!studioRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert to PIXI global coordinates
    const topmostClip = studioRef.current.selection.getTopmostClipAtPoint({
      x,
      y,
    });

    if (topmostClip) {
      core.store.getState().select(topmostClip.id);
    } else {
      core.store.getState().deselect();
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-card rounded-sm relative">
          <div
            onContextMenu={handleContextMenu}
            style={{
              flex: 1,
              position: "relative", // Ensure relative positioning for absolute children if needed
              overflow: "hidden", // Hide anything outside (though canvas masks it too)
            }}
          >
            <canvas
              ref={canvasRef}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                outline: "none", // Avoid focus outline on canvas click
              }}
              tabIndex={0}
            />
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent
        className="w-44"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {selectedClip && selectedClip?.type !== "Transition" ? (
          <>
            {!isLocked && (
              <>
                <ContextMenuItem onClick={handleCopy} disabled={!selectedClip}>
                  <Copy className="mr-2 w-4 h-4" />
                  Copy
                  <ContextMenuShortcut>⌘ C</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={handlePaste} disabled={!hasClipboard}>
                  <Clipboard className="mr-2 w-4 h-4" />
                  Paste
                  <ContextMenuShortcut>⌘ V</ContextMenuShortcut>
                </ContextMenuItem>

                <ContextMenuItem onClick={handleDuplicate} disabled={!selectedClip}>
                  <CopyPlus className="mr-2 w-4 h-4" />
                  Duplicate
                  <ContextMenuShortcut>⌘ D</ContextMenuShortcut>
                </ContextMenuItem>
              </>
            )}

            <ContextMenuItem onClick={handleToggleLock}>
              {isLocked ? (
                <LockKeyholeOpen className="mr-2 w-4 h-4" />
              ) : (
                <LockKeyhole className="mr-2 w-4 h-4" />
              )}
              {isLocked ? "Unlock" : "Lock"}
              <ContextMenuShortcut>⌘ L</ContextMenuShortcut>
            </ContextMenuItem>

            {!isLocked && (
              <ContextMenuItem onClick={handleDelete} disabled={!selectedClip}>
                <Trash2 className="mr-2 w-4 h-4" />
                Delete
                <ContextMenuShortcut>⌫</ContextMenuShortcut>
              </ContextMenuItem>
            )}
          </>
        ) : (
          <ContextMenuItem onClick={handlePaste} disabled={!hasClipboard}>
            <Clipboard className="mr-2 w-4 h-4" />
            Paste
            <ContextMenuShortcut>⌘ V</ContextMenuShortcut>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
