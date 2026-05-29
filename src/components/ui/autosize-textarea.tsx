"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutosizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxHeight?: number;
  minHeight?: number;
}

const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
  ({ className, maxHeight, minHeight = 64, onChange, ...props }, ref) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const combinedRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) || internalRef;

    const adjustHeight = React.useCallback(() => {
      const textarea = combinedRef.current;
      if (!textarea) return;

      textarea.style.height = "auto";
      const newHeight = Math.max(
        minHeight,
        maxHeight ? Math.min(textarea.scrollHeight, maxHeight) : textarea.scrollHeight,
      );
      textarea.style.height = `${newHeight}px`;
    }, [combinedRef, maxHeight, minHeight]);

    React.useEffect(() => {
      adjustHeight();
    }, [adjustHeight, props.value]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      onChange?.(e);
    };

    return (
      <textarea
        ref={combinedRef}
        onChange={handleInput}
        className={cn(
          "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
          className,
        )}
        {...props}
      />
    );
  },
);

AutosizeTextarea.displayName = "AutosizeTextarea";

export { AutosizeTextarea };
