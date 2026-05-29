import { Button } from "@/components/ui/button";
import { IconPlayerPause, IconPlayerPlay, IconMusic } from "@tabler/icons-react";
import { useRef, useState, useEffect } from "react";
import Draggable from "@/components/shared/draggable";
import { useIsDraggingOverTimeline } from "@/hooks/use-is-dragging-over-timeline";

export const AudioItem = ({
  item,
  onAdd,
  playingId,
  setPlayingId,
}: {
  item: any;
  onAdd: (url: string, name: string) => void;
  playingId: string | null;
  setPlayingId: (id: string | null) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [duration, setDuration] = useState<string>("--:--");
  const isPlaying = playingId === item.id;
  const isDraggingOverTimeline = useIsDraggingOverTimeline();

  useEffect(() => {
    if (isPlaying) {
      audioRef.current?.play();
    } else {
      audioRef.current?.pause();
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setPlayingId(null);
    } else {
      setPlayingId(item.id);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const seconds = Math.round(audioRef.current.duration);
      const min = Math.floor(seconds / 60);
      const sec = seconds % 60;
      setDuration(`${min}:${sec.toString().padStart(2, "0")}`);
    }
  };

  return (
    <Draggable
      data={{
        type: "Audio",
        src: item.url,
        name: item.text,
      }}
      shouldDisplayPreview={!isDraggingOverTimeline}
      renderCustomPreview={
        <div className="px-3 py-2 bg-black rounded border border-primary shadow-xl flex items-center gap-2 pointer-events-none">
          <IconMusic className="size-4" />
          <span className="text-xs font-medium truncate max-w-[150px]">{item.text}</span>
        </div>
      }
    >
      <div className="group relative flex items-center gap-3 p-2 bg-secondary rounded-sm border hover:border-white/10 transition-colors">
        <audio
          ref={audioRef}
          src={item.url}
          onEnded={() => setPlayingId(null)}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
        />

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 shrink-0"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <IconPlayerPause className="size-4 fill-current" />
          ) : (
            <IconPlayerPlay className="size-4 fill-current ml-0.5" />
          )}
        </Button>

        <div
          onClick={() => onAdd(item.url, item.text)}
          className="flex flex-col min-w-0 flex-1 cursor-pointer"
        >
          <span className="text-xs font-medium truncate mb-0.5 text-zinc-300">{item.text}</span>
          <span className="text-[10px] text-muted-foreground">{duration}</span>
        </div>
      </div>
    </Draggable>
  );
};
