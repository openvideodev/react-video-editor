import { Button } from "@/components/ui/button";
import { frameToTimeString, timeToString } from "../utils/time";
import { SquareSplitHorizontal, Trash2, ZoomIn, ZoomOut, Copy, Scissors } from "lucide-react";
import { useClipActions } from "../studio-context-menu";
import { useTimelineOffsetX } from "../hooks/use-timeline-offset";
import { useStore } from "zustand";
import { core, projectStore } from "@/lib/project";
import { useStudioStore } from "@/stores/studio-store";
import { useEffect, useState } from "react";
import { ITimelineScaleState } from "@openvideo/timeline";
import { Slider } from "@/components/ui/slider";
import { getFitZoomLevel } from "../utils/timeline";

const IconPlayerPlayFilled = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} viewBox="0 0 24 24" fill="currentColor">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M6 4v16a1 1 0 0 0 1.524 .852l13 -8a1 1 0 0 0 0 -1.704l-13 -8a1 1 0 0 0 -1.524 .852z" />
  </svg>
);

const IconPlayerPauseFilled = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} viewBox="0 0 24 24" fill="currentColor">
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M9 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
    <path d="M17 4h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h2a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2z" />
  </svg>
);
const IconPlayerSkipBack = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M20 5v14l-12 -7z" />
    <path d="M4 5l0 14" />
  </svg>
);

