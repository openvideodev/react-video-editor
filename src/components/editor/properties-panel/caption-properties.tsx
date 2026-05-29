import * as React from "react";
import {
  ColorPicker,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerFormat,
  ColorPickerSelection,
  ColorPickerEyeDropper,
} from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IClip } from "@openvideo/engine-pixi";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { regenerateCaptionClips, WordsPerLineMode } from "@/lib/caption-utils";
import {
  IconTextSize,
  IconRotate,
  IconPlus,
  IconTrash,
  IconCircle,
  IconMovie,
  IconEdit,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import color from "color";

import { getGroupedFonts, getFontByPostScriptName } from "@/utils/font-utils";

import useLayoutStore from "../store/use-layout-store";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { NumberInput } from "@/components/ui/number-input";
import { useStore } from "zustand";
import { useEphemeralClip } from "@/hooks/use-ephemeral-clip";
import { projectStore, core } from "@/lib/project";
import { useCaptionUpdate } from "@/hooks/use-caption-update";
import { nanoid } from "nanoid";

const GROUPED_FONTS = getGroupedFonts();

interface CaptionPropertiesProps {
  clip: IClip;
}

export function CaptionProperties({ clip }: CaptionPropertiesProps) {
  const coreClipBase = useStore(projectStore, (s) => s.clips[clip.id]) as any;
  const coreClip = useEphemeralClip(clip.id, coreClipBase);

  const { updateOne, setStyle, setColors, setVerticalPosition, setFont } = useCaptionUpdate(
    clip.id,
  );

  const { setFloatingControl } = useLayoutStore();

  if (!coreClip) return null;

  const opts = coreClip.style || {};
  const captionColors = (coreClip as any)?.caption?.colors ?? {
    appeared: "#ffffff",
    active: "#ffffff",
    activeFill: "#FF5700",
    background: "",
    keyword: "#ffffff",
  };

  // ─── Animation helpers ──────────────────────────────────────────────────────

  const animations = coreClip.animations || [];

  const handleAnimationRemove = (id: string) => {
    const anim = animations.find((a: any) => a.id === id);
    const typeToRemove = anim?.type;

    if (typeToRemove) {
      // Remove by type across all caption clips
      const clips = projectStore.getState().clips;
      const allCaptionIds = Object.keys(clips).filter((cId) => clips[cId].type === "Caption");
      const commands = allCaptionIds
        .map((cId) => {
          const c = clips[cId];
          if (!c?.animations) return null;
          return {
            id: nanoid(),
            type: "clip.update" as const,
            payload: {
              id: cId,
              updates: {
                animations: c.animations.filter((a: any) => a.type !== typeToRemove),
              },
            },
          };
        })
        .filter(Boolean) as any[];
      core.batch(commands);
    } else {
      updateOne({
        animations: animations.filter((a: any) => a.id !== id),
      });
    }
  };

  // ─── Font helpers ───────────────────────────────────────────────────────────

  const currentFont = getFontByPostScriptName(opts.fontFamily) || GROUPED_FONTS[0].mainFont;
  const currentFamily =
    GROUPED_FONTS.find((f) => f.family === currentFont.family) || GROUPED_FONTS[0];

  return (
    <div className="flex flex-col gap-5">
      {/* Content */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Content
        </label>
        <Textarea
          value={coreClip.text || ""}
          onChange={(e) => updateOne({ text: e.target.value })}
          className="resize-none text-sm"
          placeholder="Enter caption text..."
        />
      </div>

      {/* Transform Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Transform
        </label>
        <div className="grid grid-cols-2 gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">X</span>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              value={Math.round(coreClip.left || 0)}
              onChange={(e) => updateOne({ left: parseInt(e.target.value) || 0 })}
              className="text-sm p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">Y</span>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              value={Math.round(coreClip.top || 0)}
              onChange={(e) => updateOne({ top: parseInt(e.target.value) || 0 })}
              className="text-sm p-0"
            />
          </InputGroup>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">W</span>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              value={Math.round(coreClip.width || 0)}
              onChange={(e) => updateOne({ width: parseInt(e.target.value) || 0 })}
              className="text-sm p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">H</span>
            </InputGroupAddon>
            <InputGroupInput
              type="number"
              value={Math.round(coreClip.height || 0)}
              onChange={(e) => updateOne({ height: parseInt(e.target.value) || 0 })}
              className="text-sm p-0"
            />
          </InputGroup>
        </div>
      </div>

      {/* Position Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Position
        </label>
        <Select
          value={opts.verticalAlign || "bottom"}
          onValueChange={(v) => setVerticalPosition(v as "top" | "center" | "bottom")}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Vertical Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Top</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="bottom">Bottom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Words per line Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Words per line
        </label>
        <Select
          value={coreClip.wordsPerLine || "multiple"}
          onValueChange={(v) =>
            regenerateCaptionClips({
              captionClip: coreClip,
              mode: v as WordsPerLineMode,
              fontSize: opts.fontSize,
              fontFamily: opts.fontFamily,
              fontUrl: opts.fontUrl,
            })
          }
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder="Words per line" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single</SelectItem>
            <SelectItem value="multiple">Multiple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Rotation Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Rotation
        </label>
        <div className="flex items-center gap-4">
          <IconRotate className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round(coreClip.angle ?? 0)]}
            onValueChange={(v) => updateOne({ angle: v[0] })}
            max={360}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={Math.round(coreClip.angle ?? 0)}
              onChange={(e) => updateOne({ angle: parseInt(e.target.value) || 0 })}
              className="text-sm p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">°</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Font Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Font
        </label>

        <Select
          value={currentFamily.family}
          onValueChange={(v) => {
            const family = GROUPED_FONTS.find((f) => f.family === v);
            if (family) setFont(family.mainFont.postScriptName);
          }}
        >
          <SelectTrigger className="w-full h-12">
            <SelectValue placeholder="Select font">
              <div className="flex items-center h-full">{currentFamily.family}</div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {GROUPED_FONTS.map((family) => (
              <SelectItem key={family.family} value={family.family}>
                <div className="flex items-center py-1">
                  <img
                    src={family.mainFont.preview}
                    alt={family.family}
                    className="h-6 invert object-contain"
                  />
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="grid grid-cols-2 gap-2">
          <Select value={currentFont.postScriptName} onValueChange={(v) => setFont(v)}>
            <SelectTrigger className="bg-input border h-9 w-full overflow-hidden">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              {currentFamily.styles.map((style) => (
                <SelectItem key={style.id} value={style.postScriptName}>
                  {style.fullName.replace(currentFamily.family, "").trim() || "Regular"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <InputGroup>
            <NumberInput
              value={opts.fontSize || 40}
              onChange={(v) => setStyle({ fontSize: v || 0 })}
              className="text-sm"
            />
            <InputGroupAddon align="inline-end">
              <IconTextSize className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Style Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex bg-secondary/30 rounded-md p-1 gap-1">
            {[
              { label: "aA", value: "none" },
              { label: "AA", value: "uppercase" },
              { label: "aa", value: "lowercase" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setStyle({ textCase: item.value as any })}
                className={cn(
                  "flex-1 text-[10px] font-medium flex items-center justify-center rounded-sm py-1 transition-colors",
                  (coreClip.style?.textCase || "none") === item.value
                    ? "bg-white/10 text-white"
                    : "text-muted-foreground hover:bg-white/5",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start" className="relative p-0">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
                    <div
                      className="h-4 w-4 border border-white/10 shadow-sm"
                      style={{ backgroundColor: (opts.color as string) || "#ffffff" }}
                    />
                  </InputGroupButton>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <ColorPickerPanel onChange={(hex) => setStyle({ color: hex })} />
                </PopoverContent>
              </Popover>
            </InputGroupAddon>
            <InputGroupInput
              value={(opts.color as string)?.toUpperCase() || "#FFFFFF"}
              onChange={(e) => setStyle({ color: e.target.value })}
              className="text-sm p-0 text-[10px] font-mono"
            />
          </InputGroup>
        </div>
      </div>

      {/* Opacity Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Opacity
        </label>
        <div className="flex items-center gap-4">
          <IconCircle className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round((coreClip.opacity ?? 1) * 100)]}
            onValueChange={(v) => updateOne({ opacity: v[0] / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <InputGroupInput
              type="number"
              value={Math.round((coreClip.opacity ?? 1) * 100)}
              onChange={(e) => updateOne({ opacity: (parseInt(e.target.value) || 0) / 100 })}
              className="text-sm p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">%</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Animations Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Animations
          </label>
          <button
            onClick={() =>
              setFloatingControl("animation-properties-picker", {
                clipId: coreClip.id,
                mode: "add",
              })
            }
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <IconPlus className="size-3.5" />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {animations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-4 border border-dashed rounded-md bg-white/5 opacity-50">
              <IconMovie className="size-6 mb-1" />
              <span className="text-[10px]">No animations applied</span>
            </div>
          ) : (
            animations.map((anim: any) => (
              <div
                key={anim.options?.id ?? anim.id}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded-md group"
              >
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-medium capitalize">{anim.type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round((anim.options?.duration ?? 0) / 1e6)}s duration
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      setFloatingControl("animation-properties-picker", {
                        clipId: coreClip.id,
                        animationId: anim.id,
                        mode: "edit",
                      })
                    }
                    className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-white transition-all"
                  >
                    <IconEdit className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleAnimationRemove(anim.id)}
                    className="p-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition-all"
                  >
                    <IconTrash className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Caption presets */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Presets
        </label>
        <div className="relative w-full">
          <Button
            className="flex w-full items-center justify-between text-sm border bg-input/30 h-9"
            variant="secondary"
            onClick={() => setFloatingControl("caption-preset-picker")}
          >
            <div className="w-full text-left">
              <p className="truncate">None</p>
            </div>
            <ChevronDown className="text-muted-foreground" size={14} />
          </Button>
        </div>
      </div>

      {/* Caption Colors Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Caption Colors
        </label>

        {(
          [
            { key: "appeared", label: "Appeared", fallback: "#ffffff" },
            { key: "active", label: "Active", fallback: "#ffffff" },
            { key: "activeFill", label: "Active Fill", fallback: "#FF5700" },
            { key: "background", label: "Background", fallback: "" },
            { key: "keyword", label: "Keyword", fallback: "#ffffff" },
          ] as const
        ).map(({ key, label, fallback }) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-[9px] text-muted-foreground">{label}</span>
            <InputGroup>
              <InputGroupAddon align="inline-start" className="relative p-0">
                <Popover modal={true}>
                  <PopoverTrigger asChild>
                    <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
                      <div
                        className="h-4 w-4 border border-white/10 shadow-sm"
                        style={{
                          backgroundColor: captionColors[key] || fallback || "transparent",
                        }}
                      />
                    </InputGroupButton>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <ColorPickerPanel onChange={(hex) => setColors({ [key]: hex })} />
                  </PopoverContent>
                </Popover>
              </InputGroupAddon>
              <InputGroupInput
                value={captionColors[key]?.toUpperCase() || fallback.toUpperCase()}
                onChange={(e) => setColors({ [key]: e.target.value })}
                className="text-sm p-0 text-[10px] font-mono"
                placeholder={fallback ? undefined : "Transparent"}
              />
            </InputGroup>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared Color Picker UI ───────────────────────────────────────────────────

function ColorPickerPanel({ onChange }: { onChange: (hex: string) => void }) {
  return (
    <ColorPicker
      onChange={(colorValue) => onChange(color.rgb(colorValue).hex())}
      className="w-72 h-72 rounded-md border bg-background p-4 shadow-sm"
    >
      <ColorPickerSelection />
      <div className="flex items-center gap-4">
        <ColorPickerEyeDropper />
        <div className="grid w-full gap-1">
          <ColorPickerHue />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ColorPickerOutput />
        <ColorPickerFormat />
      </div>
    </ColorPicker>
  );
}
