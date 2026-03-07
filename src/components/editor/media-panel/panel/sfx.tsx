"use client";

import { useStudioStore } from "@/stores/studio-store";
import { Audio, Log } from "openvideo";
import { IconWaveSine } from "@tabler/icons-react";
import { useState, useEffect, useCallback } from "react";
import { AudioItem } from "./audio-item";
import { SfxChatPanel } from "../sfx-chat-panel";
import { Search, Loader2 } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { debounce } from "lodash";

interface SoundEffect {
  id: string;
  type: string;
  src: string;
  thumbnailUrl: string;
  duration: number;
  tags: string[];
  title: string | null;
  description: string;
  name: string;
}

export default function PanelSFX() {
  const { studio } = useStudioStore();
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SoundEffect[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSFX = async (query: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/audio/sfx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 20,
          page: 1,
          query: query ? { keys: [query] } : {},
        }),
      });
      const data = await response.json();
      if (data.soundEffects) {
        setSearchResults(data.soundEffects);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Failed to fetch SFX:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedFetch = useCallback(
    debounce((query: string) => fetchSFX(query), 500),
    [],
  );

  useEffect(() => {
    fetchSFX("");
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedFetch(query);
  };

  const handleAddAudio = async (url: string, name: string) => {
    if (!studio) return;

    try {
      const audioClip = await Audio.fromUrl(url);
      audioClip.name = name;
      await studio.addClip(audioClip);
    } catch (error) {
      Log.error("Failed to add audio:", error);
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
              placeholder="Search sound effects..."
              className="bg-secondary/30 border-0 h-full text-xs box-border pl-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </InputGroup>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4">
        {isLoading && searchResults.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted-foreground" size={32} />
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2">
            <IconWaveSine size={32} className="opacity-50" />
            <span className="text-sm">No sound effects found</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {searchResults.map((item) => (
              <AudioItem
                key={item.id}
                item={{
                  id: item.id,
                  url: item.src,
                  text: item.name,
                }}
                onAdd={handleAddAudio}
                playingId={playingId}
                setPlayingId={setPlayingId}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
