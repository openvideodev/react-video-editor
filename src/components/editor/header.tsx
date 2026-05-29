"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { fontManager, Log, type IClip } from "@openvideo/engine-pixi";
import { ExportModal } from "./export-modal";
import { LogoIcons } from "../shared/logos";
import Link from "next/link";
import { Icons } from "../shared/icons";
import {
  Keyboard,
  FileJson,
  Download,
  Upload,
  Settings,
  Database,
  FilePlus,
  Square,
  Smartphone,
  Monitor,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { ShortcutsModal } from "./shortcuts-modal";
import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AutosizeInput from "../ui/autosize-input";
import { authClient } from "@/lib/auth-client";
import { core, projectStore } from "@/lib/project";
import { useStore } from "zustand";

export default function Header() {
  const { studio } = useStudioStore();
  const { aspectRatio, setCanvasSize } = useProjectStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: session } = authClient.useSession();
  const { projectName, setProjectName } = useProjectStore();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState(projectName || "Untitled video");

  // Sync title with store when project name changes externally (like on initial load)
  useEffect(() => {
    if (projectName && projectName !== title) {
      setTitle(projectName);
    }
  }, [projectName]);

  const handleApplyCustomSize = () => {
    const w = parseInt(customWidth);
    const h = parseInt(customHeight);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
      setCanvasSize({ width: w, height: h }, "Custom");
    } else {
      toast.error("Invalid dimensions");
    }
  };

  const handleGetStarted = (route: string) => {
    router.push(route);
  };

  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  // Track undo/redo availability from Core store history
  const canUndo = useStore(projectStore, (s) => s.history.length > 0);
  const canRedo = useStore(projectStore, (s) => s.future.length > 0);

  // NOTE: canUndo/canRedo state now sourced from core.store — no studio history listener needed.

  // const handleSave = async (showToast = true) => {
  //   if (!studio || !projectId) return;

  //   setIsSaving(true);
  //   let toastId;
  //   if (showToast) {
  //     toastId = toast.loading('Saving project...');
  //   }

  //   try {
  //     const studioJSON = studio.exportToJSON();
  //     await storageService.saveProjectFull(projectId, studioJSON);
  //     console.log('Project saved', studioJSON);
  //     if (showToast) {
  //       toast.success('Project saved', { id: toastId });
  //     }
  //   } catch (error) {
  //     console.error('Failed to save project', error);
  //     if (showToast) {
  //       toast.error('Failed to save project', { id: toastId });
  //     }
  //   } finally {
  //     setIsSaving(false);
  //   }
  // };
  // Auto-save on studio changes (with debounce)
  // useEffect(() => {
  //   if (!studio || !projectId) return;

  //   let timeoutId: NodeJS.Timeout;

  //   const onStudioChange = () => {
  //     clearTimeout(timeoutId);
  //     timeoutId = setTimeout(() => {
  //       handleSave(false); // Silent save
  //     }, 1000); // 1 second debounce
  //   };
  //   const eventsToListen = [
  //     'history:changed',
  //     'clip:added',
  //     'clip:removed',
  //     'clip:updated',
  //     'clip:moved',
  //     'track:added',
  //     'track:removed',
  //     'clips:removed',
  //     'clip:replaced',
  //     'clip:propsChange',
  //     'propsChange',
  //   ];

  //   eventsToListen.forEach((event) => {
  //     studio.on(event, onStudioChange);
  //   });

  //   return () => {
  //     eventsToListen.forEach((event) => {
  //       studio.off(event, onStudioChange);
  //     });
  //     clearTimeout(timeoutId);
  //   };
  // }, [studio, projectId]);

  const handleNew = () => {
    const confirmed = window.confirm(
      "Are you sure you want to start a new project? Unsaved changes will be lost.",
    );
    if (confirmed) {
      core.project.new();
    }
  };

  const handleExportJSON = () => {
    try {
      const json = core.project.export();
      if (Object.keys(json.clips).length === 0) {
        alert("No clips to export");
        return;
      }

      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const aEl = document.createElement("a");
      document.body.appendChild(aEl);
      aEl.href = url;
      aEl.download = `${projectName || "project"}-${Date.now()}.json`;
      aEl.click();

      setTimeout(() => {
        if (document.body.contains(aEl)) {
          document.body.removeChild(aEl);
        }
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      Log.error("Export to JSON error:", error);
      alert("Failed to export to JSON: " + (error as Error).message);
    }
  };

  const handleImportJSON = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";
    input.style.display = "none";

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const json = JSON.parse(text);
        core.project.import(json);
        toast.success("Project imported successfully");
      } catch (error) {
        Log.error("Load from JSON error:", error);
        alert("Failed to load from JSON: " + (error as Error).message);
      } finally {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      }
    };

    document.body.appendChild(input);
    input.click();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between px-4 bg-card z-10 border-b">
      <div className="flex items-center gap-3">
        <div
          className="p-1 bg-secondary"
          onClick={() => {
            console.log(core.project.export());
          }}
        >
          <LogoIcons.scenify className="h-6 w-6" />
        </div>
        <div className="pointer-events-auto flex h-10 items-center gap-2 rounded-md">
          <AutosizeInput
            name="title"
            value={title}
            onChange={handleTitleChange}
            width={150}
            inputClassName="border-none outline-none px-1 text-sm font-medium"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4 pr-4">
        <div className="flex items-center">
          <Button
            onClick={() => core.undo()}
            disabled={!canUndo}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <Icons.undo className="size-4.5" />
          </Button>
          <Button
            onClick={() => core.redo()}
            disabled={!canRedo}
            className="text-muted-foreground h-8 w-8"
            variant="ghost"
            size="icon"
          >
            <Icons.redo className="size-4.5" />
          </Button>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsShortcutsModalOpen(true)}
          >
            <Keyboard className="size-5" />
          </Button>
        </div>

        <Button size="sm" className="gap-2 h-8 px-4" onClick={() => setIsExportModalOpen(true)}>
          Download
        </Button>

        <ExportModal open={isExportModalOpen} onOpenChange={setIsExportModalOpen} />
        <ShortcutsModal open={isShortcutsModalOpen} onOpenChange={setIsShortcutsModalOpen} />
      </div>
    </header>
  );
}
