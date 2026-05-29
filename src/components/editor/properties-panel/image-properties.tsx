import {
  ColorPicker,
  ColorPickerEyeDropper,
  ColorPickerFormat,
  ColorPickerHue,
  ColorPickerOutput,
  ColorPickerSelection,
} from "@/components/ui/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IClip } from "@openvideo/engine-pixi";
import {
  IconLineHeight,
  IconMinus,
  IconBlur,
  IconRotate,
  IconRuler2,
  IconCircle,
  IconMovie,
  IconPlus,
  IconTrash,
  IconSquare,
  IconEdit,
  IconFlipHorizontal,
  IconFlipVertical,
} from "@tabler/icons-react";
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
import { useStore } from "zustand";
import { useEphemeralClip } from "@/hooks/use-ephemeral-clip";
import { projectStore, core } from "@/lib/project";

interface ImagePropertiesProps {
  clip: IClip;
}

export function ImageProperties({ clip }: ImagePropertiesProps) {
  const coreClipBase = useStore(projectStore, (s) => s.clips[clip.id]);
  const coreClip = useEphemeralClip(clip.id, coreClipBase) as any;

  if (!coreClip) return null;

  const style = coreClip.style || {};

  const handleUpdate = (updates: any) => {
    core.clip.update(clip.id, updates);
  };

  const handleStyleUpdate = (styleUpdates: any) => {
    handleUpdate({
      style: {
        ...style,
        ...styleUpdates,
      },
    });
  };

  const handleStrokeUpdate = (strokeUpdates: any) => {
    handleUpdate({
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

    handleUpdate({
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
    handleUpdate({
      chromaKey: {
        ...coreClip.chromaKey,
        ...chromaUpdates,
      },
    });
  };

  const { setFloatingControl } = useLayoutStore();

  const handleAnimationRemove = (id: string) => {
    handleUpdate({
      animations: (coreClip.animations || []).filter((a: any) => a.id !== id),
    });
  };

  const animations = coreClip.animations || [];

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
              value={Math.round(coreClip.left || 0)}
              onChange={(val) => handleUpdate({ left: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">Y</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(coreClip.top || 0)}
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
              value={Math.round(coreClip.width || 0)}
              onChange={(val) => handleUpdate({ width: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">H</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(coreClip.height || 0)}
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
        <div className="flex items-center gap-4 mt-1">
          <IconRotate className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round(coreClip.angle ?? 0)]}
            onValueChange={(v) => handleUpdate({ angle: v[0] })}
            max={360}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round(coreClip.angle ?? 0)}
              onChange={(val) => handleUpdate({ angle: val })}
              className="p-0 text-center"
            />
            <InputGroupAddon align="inline-end" className="p-0 pr-2">
              <span className="text-[10px] text-muted-foreground">°</span>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Flip Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Flip
        </label>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() =>
              handleUpdate({
                flip: {
                  ...(coreClip.flip || { x: false, y: false }),
                  x: !coreClip.flip?.x,
                },
              })
            }
            className={`flex items-center justify-center flex-1 py-1.5 rounded-md border transition-colors ${
              coreClip.flip?.x
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            <IconFlipHorizontal className="size-4 mr-2" />
            <span className="text-xs">Flip X</span>
          </button>
          <button
            onClick={() =>
              handleUpdate({
                flip: {
                  ...(coreClip.flip || { x: false, y: false }),
                  y: !coreClip.flip?.y,
                },
              })
            }
            className={`flex items-center justify-center flex-1 py-1.5 rounded-md border transition-colors ${
              coreClip.flip?.y
                ? "bg-primary/20 border-primary text-primary"
                : "bg-secondary/30 border-transparent text-muted-foreground hover:text-white"
            }`}
          >
            <IconFlipVertical className="size-4 mr-2" />
            <span className="text-xs">Flip Y</span>
          </button>
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
            onValueChange={(v) => handleUpdate({ opacity: v[0] / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round((coreClip.opacity ?? 1) * 100)}
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
                clipId: coreClip.id,
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
                    onClick={() => {
                      setFloatingControl("animation-properties-picker", {
                        clipId: coreClip.id,
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
            checked={coreClip.chromaKey?.enabled ?? false}
            onCheckedChange={(checked) => handleChromaKeyUpdate({ enabled: checked })}
          />
        </div>

        {(coreClip.chromaKey?.enabled ?? false) && (
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
                            backgroundColor: coreClip.chromaKey?.color || "#00FF00",
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
                  value={coreClip.chromaKey?.color?.toUpperCase() || "#00FF00"}
                  onChange={(e) => handleChromaKeyUpdate({ color: e.target.value })}
                  className="text-sm p-0 text-[10px] font-mono"
                />
              </InputGroup>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Similarity</span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((coreClip.chromaKey?.similarity ?? 0.1) * 100)}%
                </span>
              </div>
              <Slider
                value={[(coreClip.chromaKey?.similarity ?? 0.1) * 100]}
                onValueChange={(v) => handleChromaKeyUpdate({ similarity: v[0] / 100 })}
                max={100}
                step={1}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">Spill</span>
                <span className="text-[10px] text-muted-foreground">
                  {Math.round((coreClip.chromaKey?.spill ?? 0.05) * 100)}%
                </span>
              </div>
              <Slider
                value={[(coreClip.chromaKey?.spill ?? 0.05) * 100]}
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
