import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconLoader2, IconClock, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";
import { useGeneratedStore } from "@/stores/generated-store";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DURATIONS = [10, 20, 30, 60, 90, 120, 180, 300];

export const MusicChatPanel = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  const { addAsset } = useGeneratedStore();

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/elevenlabs/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, duration }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate music");
      }

      const data = await response.json();

      addAsset({
        id: crypto.randomUUID(),
        url: data.url,
        text: text,
        type: "music",
        createdAt: Date.now(),
      });

      toast.success("Music generated!");
      setText("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate music");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="rounded-xl h-full p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex gap-2 h-full pt-2">
          <Textarea
            placeholder="Describe music (e.g. Upbeat pop, Cinematic atmosphere)..."
            className="resize-none text-sm min-h-[24px] h-full !bg-transparent border-0 focus-visible:ring-0 px-1 py-0 shadow-none placeholder:text-muted-foreground"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 w-full justify-between">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              >
                <IconClock className="size-4" />
                <span className="text-xs">{duration}s</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2" align="start">
              <div className="flex flex-col gap-1">
                <div className="text-xs font-medium text-muted-foreground px-2 py-1.5">
                  Duration (seconds)
                </div>
                {DURATIONS.map((d) => (
                  <Button
                    key={d}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "justify-start h-8 text-xs font-normal",
                      duration === d && "bg-secondary text-secondary-foreground",
                    )}
                    onClick={() => setDuration(d)}
                  >
                    <IconClock className="size-3 mr-2 opacity-70" />
                    {d}s{duration === d && <IconCheck className="size-3 ml-auto" />}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            className="h-9 w-24 rounded-full text-sm relative"
            size="sm"
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
          >
            {loading ? <IconLoader2 className="size-4 animate-spin" /> : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
};
