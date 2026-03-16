export interface IBoxShadow {
  color: string;
  x: number;
  y: number;
  blur: number;
}
export interface ICaptionsControlProps {
  type?: "word" | "lines";
  appearedColor: string;
  activeColor: string;
  activeFillColor: string;
  color: string;
  isKeywordColor?: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  boxShadow?: IBoxShadow;
  animation?: string | string[];
  fontFamily?: string;
  fontUrl?: string;
  textTransform?: string;
  previewUrl?: string;
  textAlign?: string;
  preservedColorKeyWord?: boolean;
  wordAnimation?: {
    type: "scale" | "opacity";
    application: "active" | "keyword" | "none";
    value: number;
    mode?: "static" | "dynamic";
  };
  textBoxStyle?: {
    style?: "tiktok" | "none";
    textAlign?: "left" | "center" | "right" | "";
    maxLines?: number;
    borderRadius?: number;
    horizontalPadding?: number;
  };
}
