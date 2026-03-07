import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { getTransitionOptions } from "openvideo";

const PanelTransition = () => {
  const { studio } = useStudioStore();
  const TRANSITION_DURATION_DEFAULT = 2_000_000;

  const [hovered, setHovered] = useState<Record<string, boolean>>({});

  const allTransitions = getTransitionOptions();

  const renderTransitionList = (list: typeof allTransitions) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-2.5 justify-items-center">
      {list.map((effect) => {
        const isHovered = hovered[effect.key];

        return (
          <div
            key={effect.key}
            className="flex w-full items-center gap-2 flex-col group cursor-pointer"
            onMouseEnter={() => setHovered((prev) => ({ ...prev, [effect.key]: true }))}
            onMouseLeave={() => setHovered((prev) => ({ ...prev, [effect.key]: false }))}
            onClick={() => {
              if (!studio) return;
              studio.addTransition(effect.key, TRANSITION_DURATION_DEFAULT);
            }}
          >
            <div className="relative w-full aspect-video rounded-md bg-input/30 border overflow-hidden">
              <img
                src={effect.previewStatic}
                loading="lazy"
                className="
                  absolute inset-0 w-full h-full object-cover rounded-sm
                  transition-opacity duration-150
                  opacity-100 group-hover:opacity-0
                "
              />

              {isHovered && (
                <img
                  src={effect.previewDynamic}
                  className="
                    absolute inset-0 w-full h-full object-cover rounded-sm
                    transition-opacity duration-150
                    opacity-0 group-hover:opacity-100
                  "
                />
              )}
              <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-150 group-hover:opacity-0">
                {effect.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="py-4 h-full flex flex-col gap-4">
      <ScrollArea className="flex-1 px-4">{renderTransitionList(allTransitions)}</ScrollArea>
    </div>
  );
};

export default PanelTransition;
