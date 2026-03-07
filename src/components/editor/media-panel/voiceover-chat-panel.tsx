import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { IconLoader2 } from "@tabler/icons-react";
import { toast } from "sonner";
import { useGeneratedStore } from "@/stores/generated-store";

export const VoiceoverChatPanel = () => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const { addAsset } = useGeneratedStore();

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/elevenlabs/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate voiceover");
      }

      const data = await response.json();

      addAsset({
        id: crypto.randomUUID(),
        url: data.url,
        text: text,
        type: "voiceover",
        createdAt: Date.now(),
      });

      toast.success("Voiceover generated!");
      setText(""); // Clear input on success
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate voiceover");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="rounded-xl h-full p-3 flex flex-col gap-2 shadow-sm">
        <div className="flex gap-2 h-full pt-2">
          <Textarea
            placeholder="Enter text for voiceover..."
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
