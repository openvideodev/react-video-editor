"use client";

import { IconMicrophone } from "@tabler/icons-react";
import { useGeneratedStore } from "@/stores/generated-store";
import { useStudioStore } from "@/stores/studio-store";
import { Audio, Log } from "openvideo";
import { AudioItem } from "./audio-item";
import { useState } from "react";
import { VoiceoverChatPanel } from "../voiceover-chat-panel";

export default function PanelVoiceovers() {
  const { studio } = useStudioStore();
  const { voiceovers } = useGeneratedStore();
  const [playingId, setPlayingId] = useState<string | null>(null);

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
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 overflow-y-auto">
        {voiceovers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 gap-4">
            <IconMicrophone className="size-7 text-muted-foreground" stroke={1.5} />
            <div className="flex flex-col gap-2 text-center">
              <p className=" font-semibold text-white">No Voiceover Assets</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Start building your collection by clicking the generate button in the chat panel.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4">
            <div className="grid grid-cols-2 gap-2">
              {voiceovers.map((item) => (
                <AudioItem
                  key={item.id}
                  item={item}
                  onAdd={handleAddAudio}
                  playingId={playingId}
                  setPlayingId={setPlayingId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="h-2 bg-background"></div>
      <div className="h-48">
        <VoiceoverChatPanel />
      </div>
    </div>
  );
}
