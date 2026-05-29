"use client";
import { useState, useEffect } from "react";
import { MediaPanel } from "@/components/editor/media-panel";
import { CanvasPanel } from "@/components/editor/canvas-panel";
import Timeline from "@/components/editor/timeline";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { usePanelStore } from "@/stores/panel-store";
import Header from "@/components/editor/header";
import { Loading } from "@/components/editor/loading";
import FloatingControl from "@/components/editor/floating-controls/floating-control";
import { Compositor } from "@openvideo/engine-pixi";
import { WebCodecsUnsupportedModal } from "@/components/editor/webcodecs-unsupported-modal";
import { type IProject } from "@openvideo/core";
import { core } from "@/lib/project";

export default function Editor({
  initialDesign,
}: {
  isDataLoading?: boolean;
  initialDesign?: IProject;
}) {
  const { toolsPanel, mainContent, timeline, setToolsPanel, setMainContent, setTimeline } =
    usePanelStore();

  const [isReady, setIsReady] = useState(false);
  const [isWebCodecsSupported, setIsWebCodecsSupported] = useState(true);

  useEffect(() => {
    if (initialDesign) {
      core.project.import(initialDesign);
    }
  }, [initialDesign]);

  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = await Compositor.isSupported();
      setIsWebCodecsSupported(isSupported);
    };
    checkSupport();
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {!isReady && (
        <div className="absolute inset-0 z-100">
          <Loading />
        </div>
      )}
      <Header />
      <div className="flex-1 min-h-0 min-w-0">
        <ResizablePanelGroup direction="horizontal" className="h-full w-full gap-0">
          {/* Left Column: Media Panel */}
          <ResizablePanel
            defaultSize={toolsPanel}
            minSize={15}
            maxSize={40}
            onResize={setToolsPanel}
            className="max-w-7xl relative overflow-visible! bg-card min-w-0"
          >
            <MediaPanel />
            <FloatingControl />
          </ResizablePanel>

          <ResizableHandle className="bg-border/90" />

          {/* Middle Column: Preview + Timeline */}
          <ResizablePanel defaultSize={100 - toolsPanel} minSize={40} className="min-w-0 min-h-0">
            <ResizablePanelGroup direction="vertical" className="h-full w-full gap-0">
              {/* Canvas Panel */}
              <ResizablePanel
                defaultSize={mainContent}
                minSize={30}
                maxSize={85}
                onResize={setMainContent}
                className="min-h-0"
              >
                <CanvasPanel
                  onReady={() => {
                    setIsReady(true);
                  }}
                />
              </ResizablePanel>

              <ResizableHandle className="bg-border/90" />

              {/* Timeline Panel */}
              <ResizablePanel
                defaultSize={timeline}
                minSize={15}
                maxSize={70}
                onResize={setTimeline}
                className="min-h-0"
              >
                <Timeline />
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* WebCodecs Support Check Modal */}
      <WebCodecsUnsupportedModal open={!isWebCodecsSupported} />
    </div>
  );
}
