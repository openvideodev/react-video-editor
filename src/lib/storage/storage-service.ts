import type { TProject } from "@/types/project";
import type { MediaFile } from "@/types/media";
import { IndexedDBAdapter } from "./indexeddb-adapter";
import { OPFSAdapter } from "./opfs-adapter";
import type { MediaFileData, StorageConfig, TimelineData } from "./types";
import type { TimelineTrack } from "@/types/timeline";
import type { SavedSoundsData, SavedSound, SoundEffect } from "@/types/sounds";
import { nanoid } from "nanoid";

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

  private getProjectAdapter() {
    return new IndexedDBAdapter<TProject>("video-editor-projects-db", "projects", 1);
  }

  // Project operations - now using client-side IndexedDB only
  async saveProject({ project }: { project: TProject }): Promise<void> {
    try {
      const projectAdapter = this.getProjectAdapter();
      const existing = await projectAdapter.get(project.id);

      const projectToSave: TProject = {
        ...project,
        updatedAt: new Date(),
        createdAt: existing?.createdAt || new Date(),
      };

      await projectAdapter.set(project.id, projectToSave);
    } catch (e) {
      console.error("Error saving project to IndexedDB:", e);
      throw e;
    }
  }

  async saveProjectFull(projectId: string, data: any): Promise<void> {
    try {
      const projectAdapter = this.getProjectAdapter();
      const existing = await projectAdapter.get(projectId);

      if (existing) {
        const updated: TProject = {
          ...existing,
          data,
          updatedAt: new Date(),
        };
        await projectAdapter.set(projectId, updated);
      }
    } catch (e) {
      console.error("Error saving project data to IndexedDB:", e);
      throw e;
    }
  }

  async updateProject(projectId: string, updates: Partial<TProject>): Promise<void> {
    try {
      const projectAdapter = this.getProjectAdapter();
      const existing = await projectAdapter.get(projectId);

      if (existing) {
        const updated: TProject = {
          ...existing,
          ...updates,
          updatedAt: new Date(),
        };
        await projectAdapter.set(projectId, updated);
      }
    } catch (e) {
      console.error("Error updating project in IndexedDB:", e);
      throw e;
    }
  }

  async loadProject({ id }: { id: string }): Promise<TProject | null> {
    try {
      const projectAdapter = this.getProjectAdapter();
      const project = await projectAdapter.get(id);

      if (!project) return null;

      return {
        ...project,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt),
      };
    } catch (e) {
      console.error("Error loading project from IndexedDB:", e);
      return null;
    }
  }

  async loadAllProjects(): Promise<TProject[]> {
    try {
      const projectAdapter = this.getProjectAdapter();
      const projectIds = await projectAdapter.list();

      const projects: TProject[] = [];
      for (const id of projectIds) {
        const project = await projectAdapter.get(id);
        if (project) {
          projects.push({
            ...project,
            createdAt: new Date(project.createdAt),
            updatedAt: new Date(project.updatedAt),
          });
        }
      }

      // Sort by updatedAt desc
      return projects.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (e) {
      console.error("Error loading all projects from IndexedDB:", e);
      return [];
    }
  }

  async deleteProject({ id }: { id: string }): Promise<void> {
    try {
      // Delete from IndexedDB
      const projectAdapter = this.getProjectAdapter();
      await projectAdapter.remove(id);

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

  // All project data is stored client-side in IndexedDB

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
