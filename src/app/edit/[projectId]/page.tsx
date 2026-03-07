"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@/components/editor/editor";
import { useProjectStore } from "@/stores/project-store";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);

        if (!res.ok) {
          router.push("/projects");
          return;
        }

        const project = await res.json();

        const projectStore = useProjectStore.getState();

        projectStore.setCanvasSize(project.canvasSize, project.canvasMode || "preset");

        if (project.fps) {
          projectStore.setFps(project.fps);
        }

        if (project.data) {
          projectStore.setInitialStudioJSON(project.data);
        }
      } catch (error) {
        console.error("Failed to load project", error);
        router.push("/projects");
      } finally {
        setIsLoaded(true);
      }
    };

    loadProject();
  }, [projectId, router]);

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground animate-pulse">Loading project...</p>
      </div>
    );
  }

  return <Editor />;
}
