"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { useProjectStore } from "@/stores/project-store";
import { Video, Log, Placeholder } from "openvideo";
import { Search, Film, Loader2 } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { cloneDeep, debounce } from "lodash";

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string;
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: "hd" | "sd";
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

export default function PanelVideos() {
  const { studio } = useStudioStore();
  const { canvasSize } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVideos = async (query: string) => {
    setIsLoading(true);
    try {
      const url = query
        ? `/api/pexels?type=video&query=${encodeURIComponent(query)}`
        : `/api/pexels?type=video`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.videos) {
        setVideos(data.videos);
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error("Failed to fetch videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((query: string) => fetchVideos(query), 500),
    [],
  );

  useEffect(() => {
    fetchVideos("");
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFetch(query);
  };

  const addItemToCanvas = async (asset: PexelsVideo) => {
    if (!studio) return;
    try {
      // Find the best quality mp4 link
      const videoFile = asset.video_files.find((f) => f.quality === "hd") || asset.video_files[0];
      if (!videoFile) throw new Error("No video file found");

      const src = videoFile.link;
      const clipName = `Video by ${asset.user.name}`;

      // 1. Create and add placeholder immediately
      const placeholder = new Placeholder(
        src,
        {
          width: asset.width,
          height: asset.height,
          duration: asset.duration * 1e6, // seconds to microseconds
        },
        "Video",
      );
      placeholder.name = clipName;

      // Scale to fit and center in scene
      await placeholder.scaleToFit(canvasSize.width, canvasSize.height);
      placeholder.centerInScene(canvasSize.width, canvasSize.height);

      await studio.addClip(placeholder);

      // 2. Load the real clip in the background
      Video.fromUrl(src)
        .then(async (videoClip) => {
          videoClip.name = clipName;

          // 3. Replace all placeholders with this source once loaded
          await studio.timeline.replaceClipsBySource(src, async (oldClip) => {
            const clone = await videoClip.clone();
            // Copy state from placeholder (user might have moved/resized/split it)
            clone.id = oldClip.id; // Keep the same ID if possible, or replaceClipsBySource handles it
            clone.name = oldClip.name; // Keep the name from placeholder
            clone.left = oldClip.left;
            clone.top = oldClip.top;
            clone.width = oldClip.width;
            clone.height = oldClip.height;
            const realDuration = videoClip.meta.duration;
            const newTrim = { ...oldClip.trim };
            newTrim.to = Math.max(newTrim.to, realDuration);
            newTrim.from = Math.min(newTrim.from, newTrim.to);
            console.warn(
              "This needs to be reviewed. assets from pexels may not have the right duration",
            );
            clone.display = { ...oldClip.display };
            clone.trim = newTrim;
            clone.duration = (newTrim.to - newTrim.from) / clone.playbackRate;
            clone.display.to = clone.display.from + clone.duration;
            clone.zIndex = oldClip.zIndex;
            return clone;
          });
        })
        .catch((err) => {
          Log.error("Failed to load video in background:", err);
          // Optional: handle failure by removing placeholder or showing error
        });
    } catch (error) {
      Log.error(`Failed to add video:`, error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div>
        <div className="flex-1 p-4">
          <InputGroup>
            <InputGroupAddon className="bg-secondary/30 pointer-events-none text-muted-foreground w-8 justify-center">
              <Search size={14} />
            </InputGroupAddon>

            <InputGroupInput
              placeholder="Search stock videos..."
              className="bg-secondary/30 border-0 h-full text-xs box-border pl-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : videos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <Film size={32} className="opacity-50" />
            <span className="text-sm">No videos found</span>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="group relative aspect-square rounded-md overflow-hidden bg-secondary/50 cursor-pointer border border-transparent hover:border-primary/50 transition-all"
                onClick={() => addItemToCanvas(video)}
              >
                <div className="w-full h-full flex items-center justify-center bg-black/20 text-[0px]">
                  <img
                    src={video.image}
                    className="w-full h-full object-cover pointer-events-none"
                    alt={video.user.name}
                  />

                  <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">
                    {Math.floor(video.duration)}s
                  </span>
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate font-medium">{video.user.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {isLoading && videos.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
