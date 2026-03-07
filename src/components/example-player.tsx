"use client";
import { useEffect, useRef, useState } from "react";
import { Studio, type ProjectJSON } from "openvideo";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExamplePlayerProps {
  project?: ProjectJSON;
  onLoad?: () => void;
  onReady?: (studio: Studio) => void;
}

export function ExamplePlayer({ project, onLoad, onReady }: ExamplePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<Studio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const studio = new Studio({
      width: 1080,
      height: 1920,
      fps: 30,
      canvas: canvasRef.current,
      interactivity: false,
    });

    studioRef.current = studio;
    onReady?.(studio);

    studio.ready.then(() => {
      if (project) {
        studio.loadFromJSON(project).then(() => {
          setDuration(studio.maxDuration);
          onLoad?.();
        });
      }
    });

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = ({ currentTime }: { currentTime: number }) => {
      setCurrentTime(currentTime);
    };

    studio.on("play", onPlay);
    studio.on("pause", onPause);
    studio.on("currentTime", onTimeUpdate);

    // Initial layout
    studio.updateArtboardLayout();

    const resizeObserver = new ResizeObserver(() => {
      studio.updateArtboardLayout();
    });

    if (canvasRef.current.parentElement) {
      resizeObserver.observe(canvasRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
      studio.destroy();
      studioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (studioRef.current && project) {
      studioRef.current.loadFromJSON(project).then(() => {
        setDuration(studioRef.current?.maxDuration || 0);
        onLoad?.();
      });
    }
  }, [project]);

  const togglePlay = () => {
    if (!studioRef.current) return;
    if (isPlaying) {
      studioRef.current.pause();
    } else {
      studioRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!studioRef.current) return;
    const time = parseInt(e.target.value);
    studioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return (
    <div className="flex flex-col  w-full max-w-xs mx-auto overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="aspect-[9/16] w-full bg-black/5 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="px-6 py-4 flex flex-col gap-3 bg-muted/30 border-t border-border">
        {/* Seek Bar */}
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary mt-2"
        />

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="h-10 w-10 text-foreground hover:bg-background"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current" />
            ) : (
              <Play className="h-5 w-5 fill-current" />
            )}
          </Button>

          <div className="text-xs font-mono text-muted-foreground select-none">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(microseconds: number) {
  const totalSeconds = Math.floor(microseconds / 1000000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((microseconds % 1000000) / 10000);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}
