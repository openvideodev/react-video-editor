"use client";

import { TabBar } from "./tabbar";
import { useMediaPanelStore, type Tab } from "./store";
import { Separator } from "@/components/ui/separator";
import PanelUploads from "./panel/uploads";
import PanelImages from "./panel/images";
import PanelVideos from "./panel/videos";
import PanelEffect from "./panel/effects";
import PanelTransition from "./panel/transition";
import PanelText from "./panel/text";
import PanelCaptions from "./panel/captions";
import PanelMusic from "./panel/music";
import PanelVoiceovers from "./panel/voiceovers";
import PanelSFX from "./panel/sfx";
import PanelElements from "./panel/elements";
import { PropertiesPanel } from "../properties-panel";
import type { IClip } from "@openvideo/engine-pixi";
import { useEffect, useState } from "react";
import { useStudioStore } from "@/stores/studio-store";

const viewMap: Record<Tab, React.ReactNode> = {
  uploads: <PanelUploads />,
  images: <PanelImages />,
  videos: <PanelVideos />,
  music: <PanelMusic />,
  voiceovers: <PanelVoiceovers />,
  sfx: <PanelSFX />,
  text: <PanelText />,
  captions: <PanelCaptions />,
  transitions: <PanelTransition />,
  effects: <PanelEffect />,
  elements: <PanelElements />,
};

export function MediaPanel() {
  const { activeTab } = useMediaPanelStore();
  const { studio, selectedClips } = useStudioStore();
  const [showProperties, setShowProperties] = useState(false);

  // Show properties panel when a clip is selected, unless we're on a specific tab that should stay visible
  useEffect(() => {
    if (selectedClips.length > 0) {
      setShowProperties(true);
    } else {
      setShowProperties(false);
    }
  }, [selectedClips]);

  useEffect(() => {
    if (activeTab) {
      setShowProperties(false);
    }
  }, [activeTab]);

  return (
    <div className="h-full flex flex-col bg-card rounded-sm overflow-hidden w-full border-r border-border">
      <div className="flex-none">
        <TabBar />
      </div>
      <Separator orientation="horizontal" />
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        {selectedClips.length > 0 && showProperties ? (
          <PropertiesPanel selectedClips={selectedClips} />
        ) : (
          <>{viewMap[activeTab]}</>
        )}
      </div>
    </div>
  );
}
