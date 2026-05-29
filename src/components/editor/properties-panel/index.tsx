import { useEffect, useState } from "react";
import { TextProperties } from "./text-properties";
import { ImageProperties } from "./image-properties";
import { VideoProperties } from "./video-properties";
import { AudioProperties } from "./audio-properties";
import { CaptionProperties } from "./caption-properties";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IClip } from "@openvideo/engine-pixi";
import { EffectProperties } from "./effect-properties";
import { TransitionProperties } from "./transition-properties";
import { cn } from "@/lib/utils";

export function PropertiesPanel({ selectedClips }: { selectedClips: IClip[] }) {
  if (selectedClips.length > 1) {
    return (
      <div className="bg-card h-full p-4 flex flex-col items-center justify-center gap-3">
        <div className="text-lg font-medium">Group</div>
      </div>
    );
  }

  if (selectedClips.length === 0) return null;

  const clip = selectedClips[0];

  const renderSpecificProperties = () => {
    switch (clip.type) {
      case "Text":
        return <TextProperties clip={clip} />;
      case "Caption":
        return <CaptionProperties clip={clip} />;
      case "Image":
        return <ImageProperties clip={clip} />;
      case "Video":
        return <VideoProperties clip={clip} />;
      case "Audio":
        return <AudioProperties clip={clip} />;
      case "Effect":
        return <EffectProperties clip={clip} />;
      case "Transition":
        return <TransitionProperties clip={clip} />;
      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div
        className={cn(
          "flex flex-col gap-4 p-4 transition-opacity",
          clip.locked && "opacity-50 pointer-events-none select-none",
        )}
      >
        {renderSpecificProperties()}
      </div>
    </ScrollArea>
  );
}
