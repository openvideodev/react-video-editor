import type { TProject } from "@/types/project";
import type { MediaFile } from "@/types/media";
import { IndexedDBAdapter } from "./indexeddb-adapter";
import { OPFSAdapter } from "./opfs-adapter";
import type { MediaFileData, StorageConfig, TimelineData } from "./types";
import type { TimelineTrack } from "@/types/timeline";
import type { SavedSoundsData, SavedSound, SoundEffect } from "@/types/sounds";

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  usedMB: number;
  quotaMB: number;
  percentUsed: number;
  isPersisted: boolean;
}

class StorageService {
  private savedSoundsAdapter: IndexedDBAdapter<SavedSoundsData>;
  private config: StorageConfig;

  constructor() {
    this.config = {
      projectsDb: "video-editor-projects",
      mediaDb: "video-editor-media",
      timelineDb: "video-editor-timelines",
      savedSoundsDb: "video-editor-saved-sounds",
      version: 1,
    };

    this.savedSoundsAdapter = new IndexedDBAdapter<SavedSoundsData>(
      this.config.savedSoundsDb,
      "saved-sounds",
      this.config.version,
    );
  }

  // Helper to get project-specific media adapters
  private getProjectMediaAdapters({ projectId }: { projectId: string }) {
    const mediaMetadataAdapter = new IndexedDBAdapter<MediaFileData>(
      `${this.config.mediaDb}-${projectId}`,
      "media-metadata",
      this.config.version,
    );

    const mediaFilesAdapter = new OPFSAdapter(`media-files-${projectId}`);

    return { mediaMetadataAdapter, mediaFilesAdapter };
  }

  // Helper to get project-specific timeline adapter
  private getProjectTimelineAdapter({
    projectId,
    sceneId,
  }: {
    projectId: string;
    sceneId?: string;
  }) {
    const dbName = sceneId
      ? `${this.config.timelineDb}-${projectId}-${sceneId}`
      : `${this.config.timelineDb}-${projectId}`;

    return new IndexedDBAdapter<TimelineData>(dbName, "timeline", this.config.version);
  }

