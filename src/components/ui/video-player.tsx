"use client";

import { cva, type VariantProps } from "class-variance-authority";
import {
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const videoPlayerVariants = cva(
  "group relative w-full touch-manipulation overflow-hidden rounded-card bg-black",
  {
    variants: {
      size: {
        sm: "max-w-md",
        default: "max-w-2xl",
        lg: "max-w-4xl",
        full: "w-full",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface VideoPlayerProps
  extends
    Omit<React.VideoHTMLAttributes<HTMLVideoElement>, "controls">,
    VariantProps<typeof videoPlayerVariants> {
  src: string;
  poster?: string;
  showControls?: boolean;
  showCenterButton?: boolean;
  showBottomControls?: boolean;
  objectFit?: "cover" | "contain";
  autoHide?: boolean;
  className?: string;
}

const VideoPlayer = React.forwardRef<HTMLVideoElement, VideoPlayerProps>(
  (
    {
      className,
      size,
      src,
      poster,
      showControls = true,
      showCenterButton = true,
      showBottomControls = true,
      objectFit = "cover",
      autoHide = true,
      ...props
    },
    ref,
  ) => {
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [currentTime, setCurrentTime] = React.useState(0);
    const [duration, setDuration] = React.useState(0);
    const [volume, setVolume] = React.useState(1);
    const [isMuted, setIsMuted] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [showControlsState, setShowControlsState] = React.useState(true);

    const videoRef = React.useRef<HTMLVideoElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const hideControlsTimeoutRef = React.useRef<number | null>(null);
    const liveRef = React.useRef<HTMLDivElement>(null);

    React.useImperativeHandle(ref, () => videoRef.current as HTMLVideoElement);

    const formatTime = (time: number) => {
      const hours = Math.floor(time / 3600);
      const minutes = Math.floor((time % 3600) / 60);
      const seconds = Math.floor(time % 60);
      if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
      }
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const announce = React.useCallback((msg: string) => {
      if (!liveRef.current) return;
      liveRef.current.textContent = msg;
    }, []);

    const resetHideControlsTimeout = React.useCallback(() => {
      if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
      if (autoHide && isPlaying) {
        hideControlsTimeoutRef.current = window.setTimeout(() => {
          setShowControlsState(false);
        }, 3000);
      }
    }, [autoHide, isPlaying]);

    const togglePlay = React.useCallback(() => {
      const el = videoRef.current;
      if (!el) return;
      if (el.paused) {
        el.play();
        announce("Playing");
      } else {
        el.pause();
        announce("Paused");
      }
    }, [announce]);

    const toggleMute = React.useCallback(() => {
      const el = videoRef.current;
      if (!el) return;
      el.muted = !el.muted;
      setIsMuted(el.muted);
      announce(el.muted ? "Muted" : "Unmuted");
    }, [announce]);

    const handleVolumeChange = React.useCallback((newVolume: number) => {
      const el = videoRef.current;
      setVolume(newVolume);
      if (el) {
        el.volume = newVolume;
        setIsMuted(newVolume === 0);
      }
    }, []);

    const handleSeek = React.useCallback((newTime: number) => {
      setCurrentTime(newTime);
      const el = videoRef.current;
      if (el) el.currentTime = newTime;
    }, []);

    const toggleFullscreen = React.useCallback(() => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setIsFullscreen(false);
      } else {
        containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      }
    }, []);

    const skip = React.useCallback(
      (seconds: number) => {
        const el = videoRef.current;
        if (!el) return;
        const next = Math.max(0, Math.min(el.duration || 0, (el.currentTime || 0) + seconds));
        el.currentTime = next;
        setCurrentTime(next);
        announce(`${seconds > 0 ? "Forward" : "Back"} ${Math.abs(seconds)} seconds`);
      },
      [announce],
    );

    const handleMouseMove = () => {
      setShowControlsState(true);
      resetHideControlsTimeout();
    };

    React.useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      const onLoadedMetadata = () => setDuration(video.duration || 0);
      const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
      const onPlay = () => {
        setIsPlaying(true);
        resetHideControlsTimeout();
      };
      const onPause = () => {
        setIsPlaying(false);
        setShowControlsState(true);
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
      };
      const onVol = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
      };
      video.addEventListener("loadedmetadata", onLoadedMetadata);
      video.addEventListener("timeupdate", onTimeUpdate);
      video.addEventListener("play", onPlay);
      video.addEventListener("pause", onPause);
      video.addEventListener("volumechange", onVol);
      return () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("timeupdate", onTimeUpdate);
        video.removeEventListener("play", onPlay);
        video.removeEventListener("pause", onPause);
        video.removeEventListener("volumechange", onVol);
        if (hideControlsTimeoutRef.current) window.clearTimeout(hideControlsTimeoutRef.current);
      };
    }, [autoHide, isPlaying, resetHideControlsTimeout]);

    React.useEffect(() => {
      const onFs = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", onFs);
      return () => document.removeEventListener("fullscreenchange", onFs);
    }, []);

    React.useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (!(containerRef.current && containerRef.current.contains(document.activeElement))) {
          return;
        }

        switch (e.key) {
          case " ":
          case "k":
            e.preventDefault();
            togglePlay();
            break;
          case "m":
            e.preventDefault();
            toggleMute();
            break;
          case "f":
            e.preventDefault();
            toggleFullscreen();
            break;
          case "ArrowLeft":
            e.preventDefault();
            skip(-10);
            break;
          case "ArrowRight":
            e.preventDefault();
            skip(10);
            break;
          case "ArrowUp":
            e.preventDefault();
            handleVolumeChange(Math.min(1, Math.round((volume + 0.1) * 100) / 100));
            break;
          case "ArrowDown":
            e.preventDefault();
            handleVolumeChange(Math.max(0, Math.round((volume - 0.1) * 100) / 100));
            break;
          default:
            break;
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [togglePlay, toggleMute, toggleFullscreen, skip, volume, handleVolumeChange]);

    const progressPct = duration ? (currentTime / duration) * 100 : 0;
    const volumePct = (isMuted ? 0 : volume) * 100;

    return (
      <div
        aria-label="Video player"
        className={cn(
          videoPlayerVariants({ size }),
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-safe:duration-200 motion-reduce:animate-none",
          className,
        )}
        onMouseLeave={() => autoHide && isPlaying && setShowControlsState(false)}
        onMouseMove={handleMouseMove}
        ref={containerRef}
        role="region"
        tabIndex={0}
      >
        <div aria-atomic="true" aria-live="polite" className="sr-only" ref={liveRef} />
        <video
          aria-label="Video"
          className={cn(
            "h-full w-full",
            objectFit === "contain" ? "object-contain" : "object-cover",
          )}
          onClick={togglePlay}
          poster={poster}
          ref={videoRef}
          src={src}
          {...props}
        />
        {showControls && (
          <>
            {showCenterButton && (
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity motion-safe:duration-200",
                  !isPlaying || showControlsState ? "opacity-100" : "opacity-0",
                )}
              >
                <button
                  aria-label={isPlaying ? "Pause" : "Play"}
                  className="pointer-events-auto flex size-16 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30 motion-safe:duration-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePlay();
                  }}
                  type="button"
                >
                  {isPlaying ? (
                    <Pause aria-hidden="true" className="size-6" />
                  ) : (
                    <Play aria-hidden="true" className="size-6" />
                  )}
                </button>
              </div>
            )}

            {showBottomControls && isPlaying && (
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent transition-opacity motion-safe:duration-200",
                  showControlsState ? "opacity-100" : "opacity-0",
                )}
              >
                <div className="pointer-events-auto flex flex-col gap-2 p-4">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <span aria-live="off" className="min-w-0 font-mono text-xs">
                      {formatTime(currentTime)}
                    </span>
                    <div className="group/progress relative flex-1">
                      <label className="sr-only" htmlFor="video-progress">
                        Seek
                      </label>
                      <input
                        aria-label="Seek"
                        aria-valuemax={Math.max(0, Math.floor(duration))}
                        aria-valuemin={0}
                        aria-valuenow={Math.floor(currentTime)}
                        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 focus-visible:outline-none motion-safe:duration-200 [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white group-hover/progress:[&::-webkit-slider-thumb]:scale-125"
                        id="video-progress"
                        max={duration || 0}
                        min={0}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSeek(Number.parseFloat(e.target.value));
                        }}
                        role="slider"
                        style={{
                          background: `linear-gradient(to right, #ffffff 0%, #ffffff ${progressPct}%, rgba(255,255,255,0.3) ${progressPct}%, rgba(255,255,255,0.3) 100%)`,
                        }}
                        type="range"
                        value={currentTime}
                      />
                    </div>
                    <span className="min-w-0 font-mono text-xs">{formatTime(duration)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        aria-label="Skip back 10 seconds"
                        className="rounded-md p-2 text-white transition-colors hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          skip(-10);
                        }}
                        type="button"
                      >
                        <SkipBack aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        aria-label={isPlaying ? "Pause" : "Play"}
                        className="rounded-md p-2 text-white transition-colors hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePlay();
                        }}
                        type="button"
                      >
                        {isPlaying ? (
                          <Pause aria-hidden="true" className="size-4" />
                        ) : (
                          <Play aria-hidden="true" className="size-4" />
                        )}
                      </button>
                      <button
                        aria-label="Skip forward 10 seconds"
                        className="rounded-md p-2 text-white transition-colors hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          skip(10);
                        }}
                        type="button"
                      >
                        <SkipForward aria-hidden="true" className="size-4" />
                      </button>
                      <div className="group/volume flex items-center gap-2">
                        <button
                          aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                          className="rounded-md p-2 text-white transition-colors hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                          type="button"
                        >
                          {isMuted || volume === 0 ? (
                            <VolumeX aria-hidden="true" className="size-4" />
                          ) : (
                            <Volume2 aria-hidden="true" className="size-4" />
                          )}
                        </button>
                        <div className="w-0 overflow-hidden transition-all group-hover/volume:w-20 motion-safe:duration-200">
                          <label className="sr-only" htmlFor="video-volume">
                            Volume
                          </label>
                          <input
                            aria-label="Volume"
                            aria-valuemax={100}
                            aria-valuemin={0}
                            aria-valuenow={Math.round(volumePct)}
                            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/30 focus-visible:outline-none [&::-webkit-slider-thumb]:size-2 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                            id="video-volume"
                            max={1}
                            min={0}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleVolumeChange(Number.parseFloat(e.target.value));
                            }}
                            role="slider"
                            step={0.1}
                            style={{
                              background: `linear-gradient(to right, #ffffff 0%, #ffffff ${volumePct}%, rgba(255,255,255,0.3) ${volumePct}%, rgba(255,255,255,0.3) 100%)`,
                            }}
                            type="range"
                            value={isMuted ? 0 : volume}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                        className="rounded-md p-2 text-white transition-colors hover:bg-white/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFullscreen();
                        }}
                        type="button"
                      >
                        {isFullscreen ? (
                          <Minimize aria-hidden="true" className="size-4" />
                        ) : (
                          <Maximize aria-hidden="true" className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  },
);

VideoPlayer.displayName = "VideoPlayer";

export { VideoPlayer };
