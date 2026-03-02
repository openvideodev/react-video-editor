"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { IconShare } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { useStudioStore } from "@/stores/studio-store";
import { usePanelStore } from "@/stores/panel-store";
import { useProjectStore } from "@/stores/project-store";
import { DEFAULT_CANVAS_PRESETS } from "@/lib/editor-utils";
import { Log, type IClip } from "openvideo";
import { ExportModal } from "./export-modal";
import { LogoIcons } from "../shared/logos";
import Link from "next/link";
import { Icons } from "../shared/icons";
import {
  Keyboard,
  FileJson,
  Download,
  Upload,
  MessageSquare,
  Settings,
  Database,
  FilePlus,
  Square,
  Smartphone,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import { Compositor } from "openvideo";
import { ShortcutsModal } from "./shortcuts-modal";
import { useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ModeToggle } from "../ui/mode-toggle";
import { useRouter } from "next/navigation";

export default function Header() {
  const { studio } = useStudioStore();
  const { toggleCopilot, isCopilotVisible } = usePanelStore();
  const { aspectRatio, setCanvasSize } = useProjectStore();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [customWidth, setCustomWidth] = useState("");
  const [customHeight, setCustomHeight] = useState("");
  const router = useRouter();

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
  const handleBatchExport = async () => {
    if (!studio) return;
    setIsBatchExporting(true);
    const toastId = toast.loading("Initializing batch export...");

    try {
      // 1. Get animation keys and template
      const keysRes = await fetch("/api/batch-export");
      const { keys, template } = await keysRes.json();

      if (!keys || keys.length === 0) throw new Error("No animations found");

      // 2. Select project template: prefer current studio if it has clips, otherwise use API template
      const currentProject = studio.exportToJSON();
      const baseProject =
        currentProject.clips && currentProject.clips.length > 0
          ? currentProject
          : template;

      if (!baseProject.clips || baseProject.clips.length === 0) {
        throw new Error(
          "No template content available. Please add a clip to the canvas.",
        );
      }

      const settings = baseProject.settings || {};

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        toast.loading(`Rendering ${i + 1}/${keys.length}: ${key}...`, {
          id: toastId,
        });

        // Prepare project for this animation
        const project = JSON.parse(JSON.stringify(baseProject));

        // Find the first non-Audio/Transition/Effect clip to animate
        const targetClip =
          project.clips.find(
            (c: any) =>
              c.type !== "Audio" &&
              c.type !== "Transition" &&
              c.type !== "Effect",
          ) || project.clips[0];

        if (targetClip) {
          targetClip.animations = [
            {
              type: key,
              opts: { duration: 1000000, delay: 0 },
            },
          ];
          // Ensure clip covers the 1s duration
          targetClip.display = { from: 0, to: 1000000 };
          targetClip.duration = 1000000;
        }

        // Setup compositor
        const com = new Compositor({
          width: settings.width || 1080,
          height: settings.height || 1080,
          fps: settings.fps || 30,
          bgColor: settings.bgColor || "#000000",
          videoCodec: "avc1.42E032",
          bitrate: 10e6,
          // audio: true,
        });

        await com.initPixiApp();
        await com.loadFromJSON(project);

        // Render to blob
        const stream = com.output();
        const blob = await new Response(stream).blob();

        // Cleanup compositor
        com.destroy();

        // 3. Upload to server
        const formData = new FormData();
        formData.append("file", blob);
        formData.append("filename", key);

        const uploadRes = await fetch("/api/batch-export", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error(`Failed to save ${key}`);
      }

      toast.success(
        `Batch export complete! ${keys.length} videos saved to D:\\animations`,
        { id: toastId },
      );
    } catch (error: any) {
      toast.error(`Batch export failed: ${error.message}`, { id: toastId });
    } finally {
      setIsBatchExporting(false);
    }
  };
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    if (!studio) return;

    setCanUndo(studio.history.canUndo());
    setCanRedo(studio.history.canRedo());

    const handleHistoryChange = ({
      canUndo,
      canRedo,
    }: {
      canUndo: boolean;
      canRedo: boolean;
    }) => {
      setCanUndo(canUndo);
      setCanRedo(canRedo);
    };

    studio.on("history:changed", handleHistoryChange);

    return () => {
      studio.off("history:changed", handleHistoryChange);
    };
  }, [studio]);

  const handleNew = () => {
    if (!studio) return;
    const confirmed = window.confirm(
      "Are you sure you want to start a new project? Unsaved changes will be lost.",
    );
    if (confirmed) {
      studio.clear();
    }
  };

  const handleExportJSON = () => {
    if (!studio) return;

    try {
      // Get all clips from studio
      const clips = (studio as any).clips as IClip[];
      if (clips.length === 0) {
        alert("No clips to export");
        return;
      }

      // Export to JSON
      const json = studio.exportToJSON();
      const jsonString = JSON.stringify(json, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Download the JSON file
      const aEl = document.createElement("a");
      document.body.appendChild(aEl);
      aEl.href = url;
      aEl.download = `combo-project-${Date.now()}.json`;
      aEl.click();

      // Cleanup
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

        if (!json.clips || !Array.isArray(json.clips)) {
          throw new Error("Invalid JSON format: missing clips array");
        }

        if (!studio) {
          throw new Error("Studio not initialized");
        }

        // Filter out clips with empty sources (except Text, Caption, and Effect)
        const validClips = json.clips.filter((clipJSON: any) => {
          if (
            clipJSON.type === "Text" ||
            clipJSON.type === "Caption" ||
            clipJSON.type === "Effect" ||
            clipJSON.type === "Transition"
          ) {
            return true;
          }
          return clipJSON.src && clipJSON.src.trim() !== "";
        });

        if (validClips.length === 0) {
          throw new Error(
            "No valid clips found in JSON. All clips have empty source URLs.",
          );
        }

        const validJson = { ...json, clips: validClips };
        await studio.loadFromJSON(validJson);
      } catch (error) {
        Log.error("Load from JSON error:", error);
        alert("Failed to load from JSON: " + (error as Error).message);
      } finally {
        document.body.removeChild(input);
      }
    };

    document.body.appendChild(input);
    input.click();
  };

  return (
    <header className="relative flex h-[52px] w-full shrink-0 items-center justify-between px-4 bg-card z-10 border-b">
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <div
          className="pointer-events-auto flex h-9 w-9 bg-primary/20 items-center justify-center rounded-md "
          onClick={() => handleGetStarted("/")}
        >
          <LogoIcons.scenify width={24} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">File</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleExportJSON}>
              <Download className="mr-2 h-4 w-4" />
              <span>Export (to JSON)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleImportJSON}>
              <Upload className="mr-2 h-4 w-4" />
              <span>Import from JSON</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNew}>
              <FilePlus className="mr-2 h-4 w-4" />
              <span>Clear or New project</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 ">
              Resize
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 p-3">
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wider">
                  Presets
                </p>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { label: "Square", icon: Square, width: 1080, height: 1080 },
                    { label: "Portrait", icon: Smartphone, width: 1080, height: 1920 },
                    { label: "Landscape", icon: Monitor, width: 1920, height: 1080 },
                  ].map((preset) => {
                    const isSelected = aspectRatio === preset.label;
                    const Icon = preset.icon;
                    return (
                      <DropdownMenuItem
                        key={preset.label}
                        onClick={() =>
                          setCanvasSize(
                            { width: preset.width, height: preset.height },
                            preset.label,
                          )
                        }
                        className="text-xs justify-between cursor-pointer px-2 py-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{preset.label}</span>
                        </div>
                        <div
                          className={cn(
                            "flex h-3.5 w-3.5 items-center justify-center rounded-full border border-muted-foreground/50",
                            isSelected && "border-primary"
                          )}
                        >
                          {isSelected && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              </div>

              <div className="h-px bg-border/50 mx-1" />

              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground px-1 uppercase tracking-wider">
                  Custom
                </p>
                <div className="grid grid-cols-2 gap-2 px-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase">
                      Width
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      placeholder="1920"
                      className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-7"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground uppercase">
                      Height
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      placeholder="1080"
                      className="w-full bg-muted/50 border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary h-7"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleApplyCustomSize}
                  className="w-full h-8 text-xs font-medium mt-1"
                  size="sm"
                >
                  Apply
                </Button>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className=" pointer-events-auto flex h-10 items-center px-1.5">
          <Button
            onClick={() => studio?.undo()}
            disabled={!canUndo}
            variant="ghost"
            size="icon"
          >
            <Icons.undo className="size-5" />
          </Button>
          <Button
            onClick={() => studio?.redo()}
            disabled={!canRedo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.redo className="size-5" />
          </Button>
          {/* <Button
            variant="ghost"
            size="sm"
            onClick={handleBatchExport}
            disabled={isBatchExporting}
          >
            <Database className="mr-2 h-4 w-4" />
            Batch Export Anim
          </Button> */}
        </div>
      </div>

      {/* Center Section */}
      <div className="absolute text-sm font-medium left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        Untitled video
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <div className="flex items-center mr-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsShortcutsModalOpen(true)}
          >
            <Keyboard className="size-5" />
          </Button>

          <Button
            size={"sm"}
            variant="outline"
            onClick={toggleCopilot}
            className="h-7"
            title="Toggle Chat Copilot"
          >
            <Icons.ai className="size-5" />
            <span className="hidden md:block">AI Chat</span>
          </Button>
        </div>
        <Link href="https://discord.gg/SCfMrQx8kr" target="_blank">
          <Button className="h-7 rounded-lg" variant={"outline"}>
            <LogoIcons.discord className="w-6 h-6" />
            <span className="hidden md:block">Join Us</span>
          </Button>
        </Link>

        {/* End of right actions */}

        <ExportModal
          open={isExportModalOpen}
          onOpenChange={setIsExportModalOpen}
        />
        <ShortcutsModal
          open={isShortcutsModalOpen}
          onOpenChange={setIsShortcutsModalOpen}
        />

        <ModeToggle />

        <Button
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => setIsExportModalOpen(true)}
        >
          Download
        </Button>
      </div>
    </header>
  );
}
