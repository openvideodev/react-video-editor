import * as React from "react";
import { IClip, getTransitionOptions, registerCustomTransition } from "openvideo";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudioStore } from "@/stores/studio-store";
import { Loader2, Timer } from "lucide-react";

interface TransitionPropertiesProps {
  clip: IClip;
}

type CustomPreset = {
  id: string;
  name: string;
  category: string;
  data: { label: string; fragment: string };
  published: boolean;
  userId: string;
};

const LOADED_CACHE: Record<string, { static: boolean; dynamic: boolean }> = {};
let LAST_SCROLL_POS = 0;

export function TransitionProperties({ clip }: TransitionPropertiesProps) {
  const transitionClip = clip as any;
  const { studio, selectedClips } = useStudioStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [loaded, setLoaded] = React.useState(LOADED_CACHE);
  const [localDuration, setLocalDuration] = React.useState(transitionClip.duration / 1_000_000);

  React.useEffect(() => {
    setLocalDuration(transitionClip.duration / 1_000_000);
  }, [transitionClip.duration]);

  React.useLayoutEffect(() => {
    const viewport = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) {
      viewport.scrollTop = LAST_SCROLL_POS;
    }
  }, []);

  const markLoaded = (key: string, type: "static" | "dynamic") => {
    if (LOADED_CACHE[key]?.[type]) return;
    LOADED_CACHE[key] = {
      ...LOADED_CACHE[key],
      [type]: true,
    };
    setLoaded({ ...LOADED_CACHE });
  };

  const fromClip = studio?.timeline.getClipById(transitionClip.fromClipId);
  const toClip = studio?.timeline.getClipById(transitionClip.toClipId);

  const minFromToDuration = Math.min(fromClip?.duration ?? Infinity, toClip?.duration ?? Infinity);

  const maxDurationMicro = minFromToDuration === Infinity ? 10_000_000 : minFromToDuration * 0.25;
  const minDurationMicro = 100_000; // 0.1s

  const handleUpdate = async (updates: any) => {
    if (!studio || !transitionClip.fromClipId || !transitionClip.toClipId) return;

    let newDuration = updates.duration ?? transitionClip.duration;
    const newKey = updates.key ?? transitionClip.transitionEffect.key;

    if (newDuration !== undefined || updates.key !== undefined) {
      newDuration = Math.max(minDurationMicro, Math.min(maxDurationMicro, newDuration));

      const transitionStart = toClip!.display.from - newDuration / 2;
      const transitionEnd = transitionStart + newDuration;
      const transitionMeta = {
        key: newKey,
        name: newKey,
        duration: newDuration,
        fromClipId: transitionClip.fromClipId,
        toClipId: transitionClip.toClipId,
        start: Math.max(0, transitionStart),
        end: transitionEnd,
      };

      // Clear cached transition renderers if the key or duration changed
      if (
        newKey !== transitionClip.transitionEffect.key ||
        newDuration !== transitionClip.duration
      ) {
        const transKey = `${transitionClip.fromClipId}_${transitionClip.toClipId}`;
        if ((studio as any).transitionRenderers.has(transKey)) {
          (studio as any).transitionRenderers.get(transKey)?.destroy();
          (studio as any).transitionRenderers.delete(transKey);
        }
      }

      // Update the transition clip and related clips in a single batch
      const clipUpdates: any = {
        duration: newDuration,
        display: { from: Math.max(0, transitionStart), to: transitionEnd },
      };

      if (updates.key) {
        clipUpdates.transitionEffect = {
          id: transitionClip.transitionEffect.id,
          key: newKey,
          name: newKey,
        };
      }

      const updatesList = [
        {
          id: transitionClip.id,
          updates: clipUpdates,
        },
      ];

      if (fromClip) {
        updatesList.push({
          id: fromClip.id,
          updates: { transition: transitionMeta } as any,
        });
      }
      if (toClip) {
        updatesList.push({
          id: toClip.id,
          updates: { transition: transitionMeta } as any,
        });
      }

      await studio.updateClips(updatesList);

      studio.seek(studio.currentTime);
    }
  };

  const maxDurationInSeconds = maxDurationMicro / 1_000_000;
  const minDurationInSeconds = minDurationMicro / 1_000_000;

  const allTransitions = getTransitionOptions();

  const renderTransitionList = (list: typeof allTransitions) => (
    <div
      className={`grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5 justify-items-center p-2 transition-all duration-200`}
    >
      {list.map((effect) => {
        const isReady = loaded[effect.key]?.static && loaded[effect.key]?.dynamic;

        return (
          <div
            key={effect.key}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", effect.key);
              e.dataTransfer.setData("type", "transition");
            }}
            className="flex w-full items-center gap-2 flex-col group cursor-pointer relative select-none"
            onClick={() => {
              if (!studio) return;
              handleUpdate({ key: effect.key });
            }}
          >
            <div className="relative w-full aspect-video rounded-md bg-input/30 border overflow-hidden">
              <>
                {!isReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                )}

                <img
                  src={effect.previewStatic}
                  onLoad={() => markLoaded(effect.key, "static")}
                  loading="lazy"
                  className="
                absolute inset-0 w-full h-full object-cover rounded-sm
                transition-opacity duration-150
                opacity-100 group-hover:opacity-0
              "
                />

                <img
                  src={effect.previewDynamic}
                  onLoad={() => markLoaded(effect.key, "dynamic")}
                  loading="lazy"
                  className="
                absolute inset-0 w-full h-full object-cover rounded-sm
                transition-opacity duration-150
                opacity-0 group-hover:opacity-100
              "
                />
              </>

              <div
                className={`absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-150 group-hover:opacity-0`}
              >
                {effect.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── Custom presets state ──────────────────────────────────────────────────
  const [ownPresets, setOwnPresets] = React.useState<CustomPreset[]>([]);
  const [publishedPresets, setPublishedPresets] = React.useState<CustomPreset[]>([]);
  const [presetsLoading, setPresetsLoading] = React.useState(true);
  const [presetsError, setPresetsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchPresets = async () => {
      setPresetsLoading(true);
      setPresetsError(null);
      try {
        const res = await fetch("/api/custom-presets?category=transitions");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setOwnPresets(json.own ?? []);
        setPublishedPresets(json.published ?? []);
      } catch {
        setPresetsError("Could not load custom transitions.");
      } finally {
        setPresetsLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const handleCustomClick = async (preset: CustomPreset) => {
    const key = `custom_transition_${preset.id}`;
    await registerCustomTransition(key, {
      key,
      label: preset.data.label || preset.name,
      fragment: preset.data.fragment,
    } as any);
    handleUpdate({ key });
  };

  const renderCustomPreset = (preset: CustomPreset, badge?: string) => (
    <div
      key={preset.id}
      className="flex w-full items-center gap-2 flex-col group cursor-pointer relative select-none"
      onClick={() => handleCustomClick(preset)}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", preset.id);
        e.dataTransfer.setData("type", "transition");
      }}
    >
      <div className="relative w-full aspect-video rounded-md bg-primary/40 border overflow-hidden">
        {badge && (
          <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none z-10">
            {badge}
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center">
          {preset.data.label || preset.name}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      {/* Duration Section */}
      <div className="flex flex-col gap-2">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Duration
        </label>
        <div className="flex gap-2">
          <div className="flex items-center gap-4 flex-1">
            <Timer className="size-4 text-muted-foreground" />
            <Slider
              value={[localDuration]}
              onValueChange={(v) => setLocalDuration(v[0])}
              onValueCommit={(v) => handleUpdate({ duration: v[0] * 1_000_000 })}
              max={maxDurationInSeconds}
              min={minDurationInSeconds}
              step={0.1}
              className="flex-1"
            />
            <InputGroup className="w-20">
              <InputGroupInput
                type="number"
                value={localDuration.toFixed(1)}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLocalDuration(val);
                  handleUpdate({
                    duration: val * 1_000_000,
                  });
                }}
                className="text-sm p-0 text-center"
              />
              <InputGroupAddon align="inline-end" className="p-0 pr-2">
                <span className="text-[10px] text-muted-foreground">s</span>
              </InputGroupAddon>
            </InputGroup>
          </div>
        </div>
      </div>

      <Tabs defaultValue="default" className="flex flex-col flex-1 min-h-0">
        <TabsList className="w-full shrink-0">
          <TabsTrigger value="default" className="flex-1">
            Default
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="default" className="flex-1 min-h-0 mt-2">
          <ScrollArea
            ref={scrollRef}
            onScrollCapture={() => {
              const viewport = scrollRef.current?.querySelector(
                "[data-radix-scroll-area-viewport]",
              );
              if (viewport) {
                LAST_SCROLL_POS = viewport.scrollTop;
              }
            }}
            className="h-full"
          >
            {renderTransitionList(allTransitions)}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="custom" className="flex-1 min-h-0 mt-2">
          <ScrollArea className="h-full">
            {presetsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                <span className="text-xs">Loading custom transitions…</span>
              </div>
            ) : presetsError ? (
              <div className="flex items-center justify-center py-12 text-xs text-destructive">
                {presetsError}
              </div>
            ) : ownPresets.length === 0 && publishedPresets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                <span className="text-xs">No custom transitions yet.</span>
                <span className="text-[10px]">Create one from the Gallery to see it here.</span>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5 justify-items-center">
                {ownPresets.map((p) => renderCustomPreset(p))}
                {publishedPresets.map((p) => renderCustomPreset(p, "Public"))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
