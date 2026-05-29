import { FabricObject, util } from "@openvideo/timeline";

export function drawVerticalLine(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _: {},
  fabricObject: FabricObject,
) {
  const cSize = 12;
  const cSizeBy2 = cSize / 2;

  ctx.save();
  ctx.translate(left, top);
  ctx.rotate(util.degreesToRadians(90 + fabricObject.angle));

  // Draw the yellow outline
  ctx.lineWidth = 6; // Total width for the outline (4 + 2)
  ctx.lineCap = "round";
  ctx.strokeStyle = "white"; // Yellow color for the outline
  ctx.beginPath();
  ctx.moveTo(-cSizeBy2, 0);
  ctx.lineTo(cSizeBy2, 0);
  ctx.stroke();

  // Draw the main line
  ctx.lineWidth = 4; // Width of the main line
  ctx.strokeStyle = "black"; // Color of the main line
  ctx.beginPath();
  ctx.moveTo(-cSizeBy2, 0);
  ctx.lineTo(cSizeBy2, 0);
  ctx.stroke();

  ctx.restore();
}

export function drawVerticalLeftIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject,
) {
  const width = 6; // Handle width
  const height = fabricObject.height;
  const borderRadius = 2;

  ctx.save();
  // Move inside: left is the edge, so we move right by width/2
  ctx.translate(left + width / 2, top);
  ctx.rotate(util.degreesToRadians(fabricObject.angle));

  // Draw transparent rectangle
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, borderRadius);
  ctx.fill();

  // Draw centered vertical line
  const lineWidth = 2;
  const lineHeight = 14;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(-lineWidth / 2, -lineHeight / 2, lineWidth, lineHeight, lineWidth / 2);
  ctx.fill();

  ctx.restore();
}

export function drawVerticalRightIcon(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  styleOverride: any,
  fabricObject: FabricObject,
) {
  const width = 6; // Handle width
  const height = fabricObject.height;
  const borderRadius = 2;

  ctx.save();
  // Move inside: left is the edge, so we move left by width/2
  ctx.translate(left - width / 2, top);
  ctx.rotate(util.degreesToRadians(fabricObject.angle));

  // Draw transparent rectangle
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.beginPath();
  ctx.roundRect(-width / 2, -height / 2, width, height, borderRadius);
  ctx.fill();

  // Draw centered vertical line
  const lineWidth = 2;
  const lineHeight = 14;
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.roundRect(-lineWidth / 2, -lineHeight / 2, lineWidth, lineHeight, lineWidth / 2);
  ctx.fill();

  ctx.restore();
}
