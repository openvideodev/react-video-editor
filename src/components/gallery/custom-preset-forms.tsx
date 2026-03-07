"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { NumberInput } from "@/components/ui/number-input";
import { Switch } from "@/components/ui/switch";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { ANIMATABLE_PROPERTIES, AnimationProps } from "openvideo";

// --- Effects & Transitions ---

interface CustomShaderFormProps {
  type: "Effect" | "Transition";
  onApply: (data: { label: string; fragment: string }) => void;
  onSave: (data: { label: string; fragment: string }) => void;
  isSaving?: boolean;
  initialData?: { label: string; fragment: string };
}

const EFFECT_TEMPLATE = `in vec2 vTextureCoord;
uniform sampler2D uTexture;
uniform float uTime;

void main(void) {
    vec2 uv = vTextureCoord;
    gl_FragColor = texture2D(uTexture, uv);
}`;

const TRANSITION_TEMPLATE = `vec4 transition(vec2 p) {
  return mix(getFromColor(p), getToColor(p), progress);
}`;

export const CustomShaderForm = ({
  type,
  onApply,
  onSave,
  isSaving,
  initialData,
}: CustomShaderFormProps) => {
  const [label, setLabel] = useState(initialData?.label || "");
  const [fragment, setFragment] = useState(initialData?.fragment || "");

  // Reset fragment when type changes if it wasn't modified or if it matches a template
  useEffect(() => {
    if (!fragment && !initialData?.fragment) {
      setFragment(type === "Effect" ? EFFECT_TEMPLATE : TRANSITION_TEMPLATE);
    }
  }, [type, initialData]);

  const handleReset = () => {
    setFragment(type === "Effect" ? EFFECT_TEMPLATE : TRANSITION_TEMPLATE);
  };

  return (
    <div className="space-y-4 p-1">
      <div className="space-y-2">
        <Label>Label</Label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={`My Custom ${type}`}
        />
      </div>
      <div className="space-y-2">
        <Label>GLSL {type === "Effect" ? "Fragment" : "Transition"} Code</Label>
        <Textarea
          value={fragment}
          onChange={(e) => setFragment(e.target.value)}
          placeholder={
            type === "Effect" ? "void main() { ... }" : "vec4 transition(vec2 p) { ... }"
          }
          className="font-mono h-64 text-xs"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="h-7 px-2 text-[10px] text-muted-foreground hover:text-foreground"
        >
          Reset to Template
        </Button>
      </div>
      <div className="flex gap-2">
        <Button onClick={() => onApply({ label, fragment })} variant="outline" className="flex-1">
          Apply
        </Button>
        <Button onClick={() => onSave({ label, fragment })} className="flex-1" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

// --- Captions ---

export interface ICaptionsControlProps {
  type?: "word" | "lines";
  appearedColor: string;
  activeColor: string;
  activeFillColor: string;
  color: string;
  isKeywordColor?: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  boxShadow?: { x: number; y: number; blur: number; color: string };
  animation?: string | string[];
  fontFamily?: string;
  fontUrl?: string;
  textTransform?: string;
  textAlign?: string;
  preservedColorKeyWord?: boolean;
  wordAnimation?: {
    type: "scale" | "opacity";
    application: "active" | "keyword" | "none";
    value: number;
    mode?: "static" | "dynamic";
  };
}

const CAPTION_ANIMATIONS = [
  "fadeIn",
  "zoomIn",
  "slideIn",
  "blurIn",
  "pulse",
  "popCaption",
  "bounceCaption",
  "scaleCaption",
  "charTypewriter",
  "fadeByWord",
];

const FONT_OPTIONS = [
  { label: "Inter", value: "Inter-Regular", url: "" },
  { label: "Roboto", value: "Roboto-Regular", url: "" },
  {
    label: "Bangers",
    value: "Bangers-Regular",
    url: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
  },
  {
    label: "Luckiest Guy",
    value: "LuckiestGuy-Regular",
    url: "https://fonts.gstatic.com/s/luckiestguy/v11/_Jj6_9_Wp6vSAnYj0p3m69p96p9_p.ttf",
  },
  {
    label: "Chelsea Market",
    value: "ChelseaMarket-Regular",
    url: "https://fonts.gstatic.com/s/chelseamarket/v8/BCawqZsHqfr89WNP_IApC8tzKBhlLA4uKkWk.ttf",
  },
  {
    label: "Roboto Black",
    value: "Roboto-Black",
    url: "https://fonts.gstatic.com/s/roboto/v29/KFOlCnqEu92Fr1MmYUtvAx05IsDqlA.ttf",
  },
  {
    label: "Cabin Condensed",
    value: "CabinCondensed-Regular",
    url: "https://fonts.gstatic.com/s/cabincondensed/v14/nwpMtK6mNhBK2err_hqkYhHRqmwaYOjZ5HZl8Q.ttf",
  },
  {
    label: "Chivo",
    value: "Chivo-Regular",
    url: "https://fonts.gstatic.com/s/chivo/v12/va9I4kzIxd1KFoBvS-J3kbDP.ttf",
  },
  {
    label: "Montserrat",
    value: "Montserrat-SemiBold",
    url: "https://fonts.gstatic.com/s/montserrat/v18/JTURjIg1_i6t8kCHKm45_bZF7g7J_950vCo.ttf",
  },
  {
    label: "Fjalla One",
    value: "FjallaOne-Regular",
    url: "https://fonts.gstatic.com/s/fjallaone/v8/Yq6R-LCAWCX3-6Ky7FAFnOZwkxgtUb8.ttf",
  },
  {
    label: "Anonymous Pro",
    value: "AnonymousPro-Regular",
    url: "https://fonts.gstatic.com/s/anonymouspro/v14/rP2Bp2a15UIB7Un-bOeISG3pLlw89CH98Ko.ttf",
  },
  {
    label: "Francois One",
    value: "FrancoisOne-Regular",
    url: "https://fonts.gstatic.com/s/francoisone/v15/_Xmr-H4zszafZw3A-KPSZutNxgKQu_avAg.ttf",
  },
  {
    label: "Encode Sans",
    value: "EncodeSans-Regular",
    url: "https://fonts.gstatic.com/s/encodesans/v8/LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGGHjZtWP7FJCt2c.ttf",
  },
  {
    label: "Alfa Slab One",
    value: "AlfaSlabOne-Regular",
    url: "https://fonts.gstatic.com/s/alfaslabone/v10/6NUQ8FmMKwSEKjnm5-4v-4Jh6dVretWvYmE.ttf",
  },
  {
    label: "Knewave",
    value: "Knewave-Regular",
    url: "https://fonts.gstatic.com/s/knewave/v9/sykz-yx0lLcxQaSItSq9-trEvlQ.ttf",
  },
  {
    label: "Sigmar One",
    value: "SigmarOne-Regular",
    url: "https://fonts.gstatic.com/s/sigmarone/v11/co3DmWZ8kjZuErj9Ta3dk6Pjp3Di8U0.ttf",
  },
  {
    label: "Permanent Marker",
    value: "PermanentMarker-Regular",
    url: "https://fonts.gstatic.com/s/permanentmarker/v10/Fh4uPib9Iyv2ucM6pGQMWimMp004HaqIfrT5nlk.ttf",
  },
  {
    label: "Atma",
    value: "Atma-SemiBold",
    url: "https://fonts.gstatic.com/s/atma/v8/uK_z4rqWc-Eoo7Z1Kjc9PvedRkM.ttf",
  },
];

export const CustomCaptionForm = ({
  onApply,
  onSave,
  isSaving,
}: {
  onApply: (data: ICaptionsControlProps) => void;
  onSave: (data: ICaptionsControlProps) => void;
  isSaving?: boolean;
}) => {
  const [isAnimationEnabled, setIsAnimationEnabled] = useState(true);
  const [isWordAnimationEnabled, setIsWordAnimationEnabled] = useState(true);

  const [config, setConfig] = useState<ICaptionsControlProps>({
    type: "lines",
    appearedColor: "#ffffff",
    activeColor: "#ffff00",
    activeFillColor: "#000000",
    color: "#ffffff",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 2,
    boxShadow: { x: 4, y: 4, blur: 4, color: "rgba(0,0,0,0.5)" },
    animation: "fadeIn",
    fontFamily: "Bangers-Regular",
    textTransform: "none",
    textAlign: "center",
    preservedColorKeyWord: false,
    wordAnimation: {
      type: "scale",
      application: "active",
      value: 1.2,
      mode: "dynamic",
    },
  });

  const update = (patch: Partial<ICaptionsControlProps>) =>
    setConfig((prev) => ({ ...prev, ...patch }));

  const handleApply = () => {
    const finalConfig = { ...config };
    if (!isAnimationEnabled) {
      delete finalConfig.animation;
    }
    if (!isWordAnimationEnabled) {
      delete finalConfig.wordAnimation;
    }
    onApply(finalConfig);
  };

  const handleSave = () => {
    const finalConfig = { ...config };
    if (!isAnimationEnabled) {
      delete finalConfig.animation;
    }
    if (!isWordAnimationEnabled) {
      delete finalConfig.wordAnimation;
    }
    onSave(finalConfig);
  };

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6 p-1 pb-4">
        {/* Basic Settings */}
        <div className="space-y-2 max-w-[200px]">
          <Label>Mode</Label>
          <Select value={config.type} onValueChange={(v: any) => update({ type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="word">Word (Single)</SelectItem>
              <SelectItem value="lines">Lines (Multiple)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Typography */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase text-muted-foreground mr-auto block">
            Typography
          </Label>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px]">Font</Label>
              <Select
                value={config.fontFamily}
                onValueChange={(v) => {
                  const opt = FONT_OPTIONS.find((o) => o.value === v);
                  update({ fontFamily: v, fontUrl: opt?.url });
                }}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Align</Label>
              <Select value={config.textAlign} onValueChange={(v) => update({ textAlign: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Case</Label>
              <Select
                value={config.textTransform}
                onValueChange={(v) => update({ textTransform: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Normal</SelectItem>
                  <SelectItem value="uppercase">Uppercase</SelectItem>
                  <SelectItem value="lowercase">Lowercase</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase text-muted-foreground mr-auto block">
            Colors
          </Label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Text", key: "color" },
              { label: "Appeared", key: "appearedColor" },
              { label: "Active Word", key: "activeColor" },
              { label: "Active Fill", key: "activeFillColor" },
              { label: "Keyword Color", key: "isKeywordColor" },
              { label: "Bg Color", key: "backgroundColor" },
              { label: "Border Color", key: "borderColor" },
            ].map((item) => (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px]">{item.label}</Label>
                  <div className="flex items-center gap-1">
                    <Checkbox
                      checked={(config as any)[item.key] === "transparent"}
                      onCheckedChange={(checked) =>
                        update({
                          [item.key]: checked ? "transparent" : "#000000",
                        })
                      }
                      id={`trans-${item.key}`}
                    />
                    <label
                      htmlFor={`trans-${item.key}`}
                      className="text-[9px] text-muted-foreground cursor-pointer"
                    >
                      Trans
                    </label>
                  </div>
                </div>
                {(config as any)[item.key] !== "transparent" ? (
                  <Input
                    type="color"
                    value={(config as any)[item.key] || "#000000"}
                    onChange={(e) => update({ [item.key]: e.target.value })}
                    className="h-8 p-1"
                  />
                ) : (
                  <div className="h-8 border rounded-md bg-secondary/20 flex items-center justify-center text-[10px] text-muted-foreground italic">
                    Transparent
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={config.preservedColorKeyWord}
              onCheckedChange={(v) => update({ preservedColorKeyWord: v === true })}
            />
            <Label className="text-[10px]">Preserve Keyword Color</Label>
          </div>
        </div>

        {/* Animation */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Default Animation
            </Label>
            <Switch checked={isAnimationEnabled} onCheckedChange={setIsAnimationEnabled} />
          </div>
          {isAnimationEnabled && (
            <div className="space-y-2">
              <Label className="text-[10px]">Animation Type</Label>
              <Select
                value={config.animation as string}
                onValueChange={(v) => update({ animation: v })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAPTION_ANIMATIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Border Width & Shadow */}
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase text-muted-foreground mr-auto block">
            Border Width & Shadow
          </Label>
          <div className="space-y-2">
            <Label className="text-[10px]">Border Width</Label>
            <NumberInput
              value={config.borderWidth}
              onChange={(v) => update({ borderWidth: v })}
              className="h-8"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label className="text-[10px]">Shadow X</Label>
              <NumberInput
                value={config.boxShadow?.x || 0}
                onChange={(v) => update({ boxShadow: { ...config.boxShadow!, x: v } })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Shadow Y</Label>
              <NumberInput
                value={config.boxShadow?.y || 0}
                onChange={(v) => update({ boxShadow: { ...config.boxShadow!, y: v } })}
                className="h-8"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px]">Blur</Label>
              <NumberInput
                value={config.boxShadow?.blur || 0}
                onChange={(v) => update({ boxShadow: { ...config.boxShadow!, blur: v } })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Word Animation */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground">
              Active Word Animation
            </Label>
            <Switch checked={isWordAnimationEnabled} onCheckedChange={setIsWordAnimationEnabled} />
          </div>
          {isWordAnimationEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px]">Type</Label>
                <Select
                  value={config.wordAnimation?.type}
                  onValueChange={(v) =>
                    update({
                      wordAnimation: {
                        ...config.wordAnimation!,
                        type: v as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Scale</SelectItem>
                    <SelectItem value="opacity">Opacity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Application</Label>
                <Select
                  value={config.wordAnimation?.application}
                  onValueChange={(v) =>
                    update({
                      wordAnimation: {
                        ...config.wordAnimation!,
                        application: v as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="keyword">Keyword</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Value</Label>
                <NumberInput
                  value={config.wordAnimation?.value || 1}
                  onChange={(v) =>
                    update({
                      wordAnimation: { ...config.wordAnimation!, value: v },
                    })
                  }
                  className="h-8"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px]">Mode</Label>
                <Select
                  value={config.wordAnimation?.mode}
                  onValueChange={(v) =>
                    update({
                      wordAnimation: {
                        ...config.wordAnimation!,
                        mode: v as any,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">Static</SelectItem>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={handleApply} variant="outline" className="flex-1">
            Apply
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};

// --- Animations (Keyframes) ---

type PropertyKey = keyof typeof ANIMATABLE_PROPERTIES;

export const CustomAnimationForm = ({
  onApply,
  onSave,
  isSaving,
}: {
  onApply: (data: any) => void;
  onSave: (data: any) => void;
  isSaving?: boolean;
}) => {
  const [keyframes, setKeyframes] = useState<Record<string, Partial<AnimationProps>>>({
    "0%": {},
    "100%": {},
  });
  const [duration, setDuration] = useState(1000);
  const [easing, setEasing] = useState("easeOutQuad");

  const sortedKeys = Object.keys(keyframes).sort((a, b) => parseInt(a) - parseInt(b));

  const handlePropertyToggle = (kf: string, prop: PropertyKey, enabled: boolean) => {
    setKeyframes((prev) => {
      const next = { ...prev };
      if (enabled) {
        next[kf] = { ...next[kf], [prop]: ANIMATABLE_PROPERTIES[prop].default };
      } else {
        const { [prop]: _, ...rest } = next[kf];
        next[kf] = rest;
      }
      return next;
    });
  };

  const handlePropertyChange = (kf: string, prop: PropertyKey, val: number) => {
    setKeyframes((prev) => ({ ...prev, [kf]: { ...prev[kf], [prop]: val } }));
  };

  const addKeyframe = () => {
    // Binary split logic: 50, then 25, then 75, then largest gap
    let newProgress = -1;

    if (!keyframes["50%"]) {
      newProgress = 50;
    } else if (!keyframes["25%"]) {
      newProgress = 25;
    } else if (!keyframes["75%"]) {
      newProgress = 75;
    } else {
      const progressValues = sortedKeys.map((k) => parseInt(k));
      let maxGap = -1;
      let gapStart = 0;
      for (let i = 0; i < progressValues.length - 1; i++) {
        const gap = progressValues[i + 1] - progressValues[i];
        if (gap > maxGap) {
          maxGap = gap;
          gapStart = progressValues[i];
        }
      }
      if (maxGap > 5) {
        newProgress = Math.round(gapStart + maxGap / 2);
      }
    }

    if (newProgress !== -1 && !keyframes[`${newProgress}%`]) {
      setKeyframes((prev) => ({ ...prev, [`${newProgress}%`]: {} }));
    }
  };

  const removeKeyframe = (kf: string) => {
    if (kf === "0%" || kf === "100%") return;
    setKeyframes((prev) => {
      const { [kf]: _, ...rest } = prev;
      return rest;
    });
  };

  const buildData = () => ({
    type: "keyframes",
    opts: { duration: duration * 1000, delay: 0, easing },
    params: keyframes,
  });

  return (
    <ScrollArea className="h-[500px] pr-4">
      <div className="space-y-6 p-1 pb-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Duration (ms)</Label>
            <NumberInput value={duration} onChange={setDuration} />
          </div>
          <div className="space-y-2">
            <Label>Easing</Label>
            <Select value={easing} onValueChange={setEasing}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="easeInQuad">Ease In</SelectItem>
                <SelectItem value="easeOutQuad">Ease Out</SelectItem>
                <SelectItem value="easeInOutQuad">Ease In Out</SelectItem>
                <SelectItem value="easeInBack">Ease In Back</SelectItem>
                <SelectItem value="easeOutBack">Ease Out Back</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold uppercase text-muted-foreground mr-auto">
              Keyframes
            </Label>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={addKeyframe}>
              <IconPlus className="size-4" />
            </Button>
          </div>

          {sortedKeys.map((kf) => (
            <div key={kf} className="border rounded-md p-3 space-y-3 bg-secondary/10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">{kf}</span>
                {kf !== "0%" && kf !== "100%" && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeKeyframe(kf)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {(Object.keys(ANIMATABLE_PROPERTIES) as PropertyKey[]).map((prop) => {
                  const isEnabled = prop in (keyframes[kf] || {});
                  const config = ANIMATABLE_PROPERTIES[prop];
                  return (
                    <div key={prop} className="flex items-center gap-2">
                      <Checkbox
                        checked={isEnabled}
                        onCheckedChange={(c) => handlePropertyToggle(kf, prop, c === true)}
                      />
                      <span className="text-[10px] text-muted-foreground min-w-[60px] truncate">
                        {config.label}
                      </span>
                      {isEnabled && (
                        <div className="flex-1 flex items-center gap-2">
                          <Slider
                            value={[(keyframes[kf] as any)[prop] ?? config.default]}
                            min={config.min}
                            max={config.max}
                            step={config.step}
                            onValueChange={([v]) => handlePropertyChange(kf, prop, v)}
                            className="flex-1"
                          />
                          <span className="text-[10px] w-8 text-right">
                            {(keyframes[kf] as any)[prop]}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onApply(buildData())} variant="outline" className="flex-1">
            Apply
          </Button>
          <Button onClick={() => onSave(buildData())} className="flex-1">
            Save
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
};
