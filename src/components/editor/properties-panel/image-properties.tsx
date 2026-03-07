import * as React from "react";
import { useEffect, useState } from "react";
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IClip, AnimationOptions, KeyframeData } from "openvideo";
import {
  IconAlignLeft,
  IconAlignCenter,
  IconAlignRight,
  IconTextSize,
  IconLineHeight,
  IconMinus,
  IconBlur,
  IconRotate,
  IconRuler2,
  IconOverline,
  IconUnderline,
  IconStrikethrough,
  IconCircle,
  IconMovie,
  IconPlus,
  IconTrash,
  IconSquare,
  IconEdit,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import color from "color";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import useLayoutStore from "../store/use-layout-store";

interface ImagePropertiesProps {
  clip: IClip;
}

export function ImageProperties({ clip }: ImagePropertiesProps) {
  const imageClip = clip as any;
  const style = imageClip.style || {};
  const [, setTick] = useState(0);

  // Listen to clip events for canvas sync
  useEffect(() => {
    if (!imageClip) return;

    const onPropsChange = () => {
      setTick((t) => t + 1);
    };

    imageClip.on?.("propsChange", onPropsChange);
    imageClip.on?.("moving", onPropsChange);
    imageClip.on?.("scaling", onPropsChange);
    imageClip.on?.("rotating", onPropsChange);

    return () => {
      imageClip.off?.("propsChange", onPropsChange);
      imageClip.off?.("moving", onPropsChange);
      imageClip.off?.("scaling", onPropsChange);
      imageClip.off?.("rotating", onPropsChange);
    };
  }, [imageClip]);

  const handleUpdate = (updates: any) => {
    imageClip.update(updates);
  };

  const handleStyleUpdate = (styleUpdates: any) => {
    imageClip.update({
      style: {
        ...style,
        ...styleUpdates,
      },
    });
  };

  const handleStrokeUpdate = (strokeUpdates: any) => {
    imageClip.update({
      style: {
        ...style,
        stroke: {
          ...(style.stroke || { color: "#ffffff", width: 0 }),
          ...strokeUpdates,
        },
      },
    });
  };

  const handleShadowUpdate = (shadowUpdates: any) => {
    const currentShadow = style.dropShadow || {
      color: "#000000",
      alpha: 1,
      blur: 0,
      distance: 0,
      angle: 0,
    };

    const finalUpdates: any = { ...shadowUpdates };

    if (shadowUpdates.angle !== undefined) {
      finalUpdates.angle = (parseFloat(shadowUpdates.angle) * Math.PI) / 180;
    }

    if (shadowUpdates.distance !== undefined) {
      finalUpdates.distance = parseFloat(shadowUpdates.distance) || 0;
    }

    imageClip.update({
      style: {
        ...style,
        dropShadow: {
          ...currentShadow,
          ...finalUpdates,
        },
      },
    });
  };

  const handleChromaKeyUpdate = (chromaUpdates: any) => {
    imageClip.update({
      chromaKey: {
        ...imageClip.chromaKey,
        ...chromaUpdates,
      },
    });
  };

  const { setFloatingControl } = useLayoutStore();

  const handleAnimationRemove = (id: string) => {
    imageClip.removeAnimation(id);
    setTick((t) => t + 1);
  };

  const animations = imageClip.animations || [];

  return (
    <div className="flex flex-col gap-5">
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
            <NumberInput
              value={Math.round(imageClip.left || 0)}
              onChange={(val) => handleUpdate({ left: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">Y</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(imageClip.top || 0)}
              onChange={(val) => handleUpdate({ top: val })}
              className="p-0"
            />
          </InputGroup>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">W</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(imageClip.width || 0)}
              onChange={(val) => handleUpdate({ width: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">H</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(imageClip.height || 0)}
              onChange={(val) => handleUpdate({ height: val })}
              className="p-0"
            />
          </InputGroup>
        </div>
      </div>

      {/* Rotation Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Rotation
        </label>
        <div className="flex items-center gap-4">
          <IconRotate className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round(imageClip.angle ?? 0)]}
            onValueChange={(v) => handleUpdate({ angle: v[0] })}
            max={360}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round(imageClip.angle ?? 0)}
              onChange={(val) => handleUpdate({ angle: val })}
              className="p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">°</span>
            </InputGroupAddon>
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
            value={[Math.round((imageClip.opacity ?? 1) * 100)]}
            onValueChange={(v) => handleUpdate({ opacity: v[0] / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round((imageClip.opacity ?? 1) * 100)}
              onChange={(val) => handleUpdate({ opacity: val / 100 })}
              className="p-0 text-center"
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
            onClick={() => {
              setFloatingControl("animation-properties-picker", {
                clipId: imageClip.id,
                mode: "add",
              });
            }}
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
                key={anim.id}
                className="flex items-center justify-between p-2 bg-secondary/30 rounded-md group"
              >
                <div className="flex flex-col flex-1">
                  <span className="text-xs font-medium capitalize">{anim.type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {Math.round(anim.options.duration / 1e6)}s duration
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setFloatingControl("animation-properties-picker", {
                        clipId: imageClip.id,
                        animationId: anim.id,
                        mode: "edit",
                      });
                    }}
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

      {/* Chroma Key Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Chroma Key
          </label>
          <Switch
            checked={imageClip.chromaKey?.enabled ?? false}
            onCheckedChange={(checked) => handleChromaKeyUpdate({ enabled: checked })}
          />
        </div>

        {(imageClip.chromaKey?.enabled ?? false) && (
          <div className="flex flex-col gap-3 pt-1">
            <div className="flex gap-2">
              <InputGroup className="flex-1">
                <InputGroupAddon align="inline-start" className="relative p-0">
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
                        <div
                          className="h-4 w-4 rounded-full border border-white/10 shadow-sm"
                          style={{
                            backgroundColor: imageClip.chromaKey?.color || "#00FF00",
                          }}
                        />
                      </InputGroupButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3" align="start">
                      <ColorPicker
                        onChange={(colorValue) => {
                          const hexColor = color.rgb(colorValue).hex();
                          handleChromaKeyUpdate({ color: hexColor });
                        }}
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
                    </PopoverContent>
                  </Popover>
                </InputGroupAddon>
                <InputGroupInput
                  value={imageClip.chromaKey?.color?.toUpperCase() || "#00FF00"}
                  onChange={(e) => handleChromaKeyUpdate({ color: e.target.value })}
                  className="text-sm p-0 text-[10px] font-mono"
                />
              </InputGroup>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Similarity</span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((imageClip.chromaKey?.similarity ?? 0.1) * 100)}%
                </span>
              </div>
              <Slider
                value={[(imageClip.chromaKey?.similarity ?? 0.1) * 100]}
                onValueChange={(v) => handleChromaKeyUpdate({ similarity: v[0] / 100 })}
                max={100}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Spill</span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((imageClip.chromaKey?.spill ?? 0.05) * 100)}%
                </span>
              </div>
              <Slider
                value={[(imageClip.chromaKey?.spill ?? 0.05) * 100]}
                onValueChange={(v) => handleChromaKeyUpdate({ spill: v[0] / 100 })}
                max={100}
                step={1}
              />
            </div>
          </div>
        )}
      </div>

      {/* Radius Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Corner Radius
        </label>
        <div className="flex items-center gap-4">
          <IconSquare className="size-4 text-muted-foreground" />
          <Slider
            value={[style.borderRadius || 0]}
            onValueChange={(v) => handleStyleUpdate({ borderRadius: v[0] })}
            max={500}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={style.borderRadius || 0}
              onChange={(val) => handleStyleUpdate({ borderRadius: val })}
              className="p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">px</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Stroke Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Stroke
          </label>
          <button className="text-muted-foreground hover:text-white transition-colors">
            <IconMinus className="size-3" />
          </button>
        </div>

        <div className="flex gap-2">
          <InputGroup className="flex-2">
            <InputGroupAddon align="inline-start" className="relative p-0">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
                    <div
                      className="h-4 w-4 rounded-full border border-white/10 shadow-sm"
                      style={{
                        backgroundColor: (style.stroke?.color as string) || "#000000",
                      }}
                    />
                  </InputGroupButton>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <ColorPicker
                    onChange={(colorValue) => {
                      const hexColor = color.rgb(colorValue).hex();
                      handleStrokeUpdate({ color: hexColor });
                    }}
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
                </PopoverContent>
              </Popover>
            </InputGroupAddon>
            <InputGroupInput
              value={style.stroke?.color?.toUpperCase() || "#000000"}
              onChange={(e) => handleStrokeUpdate({ color: e.target.value })}
              className="text-sm p-0 text-[10px] font-mono"
            />
            <InputGroupAddon align="inline-end" className="border-l border-white/5 pl-2">
              <span className="text-[10px]">100%</span>
            </InputGroupAddon>
          </InputGroup>

          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start">
              <IconLineHeight className="size-3.5" />
            </InputGroupAddon>
            <NumberInput
              value={style.stroke?.width || 0}
              onChange={(val) => handleStrokeUpdate({ width: val })}
              className="p-0"
            />
          </InputGroup>
        </div>
      </div>

      {/* Shadow Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Shadow
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IconRuler2 className="size-3.5" />
            </InputGroupAddon>
            <NumberInput
              value={style.dropShadow?.distance || 0}
              onChange={(val) => handleShadowUpdate({ distance: val })}
              className="p-0"
            />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IconRotate className="size-3.5" />
            </InputGroupAddon>
            <NumberInput
              value={Math.round(((style.dropShadow?.angle || 0) * 180) / Math.PI)}
              onChange={(val) => handleShadowUpdate({ angle: val })}
              className="p-0"
            />
          </InputGroup>
        </div>

        <div className="flex gap-2">
          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start">
              <IconBlur className="size-3.5" />
            </InputGroupAddon>
            <NumberInput
              value={style.dropShadow?.blur || 0}
              onChange={(val) => handleShadowUpdate({ blur: val })}
              className="p-0"
            />
          </InputGroup>

          <InputGroup className="flex-1">
            <InputGroupAddon align="inline-start" className="relative p-0">
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <InputGroupButton variant="ghost" size="icon-xs" className="h-full w-8">
                    <div
                      className="h-4 w-4 border border-white/10 shadow-sm"
                      style={{
                        backgroundColor: style.dropShadow?.color || "#000000",
                      }}
                    />
                  </InputGroupButton>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" align="start">
                  <ColorPicker
                    onChange={(colorValue) => {
                      const hexColor = color.rgb(colorValue).hex();
                      handleShadowUpdate({ color: hexColor });
                    }}
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
                </PopoverContent>
              </Popover>
            </InputGroupAddon>
            <InputGroupInput
              value={style.dropShadow?.color?.toUpperCase() || "#000000"}
              onChange={(e) => handleShadowUpdate({ color: e.target.value })}
              className="text-sm p-0 text-[10px] font-mono"
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