  // Project operations
  async saveProject({ project }: { project: TProject }): Promise<void> {
    // We try to update first, if it fails or if it's new we might need a different approach
    // But for simplicity, we'll check if it exists or just use a dedicated "update" vs "create" approach
    // In this singleton service, we can just call the individual API

    try {
      // First check if project exists
      const existing = await this.loadProject({ id: project.id });

      const res = await fetch(`/api/projects${existing ? `/${project.id}` : ""}`, {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: project.id,
          name: project.name,
          thumbnail: project.thumbnail,
          canvasSize: project.canvasSize,
          canvasMode: project.canvasMode,
          fps: project.fps,
          data: project.data, // This is the single scene data
          currentSceneId: project.currentSceneId,
          bookmarks: project.bookmarks,
          mediaItems: project.mediaItems,
        }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save project: ${res.statusText}`);
      }
    } catch (e) {
      console.error("Error saving project to DB:", e);
      throw e;
    }
  }

  async saveProjectFull(projectId: string, data: any): Promise<void> {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) {
        throw new Error(`Failed to save project data: ${res.statusText}`);
      }
    } catch (e) {
      console.error("Error saving project data to DB:", e);
      throw e;
    }
  }

  async updateProject(projectId: string, updates: Partial<TProject>): Promise<void> {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        throw new Error(`Failed to update project: ${res.statusText}`);
      }
    } catch (e) {
      console.error("Error updating project in DB:", e);
      throw e;
    }
  }

  async loadProject({ id }: { id: string }): Promise<TProject | null> {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) return null;

      const dbProject = await res.json();

      // Mapping from DB model (project) to TProject
      return {
        id: dbProject.id,
        name: dbProject.name,
        thumbnail: dbProject.thumbnail,
        createdAt: new Date(dbProject.createdAt),
        updatedAt: new Date(dbProject.updatedAt),
        scenes: [], // Scenes are now simplified out or handled differently
        currentSceneId: dbProject.currentSceneId || "",
        backgroundColor: dbProject.backgroundColor,
        backgroundType: dbProject.backgroundType,
        blurIntensity: dbProject.blurIntensity,
        bookmarks: dbProject.bookmarks || [],
        fps: dbProject.fps,
        canvasSize: dbProject.canvasSize,
        canvasMode: dbProject.canvasMode,
        data: dbProject.data,
      } as TProject;
    } catch (e) {
      console.error("Error loading project from DB:", e);
      return null;
    }
  }

  async loadAllProjects(): Promise<TProject[]> {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return [];

      const dbProjects = await res.json();

      return dbProjects.map((dbProject: any) => ({
        id: dbProject.id,
        name: dbProject.name,
        thumbnail: dbProject.thumbnail,
        createdAt: new Date(dbProject.createdAt),
        updatedAt: new Date(dbProject.updatedAt),
        scenes: [],
        currentSceneId: dbProject.currentSceneId || "",
        backgroundColor: dbProject.backgroundColor,
        backgroundType: dbProject.backgroundType,
        blurIntensity: dbProject.blurIntensity,
        bookmarks: dbProject.bookmarks || [],
        fps: dbProject.fps,
        canvasSize: dbProject.canvasSize,
        canvasMode: dbProject.canvasMode,
        data: dbProject.data,
      }));
    } catch (e) {
      console.error("Error loading all projects from DB:", e);
      return [];
    }
  }

  async deleteProject({ id }: { id: string }): Promise<void> {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Failed to delete project: ${res.statusText}`);
      }

      // Also delete project-specific local data (media/temp files)
      const { mediaFilesAdapter } = this.getProjectMediaAdapters({
        projectId: id,
      });
      await mediaFilesAdapter.clear();

      const timelineAdapter = this.getProjectTimelineAdapter({ projectId: id });
      await timelineAdapter.clear();
    } catch (e) {
      console.error("Failed to delete project or clear local data", e);
      throw e;
    }
  }

  // Legacy OPFS serialization removed - everything is now in DB JSON

  // Media operations
  async saveMediaFile({
    projectId,
    mediaItem,
  }: {
    projectId: string;
    mediaItem: MediaFile;
  }): Promise<void> {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });

    // Save file to project-specific OPFS
    await mediaFilesAdapter.set(mediaItem.id, mediaItem.file);

    // Save metadata to project-specific IndexedDB
    const metadata: MediaFileData = {
      id: mediaItem.id,
      name: mediaItem.name,
      type: mediaItem.type,
      size: mediaItem.file.size,
      lastModified: mediaItem.file.lastModified,
      width: mediaItem.width,
      height: mediaItem.height,
      duration: mediaItem.duration,
      ephemeral: mediaItem.ephemeral,
    };

    await mediaMetadataAdapter.set(mediaItem.id, metadata);
  }

  async loadMediaFile({
    projectId,
    id,
  }: {
    projectId: string;
    id: string;
  }): Promise<MediaFile | null> {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });

    const [file, metadata] = await Promise.all([
      mediaFilesAdapter.get(id),
      mediaMetadataAdapter.get(id),
    ]);

    if (!file || !metadata) return null;

    let url: string;
    if (metadata.type === "image" && (!file.type || file.type === "")) {
      try {
        const text = await file.text();
        if (text.trim().startsWith("<svg")) {
          const svgBlob = new Blob([text], { type: "image/svg+xml" });
          url = URL.createObjectURL(svgBlob);
        } else {
          url = URL.createObjectURL(file);
        }
      } catch {
        url = URL.createObjectURL(file);
      }
    } else {
      url = URL.createObjectURL(file);
    }

    return {
      id: metadata.id,
      name: metadata.name,
      type: metadata.type,
      file,
      url,
      width: metadata.width,
      height: metadata.height,
      duration: metadata.duration,
      ephemeral: metadata.ephemeral,
    };
  }

  async loadAllMediaFiles({ projectId }: { projectId: string }): Promise<MediaFile[]> {
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
      projectId,
    });

    const mediaIds = await mediaMetadataAdapter.list();
    const mediaItems: MediaFile[] = [];

    for (const id of mediaIds) {
      const item = await this.loadMediaFile({ projectId, id });
      if (item) {
        mediaItems.push(item);
      }
    }

    return mediaItems;
  }

  async deleteMediaFile({ projectId, id }: { projectId: string; id: string }): Promise<void> {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });

    await Promise.all([mediaFilesAdapter.remove(id), mediaMetadataAdapter.remove(id)]);
  }

  async deleteProjectMedia({ projectId }: { projectId: string }): Promise<void> {
    const { mediaMetadataAdapter, mediaFilesAdapter } = this.getProjectMediaAdapters({ projectId });

    await Promise.all([mediaMetadataAdapter.clear(), mediaFilesAdapter.clear()]);
  }

  // Timeline operations - supports both legacy and scene-based storage
  async saveTimeline({
    projectId,
    tracks,
    sceneId,
  }: {
    projectId: string;
    tracks: TimelineTrack[];
    sceneId?: string;
  }): Promise<void> {
    const timelineAdapter = this.getProjectTimelineAdapter({
      projectId,
      sceneId,
    });
    const timelineData: TimelineData = {
      tracks,
      lastModified: new Date().toISOString(),
    };
    await timelineAdapter.set("timeline", timelineData);
  }

  async loadTimeline({
    projectId,
    sceneId,
  }: {
    projectId: string;
    sceneId?: string;
  }): Promise<TimelineTrack[] | null> {
    const timelineAdapter = this.getProjectTimelineAdapter({
      projectId,
      sceneId,
    });
    const timelineData = await timelineAdapter.get("timeline");
    return timelineData ? timelineData.tracks : null;
  }

  async deleteProjectTimeline({ projectId }: { projectId: string }): Promise<void> {
    const timelineAdapter = this.getProjectTimelineAdapter({ projectId });
    await timelineAdapter.remove("timeline");
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    // Note: Projects should be cleared via API or manually in DB
    // This local clear is for media/saved sounds
    await this.savedSoundsAdapter.clear();
  }

  async getStorageInfo(): Promise<{
    isOPFSSupported: boolean;
    isIndexedDBSupported: boolean;
  }> {
    return {
      isOPFSSupported: this.isOPFSSupported(),
      isIndexedDBSupported: this.isIndexedDBSupported(),
    };
  }

  async getProjectStorageInfo({ projectId }: { projectId: string }): Promise<{
    mediaItems: number;
    hasTimeline: boolean;
  }> {
    const { mediaMetadataAdapter } = this.getProjectMediaAdapters({
      projectId,
    });
    const timelineAdapter = this.getProjectTimelineAdapter({ projectId });

    const [mediaIds, timelineData] = await Promise.all([
      mediaMetadataAdapter.list(),
      timelineAdapter.get("timeline"),
    ]);

    return {
      mediaItems: mediaIds.length,
      hasTimeline: !!timelineData,
    };
  }

  async loadSavedSounds(): Promise<SavedSoundsData> {
    try {
      const savedSoundsData = await this.savedSoundsAdapter.get("user-sounds");
      return (
        savedSoundsData || {
          sounds: [],
          lastModified: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Failed to load saved sounds:", error);
      return { sounds: [], lastModified: new Date().toISOString() };
    }
  }

  async saveSoundEffect({ soundEffect }: { soundEffect: SoundEffect }): Promise<void> {
    try {
      const currentData = await this.loadSavedSounds();

      // Check if sound is already saved
      if (currentData.sounds.some((sound) => sound.id === soundEffect.id)) {
        return; // Already saved
      }

      const savedSound: SavedSound = {
        id: soundEffect.id,
        name: soundEffect.name,
        username: soundEffect.username,
        previewUrl: soundEffect.previewUrl,
        downloadUrl: soundEffect.downloadUrl,
        duration: soundEffect.duration,
        tags: soundEffect.tags,
        license: soundEffect.license,
        savedAt: new Date().toISOString(),
      };

      const updatedData: SavedSoundsData = {
        sounds: [...currentData.sounds, savedSound],
        lastModified: new Date().toISOString(),
      };

      await this.savedSoundsAdapter.set("user-sounds", updatedData);
    } catch (error) {
      console.error("Failed to save sound effect:", error);
      throw error;
    }
  }

  async removeSavedSound({ soundId }: { soundId: number }): Promise<void> {
    try {
      const currentData = await this.loadSavedSounds();

      const updatedData: SavedSoundsData = {
        sounds: currentData.sounds.filter((sound) => sound.id !== soundId),
        lastModified: new Date().toISOString(),
      };

      await this.savedSoundsAdapter.set("user-sounds", updatedData);
    } catch (error) {
      console.error("Failed to remove saved sound:", error);
      throw error;
    }
  }

  async isSoundSaved({ soundId }: { soundId: number }): Promise<boolean> {
    try {
      const currentData = await this.loadSavedSounds();
      return currentData.sounds.some((sound) => sound.id === soundId);
    } catch (error) {
      console.error("Failed to check if sound is saved:", error);
      return false;
    }
  }

  async clearSavedSounds(): Promise<void> {
    try {
      await this.savedSoundsAdapter.remove("user-sounds");
    } catch (error) {
      console.error("Failed to clear saved sounds:", error);
      throw error;
    }
  }

  // Storage statistics
  async getStorageStats(): Promise<StorageStats | null> {
    if (!("storage" in navigator) || !navigator.storage.estimate) {
      return null;
    }
    try {
      const [estimate, persisted] = await Promise.all([
        navigator.storage.estimate(),
        navigator.storage.persisted?.() ?? Promise.resolve(false),
      ]);
      const usedBytes = estimate.usage ?? 0;
      const quotaBytes = estimate.quota ?? 0;
      return {
        usedBytes,
        quotaBytes,
        usedMB: Math.round((usedBytes / (1024 * 1024)) * 10) / 10,
        quotaMB: Math.round((quotaBytes / (1024 * 1024)) * 10) / 10,
        percentUsed: quotaBytes > 0 ? Math.round((usedBytes / quotaBytes) * 100) : 0,
        isPersisted: persisted,
      };
    } catch (error) {
      console.error("Failed to get storage stats:", error);
      return null;
    }
  }

  // Check browser support
  isOPFSSupported(): boolean {
    return OPFSAdapter.isSupported();
  }

  isIndexedDBSupported(): boolean {
    return "indexedDB" in window;
  }

  isFullySupported(): boolean {
    return this.isIndexedDBSupported() && this.isOPFSSupported();
  }
}

// Export singleton instance
export const storageService = new StorageService();
export { StorageService };
