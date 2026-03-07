"use client";
import React, { useEffect, useState, useRef } from "react";
import { ExamplePlayer } from "@/components/example-player";
import { Studio, getTransitionOptions, ProjectJSON } from "openvideo";
import { CustomShaderForm } from "@/components/gallery/custom-preset-forms";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Preset thumbnail card ────────────────────────────────────────────────────
const PresetItem = ({
  label,
  image,
  isActive,
  onClick,
}: {
  label: string;
  image?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col gap-1.5 text-left transition-all duration-200 ${isActive ? "opacity-100" : "opacity-70 hover:opacity-100"}`}
  >
    <div
      className={`relative rounded-lg overflow-hidden bg-muted aspect-video w-full border transition-all duration-200 ${
        isActive
          ? "ring-2 ring-primary border-primary"
          : "border-border group-hover:border-primary/50"
      }`}
    >
      {image ? (
        <img src={image} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/5">
          <Play className="w-4 h-4 text-primary/40" />
        </div>
      )}
    </div>
    <span className="text-[11px] font-medium leading-tight truncate px-0.5">{label}</span>
  </button>
);

// ── Page ─────────────────────────────────────────────────────────────────────
const TransitionsPage = () => {
  const transitions = getTransitionOptions();
  const [project, setProject] = useState<ProjectJSON | undefined>();
  const [loading, setLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const studioRef = useRef<Studio | null>(null);
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/json/transitions.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => data && setProject(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePresetSelect = (preset: any) => {
    if (!project) return;
    setSelectedPreset(preset.key);
    const newProject = JSON.parse(JSON.stringify(project));
    const clip = newProject.clips.find((c: any) => c.type === "Transition");
    if (clip)
      clip.transitionEffect = { ...clip.transitionEffect, key: preset.key, name: preset.label };
    setProject(newProject);
    setLoading(true);
  };

  const handleCustomApply = (data: any) => {
    if (!project) return;
    const newProject = JSON.parse(JSON.stringify(project));
    const clip = newProject.clips.find((c: any) => c.type === "Transition");
    if (clip) {
      clip.transitionEffect = {
        ...clip.transitionEffect,
        key: "custom",
        name: data.label,
        fragment: data.fragment,
      };
      toast.success("Custom transition applied");
    }
    setProject(newProject);
    setLoading(true);
  };

  const handleSave = async (data: any) => {
    if (!session) {
      toast.error("Please sign in to save presets");
      router.push("/signin");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/custom-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.label || "My Transition",
          category: "transitions",
          data,
        }),
      });
      if (res.ok) toast.success("Transition saved!");
      else {
        const e = await res.json();
        toast.error(e.error || "Failed to save");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* ── Left panel ──────────────────────────────────────────── */}
      <div className="w-160 shrink-0 border-r flex flex-col overflow-hidden">
        <Tabs defaultValue="presets" className="flex flex-col flex-1 overflow-hidden">
          <TabsList className="bg-transparent h-auto py-2 px-4 justify-start gap-2 shrink-0 border-b w-full">
            <TabsTrigger
              value="presets"
              className="rounded-full px-4 h-8 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground text-xs font-medium transition-all flex-none"
            >
              Presets
            </TabsTrigger>
            <TabsTrigger
              value="customize"
              className="rounded-full px-4 h-8 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground text-xs font-medium transition-all flex-none"
            >
              Customize
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="rounded-full px-4 h-8 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground text-xs font-medium transition-all flex-none flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate
            </TabsTrigger>
          </TabsList>

          {/* Presets */}
          <TabsContent value="presets" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div
                className="p-3 grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}
              >
                {transitions.map((t) => (
                  <PresetItem
                    key={t.key}
                    label={t.label}
                    image={t.previewStatic}
                    isActive={selectedPreset === t.key}
                    onClick={() => handlePresetSelect(t)}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Customize */}
          <TabsContent value="customize" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                <CustomShaderForm
                  type="Transition"
                  onApply={handleCustomApply}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Generate */}
          <TabsContent value="generate" className="flex-1 overflow-hidden mt-0">
            <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-3">
                  Coming Soon
                </Badge>
                <h3 className="font-semibold text-sm">AI Transition Generator</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed max-w-50">
                  Describe a transition and let AI generate a custom GLSL shader for you.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Right panel: Preview ────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/30 p-6 overflow-hidden">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 text-center">
            Preview
          </p>
          <div className="relative rounded-xl overflow-hidden bg-black shadow-xl">
            <ExamplePlayer
              project={project}
              onLoad={() => setLoading(false)}
              onReady={(s) => {
                studioRef.current = s;
              }}
            />
            {loading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-7 h-7 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-medium text-white/80">Loading…</p>
                </div>
              </div>
            )}
          </div>
          {selectedPreset && (
            <p className="text-center text-xs text-muted-foreground mt-3">
              Previewing:{" "}
              <span className="text-foreground font-medium">
                {transitions.find((t) => t.key === selectedPreset)?.label}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransitionsPage;
