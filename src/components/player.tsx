"use client";

import { RefObject } from "react";

interface PlayerProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

export function Player({ canvasRef }: PlayerProps) {
  return (
    <div
      id="preview-container"
      style={{
        margin: "20px 0",
        border: "2px solid #333",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#333",
        height: "70vh", // Fixed height or max-height? User said "canvas should take full size".
        // Original was maxHeight 70vh. Let's make it fill available space or fixed height so resize works?
        // User request: "canvas should take full size of preview container".
        // Container needs a size.
        width: "100%",
        position: "relative", // Ensure relative positioning for absolute children if needed
        overflow: "hidden", // Hide anything outside (though canvas masks it too)
      }}
    >
      <canvas
        ref={canvasRef}
        id="preview-canvas"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          // Remove aspectRatio, let it fill container
        }}
      />
    </div>
  );
}
