import { useState, useEffect } from "react";
import {
  ANIMATABLE_PROPERTIES,
  AnimationProps,
  AnimationOptions,
  KeyframeData,
} from "@openvideo/engine-pixi";
import {
  getPresetKeyframes,
  SPECIAL_ANIMATIONS_CAPTIONS,
  GSAP_PRESETS,
} from "@/lib/animation-presets";
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
import { IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useLayoutStore from "../store/use-layout-store";
import { useStudioStore } from "@/stores/studio-store";
import { Switch } from "@/components/ui/switch";
import * as Popover from "@radix-ui/react-popover";

type PropertyKey = keyof typeof ANIMATABLE_PROPERTIES;

export function AnimationPropertiesPicker() {
  const { floatingControlData, setFloatingControl } = useLayoutStore();
  const { studio } = useStudioStore();

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
    if (animation?.options?.duration) {
      return animation.options.duration / 1000;
    }
    if (typeClip === "Caption") {
      return (clipDuration * 0.2) / 1000;
    }
    return 1000;
  });
  const [delay, setDelay] = useState<number>((animation?.options?.delay || 0) / 1000);
  const [iterCount, setIterCount] = useState<number>(animation?.options?.iterCount || 1);
  const [easing, setEasing] = useState<string>((animation?.options?.easing as string) || "linear");
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
      const currentDelayMicro = animation.options?.delay;
      const currentDurationMicro = animation.options?.duration;
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

  // Removed manual click outside handling in favor of Radix Popover

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
      if (!(preset in GSAP_PRESETS)) {
        const template = getPresetKeyframes(preset);
        setKeyframes(template);
      }
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

  const handleRenameKeyframe = (oldKey: string, newKey: string) => {
    if (newKey === oldKey || newKey === "0%" || newKey === "100%") return;
    setKeyframes((prev) => {
      if (prev[newKey]) return prev; // don't overwrite existing
      const { [oldKey]: props, ...rest } = prev;
      return { ...rest, [newKey]: props };
    });
  };

  const buildAnimationConfig = () => {
    const options: AnimationOptions = {
      duration: duration * 1000,
      delay: delay * 1000,
      iterCount,
      easing,
    };

    const isStagger = preset in GSAP_PRESETS;
    const type = isStagger ? "stagger" : "keyframes";

    const finalParams: any = isStagger
      ? (() => {
          const staggerPreset = GSAP_PRESETS[preset];
          const p = structuredClone(staggerPreset.params);
          p.stagger = presetParams.stagger ?? p.stagger ?? 0.05;
          return p;
        })()
      : structuredClone(keyframes);

    if (!isStagger) {
      Object.keys(finalParams).forEach((key) => {
        if (key.includes("%")) {
          finalParams[key].mirror = mirrorEnabled ? 1 : 0;
        }
      });
    }

    return { type, options, finalParams };
  };

  const handleSave = () => {
    const { type, options, finalParams } = buildAnimationConfig();

    if (mode === "edit" && animationId) {
      clip.updateAnimation(animationId, type, options, finalParams);
    } else {
      clip.addAnimation(type, options, finalParams);
    }

    clip.emit("propsChange", {});
    setFloatingControl("");
  };

  const handleApplyToAllCaptions = () => {
    if (!studio) return;

    const { type, options, finalParams } = buildAnimationConfig();

    studio.clips.forEach((c: any) => {
      if (c.type === "Caption") {
        c.animations = [];
        const special = SPECIAL_ANIMATIONS_CAPTIONS.includes(type);
        const targetDuration = special ? c.duration : c.duration * 0.2;
        let targetDelay = options.delay;
        if (type.toLowerCase().includes("out") || activeTab === "out") {
          targetDelay = Math.max(0, c.duration - targetDuration);
        }

        c.addAnimation(
          type,
          { ...options, duration: targetDuration, delay: targetDelay },
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

  const comboPresets = [
    { label: "Combo Zoom 1", value: "comboZoom1" },
    { label: "Combo Zoom 2", value: "comboZoom2" },
    { label: "Combo Pendulum 1", value: "comboPendulum1" },
    { label: "Combo Pendulum 2", value: "comboPendulum2" },
    { label: "Combo Right Distort", value: "comboRightDistort" },
    { label: "Combo Left Distort", value: "comboLeftDistort" },
    { label: "Combo Wobble", value: "comboWobble" },
    { label: "Combo Spinning Top 1", value: "comboSpinningTop1" },
    { label: "Combo Spinning Top 2", value: "comboSpinningTop2" },
    { label: "Combo Sway Out", value: "comboSwayOut" },
    { label: "Combo Bounce 1", value: "comboBounce1" },
    { label: "Combo Sway In", value: "comboSwayIn" },
  ];

  useEffect(() => {
    let newDuration = 1000;
    let mirror = false;
    if (activeTab === "combo") {
      newDuration = clipDuration / 1000;
      mirror = true;
    } else {
      if (animation?.options?.duration) {
        newDuration = animation.options.duration / 1000;
      } else if (typeClip === "Caption") {
        newDuration = (clipDuration * 0.2) / 1000;
      }
      if (animation?.params) {
        mirror = Object.values(animation.params as KeyframeData).some(
          (p: any) => p && p.mirror > 0,
        );
      }
    }
    setDuration(newDuration);
    setMirrorEnabled(mirror);
  }, [clipDuration, activeTab, animation, typeClip]);

  return (
    <Popover.Root open={!!clipId} onOpenChange={(open) => !open && setFloatingControl("")}>
      <Popover.Anchor className="absolute left-full top-0" />
      <Popover.Content
        side="right"
        align="start"
        sideOffset={8}
        className="z-[200] w-80 border bg-background p-0 shadow-xl rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
        onInteractOutside={(e) => {
          // Prevent closing when interacting with portals (Select dropdowns)
          const target = e.target as HTMLElement;
          if (
            target.closest("[data-radix-portal]") ||
            target.closest("[data-radix-popper-content-wrapper]")
          ) {
            e.preventDefault();
          }
        }}
      >
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-4 p-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                {mode === "add" ? "Add Animation" : "Edit Animation"}
              </h3>
              <button
                onClick={() => setFloatingControl("")}
                className="text-muted-foreground hover:text-foreground"
              >
                <IconX className="size-3.5" />
              </button>
            </div>

            {/* Tabs */}

            {typeClip === "Caption" ? (
              <div className="flex flex-col gap-2">
                <PresetOptions
                  preset={preset}
                  activeTab={activeTab}
                  inPresets={inPresets}
                  outPresets={outPresets}
                  comboPresets={comboPresets}
                  handlePresetChange={handlePresetChange}
                />
                <EasingOptions easing={easing} setEasing={setEasing} />
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-7">
                  <TabsTrigger value="in" className="text-xs">
                    In
                  </TabsTrigger>
                  <TabsTrigger value="out" className="text-xs">
                    Out
                  </TabsTrigger>
                  <TabsTrigger value="combo" className="text-xs">
                    Combo
                  </TabsTrigger>
                </TabsList>

                <div className="mt-2 flex flex-col gap-2">
                  {/* Preset Selector */}
                  <PresetOptions
                    preset={preset}
                    activeTab={activeTab}
                    inPresets={inPresets}
                    outPresets={outPresets}
                    comboPresets={comboPresets}
                    handlePresetChange={handlePresetChange}
                  />

                  {/* Preset Parameters (Slide Only) */}
                  {(preset === "slideIn" || preset === "slideOut") && (
                    <div className="grid grid-cols-2 gap-1.5 p-2 bg-secondary/20 rounded-md">
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

                  {/* Stagger */}
                  {preset in GSAP_PRESETS && (
                    <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded-md">
                      <label className="text-[10px] text-muted-foreground shrink-0 w-14">
                        Stagger {presetParams.stagger}s
                      </label>
                      <Slider
                        value={[presetParams.stagger || 0.05]}
                        min={0}
                        max={0.5}
                        step={0.01}
                        onValueChange={([val]) =>
                          setPresetParams((prev: any) => ({ ...prev, stagger: val }))
                        }
                        className="flex-1"
                      />
                    </div>
                  )}

                  {!(preset in GSAP_PRESETS) && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold">Keyframes</label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddKeyframe}
                          className="h-7 gap-1 text-xs"
                        >
                          <IconPlus className="size-3" />
                          Add Stop
                        </Button>
                      </div>
                      {sortedKeyframes.map((keyframe) => (
                        <KeyframeItem
                          key={keyframe}
                          keyframe={keyframe}
                          properties={keyframes[keyframe] || {}}
                          onPropertyChange={(prop, val) =>
                            handlePropertyChange(keyframe, prop, val)
                          }
                          onPropertyToggle={(prop, enabled) =>
                            handlePropertyToggle(keyframe, prop, enabled)
                          }
                          onRemove={() => handleRemoveKeyframe(keyframe)}
                          onRename={(newKey) => handleRenameKeyframe(keyframe, newKey)}
                          canRemove={keyframe !== "0%" && keyframe !== "100%"}
                        />
                      ))}
                    </div>
                  )}

                  {/* Mirror Effect */}
                  {typeClip !== "Text" && !(preset in GSAP_PRESETS) && (
                    <div className="flex items-center justify-between px-2 py-1.5 bg-secondary/20 rounded-md">
                      <span className="text-[10px] text-muted-foreground">Mirror</span>
                      <Switch checked={mirrorEnabled} onCheckedChange={setMirrorEnabled} />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold">Timing</label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">Duration (ms)</span>
                        <NumberInput value={duration} onChange={setDuration} className="h-8" />
                      </div>
                      <div
                        className={cn(
                          "flex flex-col gap-1",
                          activeTab === "out" && "opacity-50 pointer-events-none",
                        )}
                      >
                        <span className="text-[10px] text-muted-foreground">Delay (ms)</span>
                        <NumberInput value={delay} onChange={setDelay} className="h-8" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted-foreground">Iterations</span>
                        <NumberInput value={iterCount} onChange={setIterCount} className="h-8" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold">Easing</label>
                    <EasingOptions easing={easing} setEasing={setEasing} />
                  </div>
                </div>
              </Tabs>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => setFloatingControl("")} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={typeClip === "Caption" ? handleApplyToAllCaptions : handleSave}
                className="flex-1"
                disabled={
                  !preset &&
                  !Object.values(keyframes).some((frame) => Object.keys(frame).length > 0)
                }
              >
                {mode === "add" ? "Add" : "Save"}
              </Button>
            </div>
          </div>
        </ScrollArea>
      </Popover.Content>
    </Popover.Root>
  );
}

interface KeyframeItemProps {
  keyframe: string;
  properties: Partial<AnimationProps>;
  onPropertyChange: (property: PropertyKey, value: number) => void;
  onPropertyToggle: (property: PropertyKey, enabled: boolean) => void;
  onRemove: () => void;
  onRename: (newKey: string) => void;
  canRemove: boolean;
}

function KeyframeItem({
  keyframe,
  properties,
  onPropertyChange,
  onPropertyToggle,
  onRemove,
  onRename,
  canRemove,
}: KeyframeItemProps) {
  const [pctValue, setPctValue] = useState(keyframe.replace("%", ""));

  useEffect(() => {
    setPctValue(keyframe.replace("%", ""));
  }, [keyframe]);

  const activeProps = (Object.keys(properties) as PropertyKey[]).filter(
    (p) => p !== "mirror" && p in ANIMATABLE_PROPERTIES,
  );
  const availableProps = (Object.keys(ANIMATABLE_PROPERTIES) as PropertyKey[]).filter(
    (p) => p !== "mirror" && !(p in properties),
  );

  const commitRename = (raw: string) => {
    const n = Math.max(1, Math.min(99, parseInt(raw) || 1));
    setPctValue(String(n));
    const newKey = `${n}%`;
    if (newKey !== keyframe) onRename(newKey);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b">
        {canRemove ? (
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={99}
              value={pctValue}
              onChange={(e) => setPctValue(e.target.value)}
              onBlur={(e) => commitRename(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename((e.target as HTMLInputElement).value);
                if (e.key === "Escape") setPctValue(keyframe.replace("%", ""));
              }}
              className="w-12 h-7 rounded border bg-background px-2 text-sm font-bold tabular-nums text-center outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm font-bold text-muted-foreground">%</span>
          </div>
        ) : (
          <span className="text-sm font-bold tabular-nums">{keyframe}</span>
        )}
        <span className="text-xs text-muted-foreground flex-1">
          {activeProps.length === 0
            ? "No properties"
            : activeProps.map((p) => ANIMATABLE_PROPERTIES[p].label).join(", ")}
        </span>
        {canRemove && (
          <button onClick={onRemove} className="text-muted-foreground hover:text-destructive">
            <IconTrash className="size-3.5" />
          </button>
        )}
      </div>

      {/* Property rows */}
      <div className="p-3 flex flex-col gap-3 bg-card">
        {activeProps.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-1">
            No properties — add one below
          </p>
        )}
        {activeProps.map((prop) => {
          const config = ANIMATABLE_PROPERTIES[prop];
          return (
            <div key={prop} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{config.label}</span>
                <div className="flex items-center gap-2">
                  <NumberInput
                    value={properties[prop] ?? config.default}
                    onChange={(val) => onPropertyChange(prop, val)}
                    className="w-16 h-7 text-xs"
                  />
                  <button
                    onClick={() => onPropertyToggle(prop, false)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <IconX className="size-3.5" />
                  </button>
                </div>
              </div>
              <Slider
                value={[properties[prop] ?? config.default]}
                onValueChange={([val]) => onPropertyChange(prop, val)}
                min={config.min}
                max={config.max}
                step={config.step}
              />
            </div>
          );
        })}

        {availableProps.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed text-muted-foreground"
              >
                <IconPlus data-icon="inline-start" />
                Add Property
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[300]" align="start">
              {availableProps.map((p) => (
                <DropdownMenuItem key={p} onSelect={() => onPropertyToggle(p, true)}>
                  {ANIMATABLE_PROPERTIES[p].label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
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
    <div className="flex flex-col gap-1">
      <Select value={easing} onValueChange={setEasing}>
        <SelectTrigger className="w-full h-7 text-xs">
          <SelectValue placeholder="Easing" />
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
  comboPresets,
  handlePresetChange,
}: {
  preset: string;
  activeTab: string;
  inPresets: { label: string; value: string }[];
  outPresets: { label: string; value: string }[];
  comboPresets: { label: string; value: string }[];
  handlePresetChange: (preset: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <Select value={preset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-full h-7 text-xs">
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
          {activeTab === "combo" &&
            comboPresets.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>
    </div>
  );
};
