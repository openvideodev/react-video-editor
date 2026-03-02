"use client";
import { useState, useEffect } from "react";
import { MediaPanel } from "@/components/editor/media-panel";
import { CanvasPanel } from "@/components/editor/canvas-panel";
import { Timeline } from "@/components/editor/timeline";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { usePanelStore } from "@/stores/panel-store";
import Header from "@/components/editor/header";
import { Loading } from "@/components/editor/loading";
import FloatingControl from "@/components/editor/floating-controls/floating-control";
import { Compositor } from "openvideo";
import { WebCodecsUnsupportedModal } from "@/components/editor/webcodecs-unsupported-modal";
import Assistant from "./assistant/assistant";

export default function Editor() {
  const {
    toolsPanel,
    copilotPanel,
    mainContent,
    timeline,
    setToolsPanel,
    setCopilotPanel,
    setMainContent,
    setTimeline,
    isCopilotVisible,
  } = usePanelStore();

  const [isReady, setIsReady] = useState(false);
  const [isWebCodecsSupported, setIsWebCodecsSupported] = useState(true);

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
        <div className="absolute inset-0 z-50">
          <Loading />
        </div>
      )}
      <Header />
      <div className="flex-1 min-h-0 min-w-0 px-2 pb-2">
        <ResizablePanelGroup
          direction="horizontal"
          className="h-full w-full gap-0"
        >
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

          <ResizableHandle className="bg-transparent w-1.5" />

          {/* Middle Column: Preview + Timeline */}
          <ResizablePanel
            defaultSize={
              isCopilotVisible
                ? 100 - copilotPanel - toolsPanel
                : 100 - toolsPanel
            }
            minSize={40}
            className="min-w-0 min-h-0"
          >
            <ResizablePanelGroup
              direction="vertical"
              className="h-full w-full gap-0"
            >
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

              <ResizableHandle className="bg-transparent !h-1.5" />

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
          {isCopilotVisible && (
            <>
              <ResizableHandle className="bg-transparent w-1.5" />
              {/* Right Column: Chat Copilot */}
              <ResizablePanel
                defaultSize={copilotPanel}
                minSize={15}
                maxSize={40}
                onResize={setCopilotPanel}
                className="max-w-7xl relative overflow-visible! bg-card min-w-0"
              >
                {/* Chat copilot */}
                <Assistant />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* WebCodecs Support Check Modal */}
      <WebCodecsUnsupportedModal open={!isWebCodecsSupported} />
    </div>
  );
}
