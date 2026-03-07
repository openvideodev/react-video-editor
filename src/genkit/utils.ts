import { Part } from "genkit";
import { ImportAsset } from "./type";

// Context building is handled directly in the flow for better control

export function buildAssetInstruction(asset: ImportAsset, isSelected: boolean) {
  const {
    assetId,
    assetType, // 'video' | 'audio' | 'image' | 'text'
    display,
    trim,
    text,
    label,
  } = asset;

  const name = label || assetId;
  const tag = isSelected ? "[SELECTED]" : "[EXISTING]";

  // Timeline (ms → s)
  const displayFrom = (display.from / 1000).toFixed(2);
  const displayTo = (display.to / 1000).toFixed(2);

  let instruction = `
ASSET_CONTEXT ${tag}
- id: ${assetId}
- name: "${name}"
- type: ${assetType}
- timeline: appears from ${displayFrom}s to ${displayTo}s
`.trim();

  // TEXT
  if (assetType === "text" && text) {
    instruction += `
- content: "${text}"
- role: on-screen text element
`.trim();
  }

  // VIDEO / AUDIO
  if ((assetType === "video" || assetType === "audio") && trim) {
    const trimFrom = (trim.from / 1000).toFixed(2);
    const trimTo = (trim.to / 1000).toFixed(2);

    instruction += `
- source_usage: uses source segment from ${trimFrom}s to ${trimTo}s
- role: time-based media asset
`.trim();
  }

  // IMAGE
  if (assetType === "image") {
    instruction += `
- role: static visual element
- behavior: displayed as a still image during its timeline range
`.trim();
  }

  instruction += `
- note: this asset is referenced by its id (${assetId}) in the media content provided to you
`.trim();

  return instruction;
}

export function buildMessageContent(assets: ImportAsset[]): Part[] {
  const sortedAssets = assets.slice().sort((a, b) => a.display.from - b.display.from);
  const content: Part[] = [];

  sortedAssets.forEach((asset) => {
    //const name = asset.label || asset.assetId;

    if (asset.assetType === "text" && asset.text) {
      content.push({ text: asset.text });
    } else if (asset.assetType === "video") {
      const trimFrom = asset.trim ? (asset.trim.from / 1000).toFixed(2) : "0.00";
      const trimTo = asset.trim ? (asset.trim.to / 1000).toFixed(2) : "full";
      content.push({
        text: `Video id: ${asset.assetId}. Use only the segment from ${trimFrom} to ${trimTo}`,
      });
      if (asset.url) {
        content.push({ media: { contentType: "video/mp4", url: asset.url } });
      }
    } else if (asset.assetType === "audio") {
      const trimFrom = asset.trim ? (asset.trim.from / 1000).toFixed(2) : "0.00";
      const trimTo = asset.trim ? (asset.trim.to / 1000).toFixed(2) : "full";
      content.push({
        text: `Audio id: ${asset.assetId}. Use only the segment from ${trimFrom} to ${trimTo}`,
      });
      if (asset.url) {
        content.push({ media: { contentType: "audio/mp3", url: asset.url } });
      }
    } else if (asset.assetType === "image") {
      content.push({
        text: `Image id: ${asset.assetId}. Display from ${(asset.display.from / 1000).toFixed(2)}s to ${(asset.display.to / 1000).toFixed(2)}s`,
      });
      if (asset.url) {
        content.push({ media: { url: asset.url } });
      }
    }
  });

  return content;
}