const IconPlayerSkipForward = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M4 5v14l12 -7z" />
    <path d="M20 5l0 14" />
  </svg>
);
const Header = ({
  scale,
  setScale,
}: {
  scale: ITimelineScaleState;
  setScale: (scale: ITimelineScaleState) => void;
}) => {
  const currentTimeUs = useStore(projectStore, (s) => s.currentTime);
  const isPlaying = useStore(projectStore, (s) => s.isPlaying);
  const durationUs = useStore(projectStore, (s) => s.settings.duration);
  const currentTime = currentTimeUs / 1_000_000;
  const duration = durationUs / 1_000_000;

  const { studio } = useStudioStore();
  const fps = useStore(projectStore, (s) => s.settings.fps);
  const { selectedClip, isLocked, handleDuplicate, handleDelete } = useClipActions();

  const handleSplit = () => {
    core.clip.split(currentTimeUs);
  };

  const changeScale = (newScale: ITimelineScaleState) => {
    setScale(newScale);
  };

  const handlePlay = () => core.play();
  const handlePause = () => core.pause();
  const handleSeek = (time: number) => core.seek(time * 1_000_000);

  return (
    <div
      id="timeline-header"
      style={{
        position: "relative",
        height: "50px",
        flex: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          height: 50,
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            height: 36,
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 260px 1fr",
            alignItems: "center",
          }}
        >
          <div className="flex px-2">
            <Button
              disabled={!selectedClip || isLocked}
              onClick={handleDelete}
              variant={"ghost"}
              size={"sm"}
              className="flex items-center gap-1 px-2"
            >
              <Trash2 size={14} />
            </Button>

            <Button
              disabled={!selectedClip || isLocked}
              onClick={handleSplit}
              variant={"ghost"}
              size={"sm"}
              className="flex items-center gap-1 px-2"
            >
              <Scissors size={15} />
            </Button>
            <Button
              disabled={!selectedClip || isLocked}
              onClick={handleDuplicate}
              variant={"ghost"}
              size={"sm"}
              className="flex items-center gap-1 px-2"
            >
              <Copy size={15} />
            </Button>
          </div>
          <div className="flex items-center justify-center">
            <div>
              <Button
                className="hidden lg:inline-flex"
                onClick={() => handleSeek(0)}
                variant={"ghost"}
                size={"icon"}
              >
                <IconPlayerSkipBack size={14} />
              </Button>
              <Button
                onClick={() => {
                  if (isPlaying) {
                    return handlePause();
                  }
                  handlePlay();
                }}
                variant={"ghost"}
                size={"icon"}
              >
                {isPlaying ? (
                  <IconPlayerPauseFilled size={14} />
                ) : (
                  <IconPlayerPlayFilled size={14} />
                )}
              </Button>
              <Button
                className="hidden lg:inline-flex"
                onClick={() => handleSeek(duration)}
                variant={"ghost"}
                size={"icon"}
              >
                <IconPlayerSkipForward size={14} />
              </Button>
            </div>
            <div
              className="text-xs font-light flex"
              style={{
                alignItems: "center",
                gridTemplateColumns: "54px 4px 54px",
                paddingTop: "2px",
                justifyContent: "center",
              }}
            >
              <div
                className="font-medium text-zinc-200"
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
                data-current-time={currentTime}
                id="video-current-time"
              >
                {frameToTimeString({ frame: Math.floor(currentTime * fps) }, { fps })}
              </div>
              <span className="px-1">|</span>
              <div
                className="text-muted-foreground hidden lg:block"
                style={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                {timeToString({ time: durationUs })}
              </div>
            </div>
          </div>

          <ZoomControl scale={scale} onChangeTimelineScale={changeScale} duration={duration} />
        </div>
      </div>
    </div>
  );
};

const ZoomControl = ({
  scale,
  onChangeTimelineScale,
  duration,
}: {
  scale: ITimelineScaleState;
  onChangeTimelineScale: (scale: ITimelineScaleState) => void;
  duration: number;
}) => {
  const [localValue, setLocalValue] = useState(scale.zoom);
  const timelineOffsetX = useTimelineOffsetX();

  useEffect(() => {
    setLocalValue(scale.zoom);
  }, [scale.zoom]);

  const onZoomOutClick = () => {
    const newZoom = Math.max(0.1, scale.zoom - 0.15);
    onChangeTimelineScale({ ...scale, zoom: newZoom });
  };

  const onZoomInClick = () => {
    const newZoom = Math.min(10, scale.zoom + 0.15);
    onChangeTimelineScale({ ...scale, zoom: newZoom });
  };

  const onZoomFitClick = () => {
    const fitZoom = getFitZoomLevel(duration, scale.zoom, timelineOffsetX);
    onChangeTimelineScale(fitZoom);
  };

  return (
    <div className="flex items-center justify-end">
      <div className="flex lg:border-l pl-4 pr-2">
        <Button size={"icon"} variant={"ghost"} onClick={onZoomOutClick}>
          <ZoomOut size={16} />
        </Button>
        <Slider
          className="w-28 hidden lg:flex"
          value={[localValue]}
          min={0.1}
          max={10}
          step={0.01}
          onValueChange={(e) => {
            const newZoom = e[0];
            setLocalValue(newZoom);
            onChangeTimelineScale({ ...scale, zoom: newZoom });
          }}
        />
        <Button size={"icon"} variant={"ghost"} onClick={onZoomInClick}>
          <ZoomIn size={16} />
        </Button>
        <Button onClick={onZoomFitClick} variant={"ghost"} size={"icon"}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M20 8V6h-2q-.425 0-.712-.288T17 5t.288-.712T18 4h2q.825 0 1.413.588T22 6v2q0 .425-.288.713T21 9t-.712-.288T20 8M2 8V6q0-.825.588-1.412T4 4h2q.425 0 .713.288T7 5t-.288.713T6 6H4v2q0 .425-.288.713T3 9t-.712-.288T2 8m18 12h-2q-.425 0-.712-.288T17 19t.288-.712T18 18h2v-2q0-.425.288-.712T21 15t.713.288T22 16v2q0 .825-.587 1.413T20 20M4 20q-.825 0-1.412-.587T2 18v-2q0-.425.288-.712T3 15t.713.288T4 16v2h2q.425 0 .713.288T7 19t-.288.713T6 20zm2-6v-4q0-.825.588-1.412T8 8h8q.825 0 1.413.588T18 10v4q0 .825-.587 1.413T16 16H8q-.825 0-1.412-.587T6 14"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
};

export default Header;
