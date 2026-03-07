import { useEffect, useRef, useMemo } from "react";
import { Studio, fontManager, registerCustomTransition, registerCustomEffect } from "openvideo";
import { useTheme } from "next-themes";
import { useStudioStore } from "@/stores/studio-store";
import { useProjectStore } from "@/stores/project-store";
import { editorFont } from "./constants";
import { CUSTOM_TRANSITIONS } from "./transition-custom";
import { CUSTOM_EFFECTS } from "./effect-custom";

const STUDIO_CONFIG = {
  fps: 30,
  interactivity: true,
  spacing: 20,
} as const;

const THEME_COLORS = {
  dark: "#1C160D",
  light: "#ffffff",
} as const;

interface CanvasPanelProps {
  onReady?: () => void;
}

/**
 * CanvasPanel - The main interactive canvas component for the video editor.
 * Manages the Studio instance, canvas rendering, and responsive layout updates.
 */
export function CanvasPanel({ onReady }: CanvasPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const onReadyRef = useRef(onReady);
  const { setStudio } = useStudioStore();
  const { canvasSize } = useProjectStore();
  const { theme, resolvedTheme } = useTheme();

  const bgColor = useMemo(() => {
    const currentTheme = theme === "system" ? resolvedTheme : theme;
    return currentTheme === "dark" ? THEME_COLORS.dark : THEME_COLORS.light;
  }, [theme, resolvedTheme]);

  // Keep onReady ref up to date
  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  // Handle dimension changes
  useEffect(() => {
    if (studioRef.current) {
      studioRef.current.setSize(canvasSize.width, canvasSize.height);
    }
  }, [canvasSize]);

  // Handle theme changes
  useEffect(() => {
    if (studioRef.current) {
      studioRef.current.setBgColor(bgColor);
    }
  }, [bgColor]);

  // Setup Studio and ResizeObserver (only once on mount)
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create studio instance
    studioRef.current = new Studio({
      ...canvasSize,
      ...STUDIO_CONFIG,
      bgColor,
      canvas: canvasRef.current,
    });

    // Initialize fonts and notify when ready
    const initializeStudio = async () => {
      if (!studioRef.current) return;

      try {
        await Promise.all([
          fontManager.loadFonts([
            {
              name: editorFont.fontFamily,
              url: editorFont.fontUrl,
            },
          ]),
          studioRef.current.ready,
        ]);

        // If there's initial data from the project store, load it now
        const projectStore = useProjectStore.getState();
        const initialJSON = projectStore.initialStudioJSON;
        if (initialJSON) {
          // Clear it immediately to "consume" it and avoid double-loading (especially in Strict Mode)
          projectStore.setInitialStudioJSON(null);
          console.log("Loading initial studio JSON", initialJSON);
          await studioRef.current.loadFromJSON(initialJSON);
        }

        onReadyRef.current?.();
      } catch (error) {
        console.error("Failed to initialize studio:", error);
      }
    };

    initializeStudio();

    // Update global store
    setStudio(studioRef.current);

    // Setup ResizeObserver for responsive layout
    const canvas = canvasRef.current;
    const parentElement = canvas.parentElement;
    let resizeObserver: ResizeObserver | null = null;

    if (parentElement) {
      resizeObserver = new ResizeObserver(() => {
        if (studioRef.current && (studioRef.current as any).updateArtboardLayout) {
          (studioRef.current as any).updateArtboardLayout();
        }
      });
      resizeObserver.observe(parentElement);
    }

    // Cleanup function
    return () => {
      // Disconnect ResizeObserver
      if (resizeObserver && parentElement) {
        resizeObserver.unobserve(parentElement);
        resizeObserver.disconnect();
      }

      // Destroy Studio instance
      if (studioRef.current) {
        studioRef.current.destroy();
        studioRef.current = null;
        setStudio(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    CUSTOM_TRANSITIONS.forEach((t) => {
      registerCustomTransition(t.key, t as any);
    });
    CUSTOM_EFFECTS.forEach((e) => {
      registerCustomEffect(e.key, e as any);
    });
  }, []);

  return (
    <div className="h-full w-full flex flex-col min-h-0 min-w-0 bg-card rounded-sm relative">
      <div
        style={{
          flex: 1,
          position: "relative", // Ensure relative positioning for absolute children if needed
          overflow: "hidden", // Hide anything outside (though canvas masks it too)
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
}
