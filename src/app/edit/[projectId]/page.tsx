"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Editor from "@/components/editor/editor";
import { storageService } from "@/lib/storage/storage-service";
import { useProjectStore } from "@/stores/project-store";

export default function EditProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.projectId as string;
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        async function loadProjectData() {
            if (!projectId) return;

            try {
                const project = await storageService.loadProject({ id: projectId });

                if (!project) {
                    console.error("Project not found");
                    router.push("/projects");
                    return;
                }

                // Initialize project store
                useProjectStore.getState().setCanvasSize(project.canvasSize, project.canvasMode || "preset");
                if (project.fps) {
                    useProjectStore.getState().setFps(project.fps);
                }

                // In the future: load timeline and clips here if implemented in storageService
            } catch (err) {
                console.error("Failed to load project", err);
            } finally {
                setIsLoaded(true);
            }
        }

        loadProjectData();
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
