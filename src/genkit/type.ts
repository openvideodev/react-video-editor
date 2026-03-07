interface TimeRange {
  from: number;
  to: number;
}

export interface ImportAsset {
  assetId: string;
  type: "import";
  assetType: string; // 'video', 'text', 'img', 'audio', etc.
  text: string;
  url: string;
  label: string;
  trackId: string;
  display: TimeRange;
  trim?: TimeRange;
}
