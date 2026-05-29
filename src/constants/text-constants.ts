export interface TextElement {
  id: string;
  type: string;
  name: string;
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  textAlign: string;
  fontWeight: string;
  fontStyle: string;
  textDecoration: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  duration: number;
  startTime: number;
  trimStart: number;
  trimEnd: number;
}

export const DEFAULT_TEXT_ELEMENT: Omit<TextElement, "id"> = {
  type: "text",
  name: "Text",
  content: "Default Text",
  fontSize: 48,
  fontFamily: "Arial",
  color: "#ffffff",
  backgroundColor: "transparent",
  textAlign: "center",
  fontWeight: "normal",
  fontStyle: "normal",
  textDecoration: "none",
  x: 0,
  y: 0,
  rotation: 0,
  opacity: 1,
  duration: 5_000_000,
  startTime: 0,
  trimStart: 0,
  trimEnd: 0,
};
