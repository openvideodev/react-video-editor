import { ISize } from "@openvideo/timeline";
import { useCallback, useEffect, useRef, useState } from "react";

function useZoom(containerRef: React.RefObject<HTMLDivElement>, size: ISize) {
  const [zoom, setZoom] = useState(0.01);
  const currentZoomRef = useRef(0.01);

  const calculateZoom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const PADDING = 30;
    const containerHeight = container.clientHeight - PADDING;
    const containerWidth = container.clientWidth - PADDING;
    const { width, height } = size;

    const desiredZoom = Math.min(containerWidth / width, containerHeight / height);
    currentZoomRef.current = desiredZoom;
    setZoom(desiredZoom);
  }, [containerRef, size]);

  useEffect(() => {
    calculateZoom();
  }, [calculateZoom]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Use ResizeObserver to watch for container size changes
    const resizeObserver = new ResizeObserver(() => {
      calculateZoom();
    });

    resizeObserver.observe(container);

    // Also listen for window resize events
    const handleWindowResize = () => {
      calculateZoom();
    };

    window.addEventListener("resize", handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [calculateZoom]);

  const handlePinch = useCallback((e: any) => {
    const deltaY = (e as any).inputEvent.deltaY;
    const changer = deltaY > 0 ? 0.0085 : -0.0085;
    const currentZoom = currentZoomRef.current;
    const newZoom = currentZoom + changer;
    if (newZoom >= 0.001 && newZoom <= 10) {
      currentZoomRef.current = newZoom;
      setZoom(newZoom);
    }
  }, []);

  return { zoom, handlePinch, recalculateZoom: calculateZoom };
}

export default useZoom;
