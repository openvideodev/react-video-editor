import * as React from "react";
import { useEffect, useState, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { fontManager } from "openvideo";
import { getGroupedFonts, getFontByPostScriptName } from "@/utils/font-utils";
import { NumberInput } from "@/components/ui/number-input";
import useLayoutStore from "../store/use-layout-store";

const GROUPED_FONTS = getGroupedFonts();

const FontPicker = React.memo(
  ({
    currentFamily,
    handleFontChange,
  }: {
    currentFamily: any;
    handleFontChange: (postScriptName: string) => void;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    const fontItems = useMemo(() => {
      if (!isOpen) return null;
      return GROUPED_FONTS.map((family) => (
        <SelectItem key={family.family} value={family.family}>
          <div className="flex items-center py-1">
            <img
              src={family.mainFont.preview}
              alt={family.family}
              className="h-6 invert object-contain"
              loading="lazy"
            />
          </div>
        </SelectItem>
      ));
    }, [isOpen]);

    return (
      <Select
        value={currentFamily.family}
        onValueChange={(v) => {
          const family = GROUPED_FONTS.find((f) => f.family === v);
          if (family) {
            handleFontChange(family.mainFont.postScriptName);
          }
        }}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className="w-full h-12">
          <SelectValue placeholder="Select font">
            <div className="flex items-center h-full">{currentFamily.family}</div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">{fontItems}</SelectContent>
      </Select>
    );
  },
);

interface TextPropertiesProps {
  clip: IClip;
}

export function TextProperties({ clip }: TextPropertiesProps) {
  const textClip = clip as any;
  const style = textClip.style || {};
  const [, setTick] = useState(0);

  // Listen to clip events for canvas sync
  useEffect(() => {
    if (!textClip) return;

    const onPropsChange = () => {
      setTick((t) => t + 1);
    };

    // Listen to propsChange to ensure updates from drag/drop on canvas
    textClip.on?.("propsChange", onPropsChange);
    // Also listen to common fabric events just in case
    textClip.on?.("moving", onPropsChange);
    textClip.on?.("scaling", onPropsChange);
    textClip.on?.("rotating", onPropsChange);

    return () => {
      textClip.off?.("propsChange", onPropsChange);
      textClip.off?.("moving", onPropsChange);
      textClip.off?.("scaling", onPropsChange);
      textClip.off?.("rotating", onPropsChange);
    };
  }, [textClip]);

  const handleUpdate = (updates: any) => {
    textClip.update(updates);
  };

  const handleStyleUpdate = (styleUpdates: any) => {
    textClip.update({
      style: {
        ...style,
        ...styleUpdates,
      },
    });
  };

  const handleFontChange = async (postScriptName: string) => {
    const font = getFontByPostScriptName(postScriptName);
    if (!font) return;

    await fontManager.addFont({
      name: font.postScriptName,
      url: font.url,
    });

    handleStyleUpdate({
      fontFamily: font.postScriptName,
      fontUrl: font.url,
    });
  };

  // Memoize font computations to prevent unnecessary recalculations
  const currentFont = useMemo(
    () => getFontByPostScriptName(style.fontFamily) || GROUPED_FONTS[0].mainFont,
    [style.fontFamily],
  );

  const currentFamily = useMemo(
    () => GROUPED_FONTS.find((f) => f.family === currentFont.family) || GROUPED_FONTS[0],
    [currentFont.family],
  );

  const handleStrokeUpdate = (strokeUpdates: any) => {
    textClip.update({
      style: {
        ...style,
        stroke: {
          ...(style.stroke || { color: "#ffffff", width: 0 }),
          ...strokeUpdates,
        },
      },
    });
  };

  const handleBlurUpdate = (blurUpdates: any) => {
    const currentShadow = style.dropShadow || {
      color: "#000000",
      alpha: 1,
      blur: 0,
      distance: 0,
      angle: 0,
    };

    const finalUpdates: any = { ...blurUpdates };

    if (blurUpdates.angle !== undefined) {
      finalUpdates.angle = (parseFloat(blurUpdates.angle) * Math.PI) / 180;
    }

    if (blurUpdates.distance !== undefined) {
      finalUpdates.distance = parseFloat(blurUpdates.distance) || 0;
    }

    textClip.update({
      style: {
        ...style,
        dropShadow: {
          ...currentShadow,
          ...finalUpdates,
        },
      },
    });
  };

  const { setFloatingControl } = useLayoutStore();

  const handleAnimationRemove = (id: string) => {
    textClip.removeAnimation(id);
    setTick((t) => t + 1);
  };

  const animations = textClip.animations || [];

  return (
    <div className="flex flex-col gap-5">
      {/* Content */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Content
        </label>
        <Textarea
          value={textClip.text || ""}
          onChange={(e) => handleUpdate({ text: e.target.value })}
          className="resize-none text-sm"
          placeholder="Enter text..."
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
            <NumberInput
              value={Math.round(textClip.left || 0)}
              onChange={(val) => handleUpdate({ left: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">Y</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(textClip.top || 0)}
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
              value={Math.round(textClip.width || 0)}
              onChange={(val) => handleUpdate({ width: val })}
              className="p-0"
            />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <span className="text-[10px] font-medium text-muted-foreground">H</span>
            </InputGroupAddon>
            <NumberInput
              value={Math.round(textClip.height || 0)}
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
            value={[Math.round(textClip.angle ?? 0)]}
            onValueChange={(v) => handleUpdate({ angle: v[0] })}
            max={360}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round(textClip.angle ?? 0)}
              onChange={(val) => handleUpdate({ angle: val })}
              className="p-0 text-center"
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

        <FontPicker currentFamily={currentFamily} handleFontChange={handleFontChange} />

        <div className="grid grid-cols-2 gap-2">
          <Select value={currentFont.postScriptName} onValueChange={(v) => handleFontChange(v)}>
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
              value={style.fontSize || 40}
              onChange={(val) => handleStyleUpdate({ fontSize: val })}
              className="pl-2"
            />
            <InputGroupAddon align="inline-end">
              <IconTextSize className="size-4" />
            </InputGroupAddon>
          </InputGroup>
        </div>
      </div>

      {/* Alignment Section */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex bg-input/30 rounded-md p-1 gap-1">
          {[
            { icon: IconAlignLeft, value: "left" },
            { icon: IconAlignCenter, value: "center" },
            { icon: IconAlignRight, value: "right" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleUpdate({ textAlign: item.value })}
              className={cn(
                "flex-1 flex items-center justify-center rounded-sm py-1 transition-colors",
                textClip.textAlign === item.value
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/5",
              )}
            >
              <item.icon className="size-3.5" />
            </button>
          ))}
        </div>

        <div className="flex bg-input/30 rounded-md p-1 gap-1">
          {[
            { icon: IconUnderline, value: "underline" },
            { icon: IconOverline, value: "overline" },
            { icon: IconStrikethrough, value: "strikethrough" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleUpdate({ verticalAlign: item.value })}
              className={cn(
                "flex-1 flex items-center justify-center rounded-sm py-1 transition-colors",
                textClip.verticalAlign === item.value
                  ? "bg-white/10 text-white"
                  : "text-muted-foreground hover:bg-white/5",
              )}
            >
              <item.icon className="size-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Case & Color Section */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex bg-secondary/30 rounded-md p-1 gap-1">
          {[
            { label: "aA", value: "none" },
            { label: "AA", value: "uppercase" },
            { label: "aa", value: "lowercase" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => handleUpdate({ textCase: item.value })}
              className={cn(
                "flex-1 text-[10px] font-medium flex items-center justify-center rounded-sm py-1 transition-colors",
                (textClip.textCase || "none") === item.value
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
                    className="h-4 ml-2 w-4 border border-white/10 shadow-sm"
                    style={{
                      backgroundColor: (style.fill as string) || "#000000",
                    }}
                  />
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <ColorPicker
                  onChange={(colorValue) => {
                    // Convert RGBA array to hex format
                    const hexColor = color.rgb(colorValue).hex();
                    handleStyleUpdate({ fill: hexColor });
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
            value={style.fill?.toUpperCase() || "#000000"}
            onChange={(e) => handleStyleUpdate({ fill: e.target.value })}
            className="text-sm p-0 text-[10px] font-mono"
          />
          <InputGroupAddon align="inline-end" className="border-l border-white/5 pl-2">
            <span className="text-[10px]">100%</span>
          </InputGroupAddon>
        </InputGroup>
      </div>

      {/* Opacity Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Opacity
        </label>
        <div className="flex items-center gap-4">
          <IconCircle className="size-4 text-muted-foreground" />
          <Slider
            value={[Math.round((textClip.opacity ?? 1) * 100)]}
            onValueChange={(v) => handleUpdate({ opacity: v[0] / 100 })}
            max={100}
            step={1}
            className="flex-1"
          />
          <InputGroup className="w-20">
            <NumberInput
              value={Math.round((textClip.opacity ?? 1) * 100)}
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
                clipId: textClip.id,
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
                        clipId: textClip.id,
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
              value={Math.round(style.dropShadow?.distance || 0)}
              onChange={(val) => handleBlurUpdate({ distance: val })}
            />
          </InputGroup>

          <InputGroup>
            <InputGroupAddon align="inline-start">
              <IconRotate className="size-3.5" />
            </InputGroupAddon>
            <NumberInput
              value={Math.round(((style.dropShadow?.angle || 0) * 180) / Math.PI)}
              onChange={(val) => handleBlurUpdate({ angle: val })}
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
              onChange={(val) => handleBlurUpdate({ blur: val })}
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
                      handleBlurUpdate({ color: hexColor });
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
              onChange={(e) => handleBlurUpdate({ color: e.target.value })}
              className="text-sm p-0 text-[10px] font-mono"
            />
          </InputGroup>
        </div>
      </div>
    </div>
  );
}
