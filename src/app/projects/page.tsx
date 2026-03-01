"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { storageService } from "@/lib/storage/storage-service";
import { TProject } from "@/types/project";
import { generateUUID } from "@/utils/id";
import { Button } from "@/components/ui/button";
import { Plus, Video, Trash2, Clock } from "lucide-react";
import Navbar from "@/components/navbar";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<TProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        setIsLoading(true);
        try {
            const loaded = await storageService.loadAllProjects();
            setProjects(loaded);
        } catch (e) {
            console.error("Failed to load projects", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        const sceneId = generateUUID();
        const newProject: TProject = {
            id: generateUUID(),
            name: "New Video Project",
            thumbnail: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            scenes: [
                {
                    id: sceneId,
                    name: "Main Scene",
                    isMain: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            currentSceneId: sceneId,
            canvasSize: { width: 1080, height: 1920 },
            canvasMode: "preset",
            fps: 30,
        };

        try {
            await storageService.saveProject({ project: newProject });
            router.push(`/edit/${newProject.id}`);
        } catch (e) {
            console.error("Failed to create project", e);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await storageService.deleteProject({ id });
            await loadProjects();
        } catch (error) {
            console.error("Failed to delete project", error);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Manage and edit your video projects.
                        </p>
                    </div>
                    <Button onClick={handleCreateProject} className="gap-2 rounded-full cursor-pointer">
                        <Plus className="w-4 h-4" />
                        New Project
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-12 text-center bg-card/10 mt-8">
                        <div className="w-16 h-16 bg-secondary/30 rounded-2xl flex items-center justify-center mb-6">
                            <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            Create your first video project to get started with the OpenVideo editor.
                        </p>
                        <Button onClick={handleCreateProject} className="gap-2 rounded-full cursor-pointer">
                            <Plus className="w-4 h-4" />
                            Create Project
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                onClick={() => router.push(`/edit/${project.id}`)}
                                className="group flex flex-col bg-card/30 rounded-2xl border border-border/50 overflow-hidden cursor-pointer hover:border-ring/50 transition-all hover:shadow-lg hover:-translate-y-1"
                            >
                                <div className="aspect-video bg-black/60 relative flex items-center justify-center">
                                    {project.thumbnail ? (
                                        <img
                                            src={project.thumbnail}
                                            alt={project.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Video className="w-10 h-10 text-muted-foreground/30" />
                                    )}
                                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="h-9 w-9 rounded-full bg-red-950/80 hover:bg-destructive text-white backdrop-blur-md border border-red-900/50"
                                            onClick={(e) => handleDeleteProject(e, project.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <h3 className="font-semibold text-lg truncate mb-1" title={project.name}>
                                        {project.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>
                                            {new Date(project.updatedAt).toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
