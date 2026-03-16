"use client";
import React, { useEffect, useRef } from "react";
import { CircleOff, XIcon } from "lucide-react";
import useLayoutStore from "../store/use-layout-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ICaptionsControlProps } from "../interface/captions";
import { STYLE_CAPTION_PRESETS, NONE_PRESET } from "../constant/caption";

import { useStudioStore } from "@/stores/studio-store";
import { fontManager } from "openvideo";
import { regenerateCaptionClips } from "@/lib/caption-utils";

const CaptionPresetPicker = () => {
  const { setFloatingControl } = useLayoutStore();
  const { studio, selectedClips } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFloatingControl("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setFloatingControl]);

  const handleApplyPreset = async (preset: ICaptionsControlProps) => {
    if (!studio) return;

    // Filter for Captions
    const captionClips = selectedClips.filter((c) => c.type === "Caption");
    if (captionClips.length === 0) return;
    if (preset.fontFamily === undefined) {
      preset.fontFamily = "Bangers-Regular";
    }
    if (preset.fontUrl === undefined) {
      preset.fontUrl = "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf";
    }
    if (preset.boxShadow === undefined) {
      preset.boxShadow = { color: "transparent", x: 0, y: 0, blur: 0 };
    }
    if (preset.textTransform === undefined) {
      preset.textTransform = "none";
    }
    if (preset.textAlign === undefined) {
      preset.textAlign = "center";
    }
    if (preset.isKeywordColor === undefined) {
      preset.isKeywordColor = "transparent";
    }

    if (preset.preservedColorKeyWord === undefined) {
      preset.preservedColorKeyWord = false;
    }

    // Load fonts if needed
    if (preset.fontFamily && preset.fontUrl) {
      await fontManager.addFont({
        name: preset.fontFamily,
        url: preset.fontUrl,
      });
    }
    const x = preset.boxShadow?.x ?? 4;
    const y = preset.boxShadow?.y ?? 0;

    // Map ICaptionsControlProps to ICaptionOpts
    const styleUpdate: any = {
      fill: preset.color,
      strokeWidth: preset.borderWidth,
      stroke: preset.borderColor,
      fontFamily: preset.fontFamily,
      fontUrl: preset.fontUrl,
      align: preset.textAlign as any,
      caption: {
        colors: {
          appeared: preset.appearedColor,
          active: preset.activeColor,
          activeFill: preset.activeFillColor,
          background: preset.backgroundColor,
          keyword: preset.isKeywordColor ?? "transparent",
        },
        preserveKeywordColor: preset.preservedColorKeyWord ?? false,
      },
      animation: preset.animation || "undefined",
      textCase: preset.textTransform || "normal",
      dropShadow: {
        color: preset.boxShadow?.color ?? "transparent",
        alpha: 0.5,
        blur: preset.boxShadow?.blur ?? 4,
        distance: Math.sqrt(x * x + y * y) ?? 4,
        angle: Math.PI / 4,
      },
      wordAnimation: preset.wordAnimation,
      textBoxStyle: preset.textBoxStyle,
    };

    // Apply to all selected caption clips and other clips with the same mediaId
    const mediaIds = new Set<string>();
    for (const clip of captionClips) {
      if ((clip as any).mediaId) {
        mediaIds.add((clip as any).mediaId);
      }
    }

    const allCaptionClips = studio.clips.filter((c) => c.type === "Caption");
    // const targetClips = allCaptionClips.filter(
    //   (c) => captionClips.includes(c) || mediaIds.has((c as any).mediaId),
    // );

    if (preset.type === "word") {
      for (const clip of allCaptionClips) {
        await regenerateCaptionClips({
          studio,
          captionClip: clip,
          mode: "single",
          fontSize: (clip as any).originalOpts?.fontSize,
          fontFamily: preset.fontFamily,
          fontUrl: preset.fontUrl,
          styleUpdate: styleUpdate,
        });
      }
    } else {
      for (const clip of allCaptionClips) {
        await regenerateCaptionClips({
          studio,
          captionClip: clip,
          mode: "multiple",
          fontSize: (clip as any).originalOpts?.fontSize,
          fontFamily: preset.fontFamily,
          fontUrl: preset.fontUrl,
          styleUpdate: styleUpdate,
        });
      }
    }
  };

  const PresetGrid = ({ presets }: { presets: ICaptionsControlProps[] }) => (
    <div className="grid gap-2 p-4">
      <div
        className="flex h-[70px] cursor-pointer items-center justify-center bg-zinc-800"
        onClick={() => {
          handleApplyPreset(NONE_PRESET);
        }}
      >
        <CircleOff />
      </div>

      {presets.map((preset, index) => (
        <div
          key={index}
          className="text-md flex h-[70px] cursor-pointer items-center justify-center bg-zinc-800 overflow-hidden"
          onClick={() => handleApplyPreset(preset)}
        >
          <video
            src={preset.previewUrl}
            autoPlay
            loop
            muted
            playsInline
            className="h-40 place-content-center rounded-lg"
          />
        </div>
      ))}
    </div>
  );
  return (
    <div
      ref={containerRef}
      className="absolute left-full top-0 z-200 ml-2 w-72 border bg-background p-0"
    >
      <div className="handle flex  items-center justify-between px-4 py-3 pb-0">
        <p className="text-sm font-bold">Presets</p>
        <div className="h-4 w-4" onClick={() => setFloatingControl("")}>
          <XIcon className="h-3 w-3 cursor-pointer font-extrabold text-muted-foreground" />
        </div>
      </div>
      <ScrollArea className="h-[500px] w-full">
        <PresetGrid presets={STYLE_CAPTION_PRESETS} />
      </ScrollArea>
    </div>
  );
};

export default CaptionPresetPicker;
