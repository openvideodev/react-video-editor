import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStudioStore } from "@/stores/studio-store";
import { getTransitionOptions, registerCustomTransition } from "openvideo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus } from "lucide-react";
import { Icons } from "@/components/shared/icons";

const TRANSITION_DURATION_DEFAULT = 2_000_000;

const gridClasses = `
  grid
  grid-cols-[repeat(auto-fill,minmax(80px,1fr))]
  gap-4
  justify-items-center
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomPreset = {
  id: string;
  name: string;
  category: string;
  data: { label: string; fragment: string };
  published: boolean;
  userId: string;
};

// ─── Shared card for built-in transitions ─────────────────────────────────────

type TransitionCardProps = {
  effectKey: string;
  label: string;
  previewStatic: string;
  previewDynamic: string;
  onClick: () => void;
  badge?: string;
};

const TransitionCard = ({
  effectKey,
  label,
  previewStatic,
  previewDynamic,
  onClick,
  badge,
}: TransitionCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [dragState, setDragState] = useState<{
    x: number;
    y: number;
    overTimeline: boolean;
  } | null>(null);

  const timelineBoundsRef = useRef<DOMRect | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalDrag = (e: DragEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (x === 0 && y === 0) return;

      // Direct DOM manipulation for GPU-accelerated 60fps movement
      if (ghostRef.current) {
        ghostRef.current.style.transform = `translate3d(${x + 15}px, ${y + 15}px, 0)`;
      }

      const bounds = timelineBoundsRef.current;
      const overTimeline = bounds
        ? x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
        : false;

      setDragState((prev) => {
        if (prev && prev.overTimeline === overTimeline) return prev;
        return { x, y, overTimeline };
      });
    };

    document.addEventListener("dragover", handleGlobalDrag);
    return () => document.removeEventListener("dragover", handleGlobalDrag);
  }, [isDragging]);

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/plain", effectKey);
          e.dataTransfer.setData("type", "transition");
          const img = new Image();
          img.src =
            "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
          e.dataTransfer.setDragImage(img, 0, 0);

          const el = document.getElementById("timeline-canvas");
          if (el) timelineBoundsRef.current = el.getBoundingClientRect();

          setDragState({ x: e.clientX, y: e.clientY, overTimeline: false });
          setIsDragging(true);
        }}
        onDrag={(e) => {
          // No-op: handled by global dragover listener for higher frequency
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setDragState(null);
        }}
        className="flex w-full items-center gap-2 flex-col group cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div className="relative w-full aspect-video rounded-md bg-input/30 border overflow-hidden">
          {previewStatic || previewDynamic ? (
            <>
              {previewStatic && (
                <img
                  src={previewStatic}
                  loading="lazy"
                  className="
            absolute inset-0 w-full h-full object-cover rounded-sm
            transition-opacity duration-150
            opacity-100 group-hover:opacity-0
          "
                />
              )}

              {isHovered && previewDynamic && (
                <img
                  src={previewDynamic}
                  className="
              absolute inset-0 w-full h-full object-cover rounded-sm
              transition-opacity duration-150
              opacity-0 group-hover:opacity-100
            "
                />
              )}
            </>
          ) : (
            <div className="text-xs text-muted-foreground text-center px-2 bg-primary/40 h-full w-full"></div>
          )}

          {badge && (
            <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded-full leading-none">
              {badge}
            </div>
          )}

          <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-white text-xs font-medium truncate text-center transition-opacity duration-150 group-hover:opacity-0">
            {label}
          </div>
        </div>
      </div>

      {dragState &&
        createPortal(
          <div
            ref={ghostRef}
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              transform: `translate3d(${dragState.x + 15}px, ${dragState.y + 15}px, 0)`,
              willChange: "transform",
              pointerEvents: "none",
              zIndex: 99999,
            }}
          >
            {dragState.overTimeline ? (
              <div className="w-12 h-12 bg-black rounded flex items-center justify-center opacity-90 shadow-lg">
                <Icons.transition className="text-white w-6 h-6" />
              </div>
            ) : (
              <div className="w-20 aspect-video rounded-md bg-input/80 border overflow-hidden shadow-xl">
                {previewStatic && (
                  <img src={previewStatic} className="w-full h-full object-cover rounded-sm" />
                )}
                <div className="absolute bottom-0 left-0 w-full p-1 bg-gradient-to-t from-black/80 to-transparent text-white text-[10px] font-medium truncate text-center">
                  {label}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

// ─── Default Transitions ──────────────────────────────────────────────────────

const TransitionDefault = () => {
  const { studio } = useStudioStore();
  const allTransitions = getTransitionOptions();

  return (
    <>
      {allTransitions.map((effect) => (
        <TransitionCard
          key={effect.key}
          effectKey={effect.key}
          label={effect.label}
          previewStatic={effect.previewStatic}
          previewDynamic={effect.previewDynamic}
          onClick={() => {
            if (!studio) return;
            studio.addTransition(effect.key, TRANSITION_DURATION_DEFAULT);
          }}
        />
      ))}
    </>
  );
};

// ─── Custom Transitions (from DB) ────────────────────────────────────────────

const TransitionCustom = () => {
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
        const res = await fetch("/api/custom-presets?category=transitions");
        if (!res.ok) throw new Error("Failed to fetch custom transitions");
        const json = await res.json();
        setOwnPresets(json.own ?? []);
        setPublishedPresets(json.published ?? []);
      } catch {
        setError("Could not load custom transitions.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchPresets();
  }, []);

  const handleClick = async (preset: CustomPreset) => {
    if (!studio) return;
    // Derive a stable key from the preset id
    const key = `custom_transition_${preset.id}`;
    // Register the custom GLSL shader so the engine can render it
    await registerCustomTransition(key, {
      key,
      label: preset.data.label || preset.name,
      fragment: preset.data.fragment,
    } as any);
    studio.addTransition(key, TRANSITION_DURATION_DEFAULT);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-xs">Loading custom transitions…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-xs text-destructive">{error}</div>
    );
  }

  if (ownPresets.length === 0 && publishedPresets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
        <span className="text-xs">No custom transitions yet.</span>
        <span className="text-[10px]">Create one from the Gallery to see it here.</span>
      </div>
    );
  }

  return (
    <>
      {ownPresets.map((preset) => (
        <TransitionCard
          key={preset.id}
          effectKey={preset.id}
          label={preset.data.label || preset.name}
          previewStatic=""
          previewDynamic=""
          onClick={() => handleClick(preset)}
        />
      ))}
      {publishedPresets.map((preset) => (
        <TransitionCard
          key={preset.id}
          effectKey={preset.id}
          label={preset.data.label || preset.name}
          previewStatic=""
          previewDynamic=""
          onClick={() => handleClick(preset)}
          badge="Public"
        />
      ))}
    </>
  );
};

// ─── Panel ────────────────────────────────────────────────────────────────────

const PanelTransition = () => {
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
          { value: "default", Component: TransitionDefault },
          { value: "custom", Component: TransitionCustom },
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

export default PanelTransition;
