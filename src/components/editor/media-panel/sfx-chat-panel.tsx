import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { useGeneratedStore } from "@/stores/generated-store";

export const SfxChatPanel = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { addAsset } = useGeneratedStore();

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/elevenlabs/sfx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate SFX");
      }

      const data = await response.json();

      addAsset({
        id: crypto.randomUUID(),
        url: data.url,
        text: text,
        type: "sfx",
        createdAt: Date.now(),
      });

      toast.success("SFX generated!");
      setText("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate SFX");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="rounded-xl h-full p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex gap-2 h-full pt-2">
          <Textarea
            placeholder="Describe sound effect (e.g. Explosion, Footsteps)..."
            className="resize-none text-sm min-h-[24px] h-full !bg-transparent border-0 focus-visible:ring-0 px-1 py-0 shadow-none placeholder:text-muted-foreground"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pt-2 w-full justify-end">
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
