"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@/components/editor/editor";
import { storageService } from "@/lib/storage/storage-service";
import { useProjectStore } from "@/stores/project-store";
import { registerCustomEffect, registerCustomTransition } from "openvideo";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [isLoaded, setIsLoaded] = useState(false);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!projectId || hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    async function loadProjectData() {
      try {
        const project = await storageService.loadProject({ id: projectId });

        if (!project) {
          console.error("Project not found");
          router.push("/projects");
          return;
        }

        const projectStore = useProjectStore.getState();

        try {
          const [effectsRes, transitionsRes] = await Promise.all([
            fetch("/api/custom-presets?category=effects"),
            fetch("/api/custom-presets?category=transitions"),
          ]);

          if (effectsRes.ok) {
            const { own: ownEffects = [], published: pubEffects = [] } = await effectsRes.json();

            for (const preset of [...ownEffects, ...pubEffects]) {
              const key = `custom_effect_${preset.id}`;
              registerCustomEffect(key, {
                key,
                label: preset.data?.label || preset.name,
                fragment: preset.data?.fragment,
              } as any);
            }
          }

          if (transitionsRes.ok) {
            const { own: ownTrans = [], published: pubTrans = [] } = await transitionsRes.json();

            for (const preset of [...ownTrans, ...pubTrans]) {
              const key = `custom_transition_${preset.id}`;
              registerCustomTransition(key, {
                key,
                label: preset.data?.label || preset.name,
                fragment: preset.data?.fragment,
              } as any);
            }
          }
        } catch (err) {
          console.warn("Failed to pre-register custom presets", err);
        }

        projectStore.setCanvasSize(project.canvasSize, project.canvasMode || "preset");

        if (project.fps) {
          projectStore.setFps(project.fps);
        }

        if (project.name) {
          projectStore.setProjectName(project.name);
        }

        projectStore.setInitialStudioJSON(project.data || null);
      } catch (err) {
        console.error("Failed to load project", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadProjectData();
  }, [projectId, router]);

  return (
    <>
      {!isLoaded && (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground absolute z-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground animate-pulse">Loading project...</p>
        </div>
      )}

      <div style={{ visibility: isLoaded ? "visible" : "hidden" }}>
        <Editor />
      </div>
    </>
  );
}
