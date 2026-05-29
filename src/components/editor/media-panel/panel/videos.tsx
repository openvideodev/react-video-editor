"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { core } from "@/lib/project";
import { Log } from "@openvideo/engine-pixi";
import { Search, Film, Loader2 } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { debounce } from "lodash";
import Draggable from "@/components/shared/draggable";
import { useIsDraggingOverTimeline } from "@/hooks/use-is-dragging-over-timeline";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [videos, setVideos] = useState<PexelsVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isDraggingOverTimeline = useIsDraggingOverTimeline();

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
    try {
      const videoFile = asset.video_files.find((f) => f.quality === "hd") || asset.video_files[0];
      if (!videoFile) throw new Error("No video file found");
      // Use the new Core command-based API to add a video clip
      await core.clip.add(
        {
          type: "Video",
          src: videoFile.link,
          name: `Video by ${asset.user.name}`,
          width: asset.width,
          height: asset.height,
          display: { from: 0, to: asset.duration * 1e6 },
          trim: { from: 0, to: asset.duration * 1e6 },
          metadata: {
            previewUrl: asset.image,
          },
        },
        { objectFit: "contain" },
      );
    } catch (error) {
      Log.error(`Failed to add video:`, error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div>
        <div className="p-4">
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
            {videos.map((video) => {
              const videoFile =
                video.video_files.find((f) => f.quality === "hd") || video.video_files[0];
              return (
                <Draggable
                  key={video.id}
                  data={{
                    type: "Video",
                    src: videoFile?.link,
                    name: `Video by ${video.user.name}`,
                    width: video.width,
                    height: video.height,
                    duration: video.duration * 1e6,
                    metadata: {
                      previewUrl: video.image,
                    },
                  }}
                  shouldDisplayPreview={!isDraggingOverTimeline}
                  renderCustomPreview={
                    <div className="w-20 aspect-video rounded-md overflow-hidden shadow-xl border-2 border-primary">
                      <img src={video.image} className="w-full h-full object-cover" />
                    </div>
                  }
                >
                  <div
                    className="group relative aspect-square rounded-md overflow-hidden bg-secondary/50 cursor-pointer border border-transparent hover:border-primary/50 transition-all"
                    onClick={() => addItemToCanvas(video)}
                  >
                    <div
                      className="w-full h-full flex items-center justify-center bg-black/20 text-[0px]"
                      style={{
                        backgroundImage: `url(${video.image})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <span className="absolute bottom-1 right-1 text-[8px] bg-black/60 text-white px-1 rounded">
                        {Math.floor(video.duration)}s
                      </span>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate font-medium">
                        {video.user.name}
                      </p>
                    </div>
                  </div>
                </Draggable>
              );
            })}
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
