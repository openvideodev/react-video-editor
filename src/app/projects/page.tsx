"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { storageService } from "@/lib/storage/storage-service";
import { TProject } from "@/types/project";
import { generateUUID } from "@/utils/id";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Video,
  Search,
  Trash2,
  MoreHorizontal,
  X,
  PlusIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import { Input } from "@/components/ui/input";

// ─── Project Card ────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: TProject;
  onOpen: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const formattedDate = new Date(project.updatedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div onClick={() => onOpen(project.id)} className="group flex flex-col gap-2.5 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl sm:rounded-2xl bg-muted/30 border border-border/30 overflow-hidden transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-lg group-hover:shadow-black/10 group-hover:border-border/60">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Video className="w-7 h-7 sm:w-8 sm:h-8 text-muted-foreground/20" strokeWidth={1.5} />
          </div>
        )}

        {/* Actions overlay
                    - On touch (coarse pointer) devices: always show the menu button
                    - On mouse (fine pointer) devices: show on hover only */}
        <div
          className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={menuRef}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 pointer-fine:opacity-0 pointer-coarse:opacity-100 transition-opacity duration-150"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="h-7 w-7 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-black/70 hover:text-white active:scale-95 transition-all"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-36 rounded-xl border border-border/60 bg-popover shadow-xl py-1 text-sm">
                <button
                  onClick={(e) => {
                    setMenuOpen(false);
                    onDelete(e, project.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-destructive hover:bg-destructive/10 active:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="px-0.5">
        <p className="text-sm font-medium truncate leading-snug">{project.name}</p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{formattedDate}</p>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const [projects, setProjects] = useState<TProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
      name: "Untitled project",
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

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 50);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <header className="border-b border-border/80 shrink-0">
        {/* Primary row: always visible */}
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm min-w-0">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground active:text-foreground transition-colors shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            <span className="font-medium truncate">Projects</span>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search — desktop: inline field; mobile: icon toggles row below */}
            <div className="hidden sm:flex relative items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects…"
                className="h-8 pl-7 pr-7 text-xs w-44 bg-muted/30 border-border/30 rounded-lg placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-border/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-muted-foreground/50 hover:text-muted-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Mobile search icon */}
            <button
              onClick={openSearch}
              className="sm:hidden h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* New project — icon-only on mobile, full on sm+ */}
            <Button onClick={handleCreateProject} size="sm" className="h-8 rounded-full gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs">New project</span>
            </Button>
          </div>
        </div>

        {/* Secondary row: mobile search bar (collapses when closed) */}
        {searchOpen && (
          <div className="sm:hidden px-4 pb-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50 pointer-events-none" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects…"
                className="h-9 pl-7 pr-7 text-sm bg-muted/30 border-border/30 rounded-lg placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:border-border/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground shrink-0"
            >
              Cancel
            </button>
          </div>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <main className="flex-1 px-4 sm:px-6 py-5 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-5 h-5 border-2 border-muted border-t-foreground/40 rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground mt-8 space-y-2">
            <div className="py-2 text-stone-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  d="M2.07 5.258C2 5.626 2 6.068 2 6.95v2.3h19.953c-.072-1.049-.256-1.737-.723-2.256a3 3 0 0 0-.224-.225C20.151 6 18.834 6 16.202 6h-.374c-1.153 0-1.73 0-2.268-.153a4 4 0 0 1-.848-.352C12.224 5.224 11.816 4.815 11 4l-.55-.55c-.274-.274-.41-.41-.554-.53a4 4 0 0 0-2.18-.903C7.53 2 7.336 2 6.95 2c-.883 0-1.324 0-1.692.07A4 4 0 0 0 2.07 5.257m19.928 5.492H2V14c0 3.771 0 5.657 1.172 6.828S6.229 22 10 22h4c3.771 0 5.657 0 6.828-1.172S22 17.771 22 14v-2.202z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            {searchQuery ? (
              <>
                <h3 className="font-medium text-foreground">
                  No results for &ldquo;{searchQuery}&rdquo;
                </h3>
                <p className="text-sm">Try a different search term.</p>
              </>
            ) : (
              <>
                <h3 className="font-medium text-foreground">No projects yet</h3>
                <p className="text-sm mb-4">Create your first project to get started.</p>
                <Button
                  onClick={handleCreateProject}
                  variant="outline"
                  className="mt-1 px-5 rounded-full gap-1.5"
                >
                  <PlusIcon className="w-4 h-4" /> Create project
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={(id) => router.push(`/edit/${id}`)}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
