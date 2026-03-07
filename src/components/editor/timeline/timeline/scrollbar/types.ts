export type ScrollbarsProps = {
  fill?: string;
  stroke?: string;
  lineWidth?: number;
  hideX?: boolean;
  hideY?: boolean;
  scrollbarMinWidth?: number;
  scrollbarSize?: number;
  scrollSpace?: number;
  padding?: number;
  extraMarginX?: number;
  extraMarginY?: number;
  offsetX?: number;
  offsetY?: number;
  scrollbarWidth?: number;
  scrollbarColor?: string;
  onViewportChange?: (v: { left: number; scrollX: number; scrollY: number }) => void;
  onZoom?: (zoom: number) => void;
};

export type ScrollbarProps = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
export type ScrollbarXProps = Pick<ScrollbarProps, "left" | "right">;

export type ScrollbarYProps = Pick<ScrollbarProps, "top" | "bottom">;
