import * as React from "react";
import { useState, useEffect } from "react";
import { ANIMATABLE_PROPERTIES, AnimationProps, AnimationOptions, KeyframeData } from "openvideo";
import { getPresetTemplate } from "openvideo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { NumberInput } from "@/components/ui/number-input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import useLayoutStore from "../store/use-layout-store";
import { useStudioStore } from "@/stores/studio-store";
import { useRef } from "react";
import { Switch } from "@/components/ui/switch";

type PropertyKey = keyof typeof ANIMATABLE_PROPERTIES;

const SPECIAL_ANIMATIONS_CAPTIONS = [
  "charTypewriter",
  "upDownCaption",
  "upLeftCaption",
  "fadeByWord",
];

export function AnimationPropertiesPicker() {
  const { floatingControlData, setFloatingControl } = useLayoutStore();
  const { studio } = useStudioStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const { clipId, animationId, mode } = floatingControlData || {};
  const clip = studio?.getClipById(clipId) as any;
  const animation = animationId ? clip?.animations.find((a: any) => a.id === animationId) : null;
  const clipDuration = clip?.duration || 0;
  const typeClip = clip?.type || "";

  const [activeTab, setActiveTab] = useState<string>("in");
  const [preset, setPreset] = useState<string>(animation?.type || "");
  const [presetParams, setPresetParams] = useState<any>({
    direction: "left",
    distance: 300,
    stagger: 0.05,
  });
  const [keyframes, setKeyframes] = useState<Record<string, Partial<AnimationProps>>>(
    animation?.params || { "0%": {}, "100%": {} },
  );
  const [duration, setDuration] = useState<number>(() => {
    if (animation?.options.duration) {
      return animation.options.duration / 1000;
    }
    if (typeClip === "Caption") {
      return (clipDuration * 0.2) / 1000;
    }
    return 1000;
  });
  const [delay, setDelay] = useState<number>((animation?.options.delay || 0) / 1000);
  const [iterCount, setIterCount] = useState<number>(animation?.options.iterCount || 1);
  const [easing, setEasing] = useState<string>((animation?.options.easing as string) || "");
  const [mirrorEnabled, setMirrorEnabled] = useState<boolean>(false);

  // Initialize from animation
  useEffect(() => {
    if (animation && animation.params) {
      setKeyframes(animation.params);
      if (animation.params.presetParams) {
        setPresetParams(animation.params.presetParams);
      }

      // Check if mirror is enabled in any keyframe
      const hasMirror = Object.values(animation.params as KeyframeData).some(
        (p: any) => p && p.mirror > 0,
      );
      setMirrorEnabled(hasMirror);

      // Determine active tab based on delay and type
      const currentDelayMicro = animation.options.delay;
      const currentDurationMicro = animation.options.duration;
      const isOut =
        animation.type.toLowerCase().includes("out") ||
        (currentDelayMicro > 0 &&
          Math.abs(currentDelayMicro + currentDurationMicro - clipDuration) < 1000); // within 1ms tolerance

      if (animation.type === "keyframes") {
        setActiveTab("custom");
      } else {
        setActiveTab(isOut ? "out" : "in");
      }
    }
  }, [animation, clipDuration]);

  // Click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        !target.closest("[data-radix-portal]") &&
        !target.closest("[data-radix-popper-content-wrapper]")
      ) {
        setFloatingControl("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setFloatingControl]);

  // Handle Tab Change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === "in") {
      setDelay(0);
      setPreset("");
    } else if (tab === "out") {
      const newDelay = Math.max(0, clipDuration / 1000 - duration);
      setDelay(newDelay);
      setPreset("");
    } else {
      setPreset("");
    }
  };

  // Keep 'Out' delay synced with duration
  useEffect(() => {
    if (activeTab === "out") {
      const newDelay = Math.max(0, clipDuration / 1000 - duration);
      setDelay(newDelay);
    }
  }, [duration, clipDuration, activeTab]);

  // Update keyframes only when preset or params change via UI
  useEffect(() => {
    if (preset !== "custom" && preset !== "") {
      const template = getPresetTemplate(preset, presetParams);
      setKeyframes(template);
    } else if (preset === "" || (preset === "custom" && Object.keys(keyframes).length === 0)) {
      setKeyframes({ "0%": {}, "100%": {} });
    }
  }, [preset, presetParams]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
  };

  const handlePropertyChange = (keyframe: string, property: PropertyKey, value: number) => {
    setKeyframes((prev) => ({
      ...prev,
      [keyframe]: {
        ...prev[keyframe],
        [property]: value,
      },
    }));
  };

  const handlePropertyToggle = (keyframe: string, property: PropertyKey, enabled: boolean) => {
    setKeyframes((prev) => {
      const newKeyframes = { ...prev };
      if (enabled) {
        newKeyframes[keyframe] = {
          ...newKeyframes[keyframe],
          [property]: ANIMATABLE_PROPERTIES[property].default,
        };
      } else {
        const { [property]: _, ...rest } = newKeyframes[keyframe] || {};
        newKeyframes[keyframe] = rest;
      }
      return newKeyframes;
    });
  };

  const handleAddKeyframe = () => {
    const existingProgress = Object.keys(keyframes)
      .map((k) => {
        const match = k.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    // Find the largest gap or add after last
    let newProgress = 50;
    if (existingProgress.length >= 2) {
      let maxGap = -1;
      let gapStart = 0;
      for (let i = 0; i < existingProgress.length - 1; i++) {
        const gap = existingProgress[i + 1] - existingProgress[i];
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = existingProgress[i];
        }
      }
      if (maxGap > 5) {
        newProgress = Math.round(gapStart + maxGap / 2);
      } else {
        newProgress = Math.min(existingProgress[existingProgress.length - 1] + 10, 100);
      }
    }

    // Ensure uniqueness
    while (keyframes[`${newProgress}%`] && newProgress < 100) {
      newProgress++;
    }

    setKeyframes((prev) => ({
      ...prev,
      [`${newProgress}%`]: {},
    }));
  };

  const handleRemoveKeyframe = (keyframe: string) => {
    if (keyframe === "0%" || keyframe === "100%") return;
    setKeyframes((prev) => {
      const { [keyframe]: _, ...rest } = prev;
      return rest;
    });
  };

  const buildAnimationConfig = () => {
    const opts: AnimationOptions = {
      duration: duration * 1000,
      delay: delay * 1000,
      iterCount,
      easing,
    };

    const finalParams: any = structuredClone(keyframes);

    Object.keys(finalParams).forEach((key) => {
      if (key.includes("%")) {
        finalParams[key].mirror = mirrorEnabled ? 1 : 0;
      }
    });

    if (preset !== "custom") {
      const filteredParams: any = {};

      if (preset === "slideIn" || preset === "slideOut") {
        filteredParams.direction = presetParams.direction;
        filteredParams.distance = presetParams.distance;
      } else if (preset.startsWith("char")) {
        filteredParams.stagger = presetParams.stagger;
      }

      finalParams.presetParams = filteredParams;
    }

    const type = preset === "custom" || preset === "" ? "keyframes" : preset;

    return { type, opts, finalParams };
  };

  const handleSave = () => {
    const { type, opts, finalParams } = buildAnimationConfig();

    if (mode === "edit" && animationId) {
      clip.updateAnimation(animationId, type, opts, finalParams);
    } else {
      clip.addAnimation(type, opts, finalParams);
    }

    clip.emit("propsChange", {});
    setFloatingControl("");
  };

  const handleApplyToAllCaptions = () => {
    if (!studio) return;

    const { type, opts, finalParams } = buildAnimationConfig();

    studio.clips.forEach((c: any) => {
      if (c.type === "Caption") {
        c.animations = [];
        const special = SPECIAL_ANIMATIONS_CAPTIONS.includes(type);
        const targetDuration = special ? c.duration : c.duration * 0.2;
        let targetDelay = opts.delay;
        if (type.toLowerCase().includes("out") || activeTab === "out") {
          targetDelay = Math.max(0, c.duration - targetDuration);
        }

        c.addAnimation(
          type,
          { ...opts, duration: targetDuration, delay: targetDelay },
          finalParams,
        );
        c.emit("propsChange", {});
      }
    });

    setFloatingControl("");
  };

  const sortedKeyframes = Object.keys(keyframes)
    .filter((k) => k.includes("%"))
    .sort((a, b) => {
      const aNum = parseInt(a.replace("%", ""));
      const bNum = parseInt(b.replace("%", ""));
      return aNum - bNum;
    });

  const isTextLike = typeClip === "Text" || typeClip === "Caption";

  const inPresets = [
    { label: "Fade In", value: "fadeIn" },
    { label: "Zoom In", value: "zoomIn" },
    { label: "Slide In", value: "slideIn" },
    { label: "Blur In", value: "blurIn" },
    { label: "Pulse", value: "pulse" },
    ...(isTextLike
      ? [
          { label: "Pop", value: "popCaption" },
          { label: "Bounce", value: "bounceCaption" },
          { label: "Scale", value: "scaleCaption" },
          { label: "Slide Left", value: "slideLeftCaption" },
          { label: "Slide Right", value: "slideRightCaption" },
          { label: "Slide Up", value: "slideUpCaption" },
          { label: "Slide Down", value: "slideDownCaption" },
          { label: "Slide Fade By Word", value: "slideFadeByWord" },
          { label: "Up Down", value: "upDownCaption" },
          { label: "Up Left", value: "upLeftCaption" },
          { label: "Char Fade In", value: "charFadeIn" },
          { label: "Char Slide Up", value: "charSlideUp" },
          { label: "Char Typewriter", value: "charTypewriter" },
          { label: "Fade By Word", value: "fadeByWord" },
          { label: "Pop By Word", value: "popByWord" },
          { label: "Scale Fade By Word", value: "scaleFadeByWord" },
          { label: "Bounce By Word", value: "bounceByWord" },
          { label: "Rotate In By Word", value: "rotateInByWord" },
          { label: "Slide Right By Word", value: "slideRightByWord" },
          { label: "Slide Left By Word", value: "slideLeftByWord" },
          { label: "Fade Rotate By Word", value: "fadeRotateByWord" },
          { label: "Skew By Word", value: "skewByWord" },
          { label: "Wave By Word", value: "waveByWord" },
          { label: "Blur In By Word", value: "blurInByWord" },
          { label: "Drop Soft By Word", value: "dropSoftByWord" },
          { label: "Elastic Pop By Word", value: "elasticPopByWord" },
          { label: "Flip Up By Word", value: "flipUpByWord" },
          { label: "Spin In By Word", value: "spinInByWord" },
          { label: "Stretch In By Word", value: "stretchInByWord" },
          { label: "Reveal Zoom By Word", value: "revealZoomByWord" },
          { label: "Float Wave By Word", value: "floatWaveByWord" },
        ]
      : []),
  ];

  const outPresets = [
    { label: "Fade Out", value: "fadeOut" },
    { label: "Zoom Out", value: "zoomOut" },
    { label: "Slide Out", value: "slideOut" },
    { label: "Blur Out", value: "blurOut" },
    { label: "Pulse", value: "pulse" },
  ];

  return (
    <div
      ref={containerRef}
      className="absolute left-full top-0 z-[200] ml-2 w-72 border bg-background p-0 shadow-xl rounded-lg overflow-hidden"
    >
      <ScrollArea className="max-h-[600px]">
        <div className="flex flex-col gap-4 p-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">
              {mode === "add" ? "Add Animation" : "Edit Animation"}
            </h3>
            <button
              onClick={() => setFloatingControl("")}
              className="text-muted-foreground hover:text-white"
            >
              <IconX className="size-4" />
            </button>
          </div>

          {/* Tabs */}

          {typeClip === "Caption" ? (
            <div className="mt-4 flex flex-col gap-4">
              <PresetOptions
                preset={preset}
                activeTab={activeTab}
                inPresets={inPresets}
                outPresets={outPresets}
                handlePresetChange={handlePresetChange}
              />
              <EasingOptions easing={easing} setEasing={setEasing} />
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="in">In</TabsTrigger>
                <TabsTrigger value="out">Out</TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
              </TabsList>

              <div className="mt-4 flex flex-col gap-4">
                {/* Preset Selector */}
                <PresetOptions
                  preset={preset}
                  activeTab={activeTab}
                  inPresets={inPresets}
                  outPresets={outPresets}
                  handlePresetChange={handlePresetChange}
                />

                {/* Preset Parameters (Slide Only) */}
                {(preset === "slideIn" || preset === "slideOut") && (
                  <div className="grid grid-cols-2 gap-2 p-2 bg-secondary/20 rounded-md">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground">Direction</label>
                      <Select
                        value={presetParams.direction}
                        onValueChange={(val) =>
                          setPresetParams((prev: any) => ({
                            ...prev,
                            direction: val,
                          }))
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[250]">
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-muted-foreground">Distance (px)</label>
                      <NumberInput
                        value={presetParams.distance}
                        onChange={(val) =>
                          setPresetParams((prev: any) => ({
                            ...prev,
                            distance: val,
                          }))
                        }
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Stagger (for character animations) */}
                {preset.startsWith("char") && (
                  <div className="flex flex-col gap-2 p-2 bg-secondary/20 rounded-md">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] text-muted-foreground">
                        Stagger: {presetParams.stagger}s
                      </label>
                    </div>
                    <Slider
                      value={[presetParams.stagger || 0.05]}
                      min={0}
                      max={0.5}
                      step={0.01}
                      onValueChange={([val]) =>
                        setPresetParams((prev: any) => ({
                          ...prev,
                          stagger: val,
                        }))
                      }
                    />
                  </div>
                )}

                {/* Keyframes */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Keyframes
                  </label>

                  {sortedKeyframes.map((keyframe) => (
                    <KeyframeItem
                      key={keyframe}
                      keyframe={keyframe}
                      properties={keyframes[keyframe] || {}}
                      onPropertyChange={(prop, val) => handlePropertyChange(keyframe, prop, val)}
                      onPropertyToggle={(prop, enabled) =>
                        handlePropertyToggle(keyframe, prop, enabled)
                      }
                      onRemove={() => handleRemoveKeyframe(keyframe)}
                      canRemove={keyframe !== "0%" && keyframe !== "100%"}
                    />
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddKeyframe}
                    className="w-full"
                  >
                    <IconPlus className="size-3.5 mr-1" />
                    Add Keyframe
                  </Button>
                </div>

                {/* Mirror Effect */}
                {typeClip !== "Text" && (
                  <div className="flex items-center justify-between p-2 bg-secondary/20 rounded-md border border-dashed">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium">Mirror Effect</span>
                      <span className="text-[10px] text-muted-foreground">
                        Repeat edges to fill frame
                      </span>
                    </div>
                    <Switch checked={mirrorEnabled} onCheckedChange={setMirrorEnabled} />
                  </div>
                )}

                {/* Timing */}
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Timing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <InputGroup>
                      <InputGroupAddon align="inline-start">
                        <span className="text-[10px] font-medium text-muted-foreground">
                          Duration
                        </span>
                      </InputGroupAddon>
                      <NumberInput value={duration} onChange={setDuration} className="p-0" />
                      <InputGroupAddon align="inline-end">
                        <span className="text-[10px] text-muted-foreground">ms</span>
                      </InputGroupAddon>
                    </InputGroup>

                    <InputGroup
                      className={cn(activeTab !== "custom" && "opacity-60 pointer-events-none")}
                    >
                      <InputGroupAddon align="inline-start">
                        <span className="text-[10px] font-medium text-muted-foreground">Delay</span>
                      </InputGroupAddon>
                      <NumberInput value={delay} onChange={setDelay} className="p-0" />
                      <InputGroupAddon align="inline-end">
                        <span className="text-[10px] text-muted-foreground">ms</span>
                      </InputGroupAddon>
                    </InputGroup>
                  </div>

                  {activeTab === "out" && (
                    <div className="text-[10px] text-muted-foreground italic px-1">
                      * Delay matches clip end automatically
                    </div>
                  )}

                  <InputGroup>
                    <InputGroupAddon align="inline-start">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        Iterations
                      </span>
                    </InputGroupAddon>
                    <NumberInput value={iterCount} onChange={setIterCount} className="p-0" />
                  </InputGroup>
                </div>

                {/* Easing */}
                <EasingOptions easing={easing} setEasing={setEasing} />
              </div>
            </Tabs>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2 border-t mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setFloatingControl("")} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={typeClip === "Caption" ? handleApplyToAllCaptions : handleSave}
                className="flex-1"
              >
                {mode === "add" ? "Add" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

interface KeyframeItemProps {
  keyframe: string;
  properties: Partial<AnimationProps>;
  onPropertyChange: (property: PropertyKey, value: number) => void;
  onPropertyToggle: (property: PropertyKey, enabled: boolean) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function KeyframeItem({
  keyframe,
  properties,
  onPropertyChange,
  onPropertyToggle,
  onRemove,
  canRemove,
}: KeyframeItemProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border rounded-md bg-secondary/20">
      <div
        className="flex items-center justify-between p-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">{keyframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            {Object.keys(properties).length}{" "}
            {Object.keys(properties).length === 1 ? "property" : "properties"}
          </span>
          {canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-muted-foreground hover:text-red-400"
            >
              <IconTrash className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="p-2 pt-0 flex flex-col gap-2">
          {(Object.keys(ANIMATABLE_PROPERTIES) as PropertyKey[])
            .filter((prop) => prop !== "mirror")
            .map((prop) => {
              const isEnabled = prop in properties;
              const config = ANIMATABLE_PROPERTIES[prop];

              return (
                <div key={prop} className="flex items-center gap-2">
                  <Checkbox
                    checked={isEnabled}
                    onCheckedChange={(checked) => onPropertyToggle(prop, checked === true)}
                  />

                  <span className="text-[10px] text-muted-foreground min-w-[60px]">
                    {config.label}
                  </span>
                  {isEnabled && (
                    <div className="flex-1 flex items-center gap-2">
                      <Slider
                        value={[properties[prop] ?? config.default]}
                        onValueChange={([val]) => onPropertyChange(prop, val)}
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        className="flex-1"
                      />
                      <NumberInput
                        value={properties[prop] ?? config.default}
                        onChange={(val) => onPropertyChange(prop, val)}
                        className="w-16 h-7 text-xs p-1"
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

const EasingOptions = ({
  easing,
  setEasing,
}: {
  easing: string;
  setEasing: (easing: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Easing
      </label>
      <Select value={easing} onValueChange={setEasing}>
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder="Select easing" />
        </SelectTrigger>
        <SelectContent className="z-[250]">
          <SelectItem value="linear">Linear</SelectItem>
          <SelectItem value="slow">Slow</SelectItem>
          <SelectItem value="easeInQuad">Ease In Quad</SelectItem>
          <SelectItem value="easeOutQuad">Ease Out Quad</SelectItem>
          <SelectItem value="easeInOutQuad">Ease In Out Quad</SelectItem>
          <SelectItem value="easeInCubic">Ease In Cubic</SelectItem>
          <SelectItem value="easeOutCubic">Ease Out Cubic</SelectItem>
          <SelectItem value="easeInOutCubic">Ease In Out Cubic</SelectItem>
          <SelectItem value="easeInBack">Ease In Back</SelectItem>
          <SelectItem value="easeOutBack">Ease Out Back</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

const PresetOptions = ({
  preset,
  activeTab,
  inPresets,
  outPresets,
  handlePresetChange,
}: {
  preset: string;
  activeTab: string;
  inPresets: { label: string; value: string }[];
  outPresets: { label: string; value: string }[];
  handlePresetChange: (preset: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        Preset
      </label>
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full h-9">
          <SelectValue placeholder="Select a preset" />
        </SelectTrigger>
        <SelectContent className="z-[250] max-h-60">
          {activeTab === "in" &&
            inPresets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          {activeTab === "out" &&
            outPresets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          {activeTab === "custom" && (
            <>
              <SelectItem value="custom">Keyframes Only</SelectItem>
              {Array.from(
                new Map([...inPresets, ...outPresets].map((p) => [p.value, p])).values(),
              ).map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
