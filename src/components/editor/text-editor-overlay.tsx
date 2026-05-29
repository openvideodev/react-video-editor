"use client";

import React, { useState, useEffect, useRef } from "react";
import { useStudioStore } from "@/stores/studio-store";
import { Textarea } from "@/components/ui/textarea";

interface TextEditorOverlayProps {
  clip: any;
  onClose: () => void;
}

/**
 * TextEditorOverlay - An inline text editor that overlays the canvas.
 * Appears when a text clip is double-clicked.
 */
export function TextEditorOverlay({ clip, onClose }: TextEditorOverlayProps) {
  const { studio } = useStudioStore();
  const [text, setText] = useState(clip.text || "");
  const [bounds, setBounds] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text); // Track text for saving on unmount

  // Sync textRef with state
  useEffect(() => {
    textRef.current = text;
  }, [text]);

  useEffect(() => {
    if (!studio || !studio.pixiApp) return;

    const updatePosition = () => {
      const transformer = studio.activeTransformer;
      if (!transformer) {
        onClose();
        return;
      }

      // getBounds() returns coordinates relative to the canvas stage
      const pixiBounds = transformer.getBounds();

      setBounds({
        x: pixiBounds.x,
        y: pixiBounds.y,
        width: pixiBounds.width,
        height: pixiBounds.height,
        rotation: transformer.rotation,
      });
    };

    updatePosition();

    // Sync position if the clip is moved/resized while editing
    studio.on("transforming", updatePosition);
    studio.on("selection:cleared", onClose);

    return () => {
      studio.off("transforming", updatePosition);
      studio.off("selection:cleared", onClose);
    };
  }, [studio, onClose]);

  // Auto-resize height as you type
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text, bounds.width]);

  // Focus and select text on mount
  useEffect(() => {
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 50);
  }, []);

  const handleSave = () => {
    const currentText = textRef.current;
    if (studio && currentText !== clip.text) {
      studio.updateClip(clip.id, { text: currentText } as any);
      studio.updateFrame(studio.currentTime);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  // Visibility toggle: hide the original clip and transformer while editing
  useEffect(() => {
    const originalOpacity = clip.opacity ?? 1;
    clip.opacity = 0;

    // Hide the selection transformer (blue box/handles) to avoid clutter
    const transformer = studio?.activeTransformer;
    const originalTransformerVisible = transformer?.visible ?? true;
    if (transformer) {
      transformer.visible = false;
    }

    if (studio) {
      studio.updateFrame(studio.currentTime);
    }

    return () => {
      // Auto-save on unmount if dirty
      if (studio && textRef.current !== clip.text) {
        studio.updateClip(clip.id, { text: textRef.current } as any);
      }
      clip.opacity = originalOpacity;

      // Restore transformer visibility
      if (transformer) {
        transformer.visible = originalTransformerVisible;
      }

      if (studio) {
        studio.updateFrame(studio.currentTime);
      }
    };
  }, [clip, studio]);

  // Calculate font size scaling
  // Use width ratio for better stability than height
  const style = clip.style || {};
  const logicalFontSize = style.fontSize || 40;

  // Safe scale calculation to avoid "exploding" text
  const logicalWidth = clip.width || 1;
  const currentScale =
    bounds.width > 0 && logicalWidth > 1
      ? bounds.width / logicalWidth
      : studio?.artboard?.scale?.x || 1;

  const scaledFontSize = logicalFontSize * currentScale;

  return (
    <div
      style={{
        position: "absolute",
        left: bounds.x,
        top: bounds.y + 38, // Move slightly up from original position
        width: bounds.width,
        height: "auto",
        minHeight: `${scaledFontSize}px`,
        transform: `rotate(${bounds.rotation}rad)`,
        zIndex: 50,
        pointerEvents: "auto",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "stretch",
        border: "2px solid #00aaff", // Cyan bounding box
        boxSizing: "border-box",
        overflow: "visible",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          const newText = e.target.value;
          setText(newText);
          // Update engine in real-time
          if (studio) {
            studio.updateClip(clip.id, { text: newText } as any);
            studio.updateFrame(studio.currentTime);
          }
        }}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        className="w-full p-0 m-0 resize-none bg-transparent border-none outline-none overflow-hidden whitespace-pre-wrap wrap-break-word block"
        style={{
          color: style.fill || "white",
          fontFamily: style.fontFamily || "sans-serif",
          fontSize: `${scaledFontSize}px`,
          fontWeight: style.fontWeight || "normal",
          lineHeight: style.lineHeight || "1.0", // Tighter line height for editing
          textAlign: (clip as any).textAlign || "center",
          padding: "5px 0", // Small vertical padding to match baseline better
          // Text shadow to match subtle Pixi rendering if possible
          textShadow: style.dropShadow ? "1px 1px 2px rgba(0,0,0,0.3)" : "none",
        }}
      />
    </div>
  );
}
