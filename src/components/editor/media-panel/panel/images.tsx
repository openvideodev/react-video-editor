"use client";

import { useState, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { useProjectStore } from "@/stores/project-store";
import { Image, Log } from "openvideo";
import { Search, Image as ImageIcon, Loader2 } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { VisualsChatPanel } from "../visuals-chat-panel";
import { debounce } from "lodash";

interface PexelsImage {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  alt: string;
}

export default function PanelImages() {
  const { studio } = useStudioStore();
  const { canvasSize } = useProjectStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<PexelsImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchImages = async (query: string) => {
    setIsLoading(true);
    try {
      const url = query
        ? `/api/pexels?type=image&query=${encodeURIComponent(query)}`
        : `/api/pexels?type=image`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.photos) {
        setImages(data.photos);
      } else {
        setImages([]);
      }
    } catch (error) {
      console.error("Failed to fetch images:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the debounced fetch function
  const debouncedFetch = useCallback(
    debounce((query: string) => fetchImages(query), 500),
    [],
  );

  useEffect(() => {
    fetchImages("");
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFetch(query);
  };

  const addItemToCanvas = async (asset: PexelsImage) => {
    if (!studio) return;

    try {
      const imageClip = await Image.fromUrl(asset.src.large2x);
      imageClip.name = `Photo by ${asset.photographer}`;
      imageClip.display = { from: 0, to: 5 * 1e6 };
      imageClip.duration = 5 * 1e6;

      // Scale to fit and center in scene
      await imageClip.scaleToFit(canvasSize.width, canvasSize.height);
      imageClip.centerInScene(canvasSize.width, canvasSize.height);

      await studio.addClip(imageClip);
    } catch (error) {
      Log.error(`Failed to add image:`, error);
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
              placeholder="Search stock images..."
              className="bg-secondary/30 border-0 h-full text-xs box-border pl-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading && images.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <ImageIcon size={32} className="opacity-50" />
            <span className="text-sm">No images found</span>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="group relative aspect-square rounded-md overflow-hidden bg-secondary/50 cursor-pointer border border-transparent hover:border-primary/50 transition-all"
                onClick={() => addItemToCanvas(image)}
              >
                <img
                  src={image.src.medium}
                  alt={image.alt}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate font-medium">
                    {image.photographer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {isLoading && images.length > 0 && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="animate-spin text-muted-foreground" size={20} />
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
