import { useEffect, useState } from "react";
import { Effect, getEffectOptions, VALUES_FILTER_SPECIAL, registerCustomEffect } from "openvideo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const EFFECT_DURATION_DEFAULT = 5000000;

const formatFilterName = (name: string) => {
  return name.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

const gridClasses = `
  grid
  grid-cols-[repeat(auto-fill,minmax(80px,1fr))]
  gap-4
  justify-items-center
`;

type EffectCardProps = {
  label: string;
  staticSrc: string;
  dynamicSrc: string;
  onClick: () => void;
  badge?: string;
};

const EffectCard = ({ label, staticSrc, dynamicSrc, onClick, badge }: EffectCardProps) => {
  const [isDynamicLoaded, setIsDynamicLoaded] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div
      className="flex w-full flex-col items-center gap-2 cursor-pointer group"
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovering(true);

        if (!isDynamicLoaded) {
          const img = new Image();
          img.src = dynamicSrc;
        }
      }}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="relative w-full aspect-video rounded-md bg-input/30 border overflow-hidden">
        {staticSrc || dynamicSrc ? (
          <>
            {staticSrc && (
              <img
                src={staticSrc}
                loading="lazy"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                  isHovering && isDynamicLoaded ? "opacity-0" : "opacity-100"
                }`}
              />
            )}
            {dynamicSrc && (
              <img
                src={dynamicSrc}
                loading="lazy"
                onLoad={() => setIsDynamicLoaded(true)}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                  isHovering && isDynamicLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            )}
            {isHovering && !isDynamicLoaded && dynamicSrc && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="text-xs text-muted-foreground text-center px-2 bg-primary/40 h-full w-full"></div>
        )}
        {isHovering && dynamicSrc && !isDynamicLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {badge && (
          <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
            {badge}
          </div>
        )}

        <div
          className={`absolute bottom-0 left-0 w-full p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-200 ${
            dynamicSrc ? "group-hover:opacity-0" : ""
          }`}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

// ─── Default Effects ──────────────────────────────────────────────────────────

const EffectDefault = () => {
  const { studio } = useStudioStore();
  const effects = getEffectOptions();
  const specialEffects = Object.keys(VALUES_FILTER_SPECIAL).map((filterName) => ({
    key: filterName,
    label: formatFilterName(filterName),
    previewStatic: `https://cdn.subgen.co/previews/effects/static/effect_${filterName}_static.webp`,
    previewDynamic: `https://cdn.subgen.co/previews/effects/dynamic/effect_${filterName}_dynamic.webp`,
  }));
  const allEffects = [...specialEffects, ...effects];

  const handleClick = (key: string) => {
    if (!studio) return;

    const clip = new Effect(key);
    clip.duration = EFFECT_DURATION_DEFAULT;
    if (key === "embossFilter") {
      clip.effect.values = { strength: 5 };
    }
    if (key === "pixelateFilter") {
      clip.effect.values = { size: 10 };
    }
    studio.addClip(clip);
  };

  return (
    <>
      {allEffects.map((effect) => (
        <EffectCard
          key={effect.key}
          label={effect.label}
          staticSrc={effect.previewStatic}
          dynamicSrc={effect.previewDynamic}
          onClick={() => handleClick(effect.key)}
        />
      ))}
    </>
  );
};

// ─── Custom Effects (from DB) ─────────────────────────────────────────────────

type CustomPreset = {
  id: string;
  name: string;
  category: string;
  data: { label: string; fragment: string };
  published: boolean;
  userId: string;
};

const EffectCustom = () => {
  const { studio } = useStudioStore();
  const [ownPresets, setOwnPresets] = useState<CustomPreset[]>([]);
  const [publishedPresets, setPublishedPresets] = useState<CustomPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPresets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/custom-presets?category=effects");
        if (!res.ok) throw new Error("Failed to fetch custom effects");
        const json = await res.json();
        setOwnPresets(json.own ?? []);
        setPublishedPresets(json.published ?? []);
      } catch (err) {
        setError("Could not load custom effects.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const handleClick = async (preset: CustomPreset) => {
    if (!studio) return;
    // Use a stable key derived from the preset id
    const key = `custom_effect_${preset.id}`;
    // Register the custom GLSL shader so the engine knows how to render it
    await registerCustomEffect(key, {
      key,
      label: preset.data.label || preset.name,
      fragment: preset.data.fragment,
    } as any);
    const clip = new Effect(key);
    clip.duration = EFFECT_DURATION_DEFAULT;
    studio.addClip(clip);
  };

  if (isLoading) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-xs">Loading custom effects…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="col-span-full flex items-center justify-center py-12 text-xs text-destructive">
        {error}
      </div>
    );
  }

  if (ownPresets.length === 0 && publishedPresets.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <span className="text-xs">No custom effects yet.</span>
        <span className="text-[10px]">Create one from the Gallery to see it here.</span>
      </div>
    );
  }

  return (
    <>
      {ownPresets.map((preset) => (
        <EffectCard
          key={preset.id}
          label={preset.data.label || preset.name}
          staticSrc=""
          dynamicSrc=""
          onClick={() => handleClick(preset)}
        />
      ))}
      {publishedPresets.map((preset) => (
        <EffectCard
          key={preset.id}
          label={preset.data.label || preset.name}
          staticSrc=""
          dynamicSrc=""
          onClick={() => handleClick(preset)}
          badge="Public"
        />
      ))}
    </>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

const PanelEffect = () => {
  return (
    <div className="p-4 h-full">
      <Tabs defaultValue="default" className="w-full h-full">
        <TabsList className="w-full">
          <TabsTrigger value="default" className="flex-1">
            Default
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex-1">
            Custom
          </TabsTrigger>
        </TabsList>

        {[
          { value: "default", Component: EffectDefault },
          { value: "custom", Component: EffectCustom },
        ].map(({ value, Component }) => (
          <TabsContent key={value} value={value} className="h-full">
            <ScrollArea className="h-[calc(100%-60px)]">
              <div className={gridClasses}>
                <Component />
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default PanelEffect;
