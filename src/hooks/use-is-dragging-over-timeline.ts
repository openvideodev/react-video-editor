import { useEffect, useState } from "react";

export const useIsDraggingOverTimeline = () => {
  const [isDraggingOverTimeline, setIsDraggingOverTimeline] = useState(false);

  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('[data-timeline="true"]')) {
        setIsDraggingOverTimeline(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      const relatedTarget = e.relatedTarget as HTMLElement;
      // Only set to false if we're leaving the timeline entirely
      if (target?.closest('[data-timeline="true"]') && !relatedTarget?.closest('[data-timeline="true"]')) {
        setIsDraggingOverTimeline(false);
      }
    };

    const handleDragEnd = () => {
      setIsDraggingOverTimeline(false);
    };

    document.addEventListener("dragenter", handleDragEnter, true);
    document.addEventListener("dragleave", handleDragLeave, true);
    document.addEventListener("dragend", handleDragEnd, true);

    return () => {
      document.removeEventListener("dragenter", handleDragEnter, true);
      document.removeEventListener("dragleave", handleDragLeave, true);
      document.removeEventListener("dragend", handleDragEnd, true);
    };
  }, []);

  return isDraggingOverTimeline;
};
