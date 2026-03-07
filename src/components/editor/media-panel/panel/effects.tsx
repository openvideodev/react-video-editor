import { useState } from "react";
import { Effect, getEffectOptions, VALUES_FILTER_SPECIAL } from "openvideo";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
};

const EffectCard = ({ label, staticSrc, dynamicSrc, onClick }: EffectCardProps) => {
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
        <img
          src={staticSrc}
          loading="lazy"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            isHovering && isDynamicLoaded ? "opacity-0" : "opacity-100"
          }`}
        />

        <img
          src={dynamicSrc}
          loading="lazy"
          onLoad={() => setIsDynamicLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
            isHovering && isDynamicLoaded ? "opacity-100" : "opacity-0"
          }`}
        />

        {isHovering && !isDynamicLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="w-6 h-6 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <div className="absolute bottom-0 left-0 w-full p-2 bg-linear-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-200 group-hover:opacity-0">
          {label}
        </div>
      </div>
    </div>
  );
};
const EffectDefault = () => {
  const { studio } = useStudioStore();
  const effects = getEffectOptions();

  const handleClick = (key: string) => {
    if (!studio) return;

    const clip = new Effect(key);
    clip.duration = EFFECT_DURATION_DEFAULT;
    studio.addClip(clip);
  };

  return (
    <>
      {effects.map((effect) => (
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
const EffectSpecial = () => {
  const { studio } = useStudioStore();

  const handleClick = (filterName: string) => {
    if (!studio) return;

    const clip = new Effect(filterName);
    clip.duration = EFFECT_DURATION_DEFAULT;

    if (filterName === "embossFilter") {
      clip.effect.values = { strength: 5 };
    }

    if (filterName === "pixelateFilter") {
      clip.effect.values = { size: 10 };
    }

    studio.addClip(clip);
  };

  return (
    <>
      {Object.keys(VALUES_FILTER_SPECIAL).map((filterName) => (
        <EffectCard
          key={filterName}
          label={formatFilterName(filterName)}
          staticSrc={`https://cdn.subgen.co/previews/effects/static/effect_${filterName}_static.webp`}
          dynamicSrc={`https://cdn.subgen.co/previews/effects/dynamic/effect_${filterName}_dynamic.webp`}
          onClick={() => handleClick(filterName)}
        />
      ))}
    </>
  );
};
const PanelEffect = () => {
  return (
    <div className="p-4 h-full">
      <Tabs defaultValue="default" className="w-full h-full">
        <TabsList className="w-full">
          <TabsTrigger value="default">Default</TabsTrigger>
          <TabsTrigger value="special">Special</TabsTrigger>
        </TabsList>

        {[
          { value: "default", Component: EffectDefault },
          { value: "special", Component: EffectSpecial },
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
