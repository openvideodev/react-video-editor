import { Canvas, Control, FabricObject, util } from "fabric";

export function drawVerticalLine(
  this: Control,
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject,
) {
  const canvas = fabricObject.canvas as Canvas;
  if (!canvas) return;

  ctx.save();
  ctx.beginPath();

  const xOffset = 0;

  ctx.translate(left + xOffset, top);

  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineCap = "round";

  // Draw a vertical line handle (e.g. 16px height)
  const height = 12;
  ctx.moveTo(0, -height / 2);
  ctx.lineTo(0, height / 2);
  ctx.stroke();

  ctx.restore();
}
