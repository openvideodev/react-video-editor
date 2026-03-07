"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Play, Trash2 } from "lucide-react";
import { useStudioStore } from "@/stores/studio-store";
import { fontManager, jsonToClip, Log, type IClip } from "openvideo";
import { generateCaptionClips } from "@/lib/caption-generator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export default function PanelCaptions() {
  const { studio } = useStudioStore();
  const [mediaItems, setMediaItems] = useState<IClip[]>([]);
  const [captionItems, setCaptionItems] = useState<IClip[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCaptionId, setActiveCaptionId] = useState<string | null>(null);

  // Use refs to access latest state inside event listeners without re-binding
  const captionItemsRef = useRef<IClip[]>([]);
  const activeCaptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    captionItemsRef.current = captionItems;
  }, [captionItems]);

  const updateClips = () => {
    if (!studio) return;
    const tracks = studio.getTracks();
    const allClips: IClip[] = [];
    tracks.forEach((track) => {
      track.clipIds.forEach((id) => {
        const clip = studio.getClipById(id);
        if (clip) allClips.push(clip);
      });
    });

    const mediaClips = allClips.filter(
      (clip: IClip) => clip.type === "Video" || clip.type === "Audio",
    );
    setMediaItems(mediaClips);

    // Find all captions
    const captions = allClips.filter((clip: IClip) => clip.type === "Caption");
    const sorted = captions.sort((a: IClip, b: IClip) => a.display.from - b.display.from);
    setCaptionItems(sorted);
  };

  useEffect(() => {
    if (!studio) return;

    const handleUpdate = () => updateClips();

    const handleTimeUpdate = ({ currentTime }: { currentTime: number }) => {
      // Find the currently active caption
      // We use the Ref because this closure is created once and we don't want to re-bind listener
      const activeItem = captionItemsRef.current.find(
        (item) => currentTime >= item.display.from && currentTime < item.display.to,
      );

      const newActiveId = activeItem ? activeItem.id : null;

      // Only trigger re-render if the active caption actually changes
      if (newActiveId !== activeCaptionIdRef.current) {
        setActiveCaptionId(newActiveId);
        activeCaptionIdRef.current = newActiveId;
      }
    };

    handleUpdate();
    studio.on("clip:added", handleUpdate);
    studio.on("clip:removed", handleUpdate);
    studio.on("clip:updated", handleUpdate);
    studio.on("currentTime", handleTimeUpdate);

    return () => {
      studio.off("clip:added", handleUpdate);
      studio.off("clip:removed", handleUpdate);
      studio.off("clip:updated", handleUpdate);
      studio.off("currentTime", handleTimeUpdate);
    };
  }, [studio]);

  const handleGenerateCaptions = async () => {
    if (!studio || mediaItems.length === 0) return;

    setIsGenerating(true);
    try {
      const fontName = "Bangers-Regular";
      const fontUrl = "https://fonts.gstatic.com/s/poppins/v15/pxiByp8kv8JHgFVrLCz7V1tvFP-KUEg.ttf";

      await fontManager.addFont({
        name: fontName,
        url: fontUrl,
      });

      const captionTrackId = `track_captions_${Date.now()}`;
      const clipsToAdd: IClip[] = [];

      for (const mediaClip of mediaItems) {
        try {
          // 1. Get transcription
          const audioUrl = (mediaClip as any).src;
          if (!audioUrl) continue;

          const transcribeResponse = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: audioUrl, model: "nova-3" }),
          });

          if (!transcribeResponse.ok) {
            Log.error(`Transcription failed for media ${mediaClip.id}`);
            continue;
          }

          const transcriptionData = await transcribeResponse.json();
          if (!transcriptionData) continue;

          const words = transcriptionData.results?.main?.words || transcriptionData.words || [];

          // 2. Generate caption JSON
          const captionClipsJSON = await generateCaptionClips({
            videoWidth: (studio as any).opts.width,
            videoHeight: (studio as any).opts.height,
            words,
          });

          // 3. Prepare clips
          for (const json of captionClipsJSON) {
            const enrichedJson = {
              ...json,
              mediaId: mediaClip.id,
              metadata: {
                ...json.metadata,
                sourceClipId: mediaClip.id,
              },
              display: {
                from: json.display.from + mediaClip.display.from,
                to: json.display.to + mediaClip.display.from,
              },
            };
            const clip = await jsonToClip(enrichedJson);
            clipsToAdd.push(clip);
          }
        } catch (error) {
          Log.error(`Failed to process media ${mediaClip.id}:`, error);
        }
      }

      if (clipsToAdd.length > 0) {
        await studio.addClip(clipsToAdd, { trackId: captionTrackId });
        updateClips();
      }
    } catch (error) {
      Log.error("Failed to generate captions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  function normalizeWordTimings(words: any[]) {
    let currentTime = 0;
    return words.map((word, i) => {
      const duration = word.to - word.from;
      const newWord = {
        ...word,
        from: currentTime,
        to: currentTime + duration,
      };
      currentTime += duration;
      return newWord;
    });
  }

  const handleSplitCaption = async (id: string, cursorPosition: number, fullText: string) => {
    if (!studio) return;

    const clip = studio.getClipById(id);
    if (!clip) return;

    const trackId = studio.findTrackIdByClipId(id);
    if (!trackId) return;

    const wordsInText: { text: string; start: number; end: number }[] = [];
    const regex = /\S+/g;
    let match;
    while ((match = regex.exec(fullText)) !== null) {
      wordsInText.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    let splitWordIndex = -1;
    for (let i = 0; i < wordsInText.length; i++) {
      if (cursorPosition <= wordsInText[i].start) {
        splitWordIndex = i;
        break;
      }
      if (cursorPosition < wordsInText[i].end) {
        splitWordIndex = i;
        break;
      }
    }

    if (splitWordIndex <= 0) return;

    const part1Text = wordsInText
      .slice(0, splitWordIndex)
      .map((w) => w.text)
      .join(" ");
    const part2Text = wordsInText
      .slice(splitWordIndex)
      .map((w) => w.text)
      .join(" ");

    const clipJson = (clip as any).toJSON ? (clip as any).toJSON() : { ...clip };
    const caption = clipJson.caption || {};
    const words = caption.words || [];

    const part1Words = words.slice(0, splitWordIndex);
    const part2Words = words.slice(splitWordIndex);
    console.log("part1Words", part1Words);
    console.log("part2Words", part2Words);
    console.log("clipJson", clipJson);

    if (part1Words.length === 0 || part2Words.length === 0) return;
    const lastWordPart1 = part1Words[part1Words.length - 1];

    const clip1Json = {
      ...clipJson,
      id: undefined,
      text: part1Text,
      width: 0,
      height: 0,
      wordWrapWidth: 0,
      caption: {
        ...caption,
        words: part1Words,
      },
      display: {
        from: clipJson.display.from,
        to: lastWordPart1.to * 1000 + clipJson.display.from,
      },
      duration: lastWordPart1.to * 1000,
    };

    const clip2Json = {
      ...clipJson,
      id: undefined,
      text: part2Text,
      width: 0,
      height: 0,
      wordWrapWidth: 0,
      caption: {
        ...caption,
        words: normalizeWordTimings(part2Words),
      },
      display: {
        from: lastWordPart1.to * 1000 + clipJson.display.from,
        to: clipJson.display.to,
      },
      duration: clipJson.display.to - lastWordPart1.to * 1000 - clipJson.display.from,
    };

    try {
      const clip1 = await jsonToClip(clip1Json as any);
      const clip2 = await jsonToClip(clip2Json as any);

      const videoWidth = (studio as any).opts.width || 1080;

      // Center clip 1
      if (clip1.width > 0) {
        clip1.left = (videoWidth - clip1.width) / 2;
      }

      // Center clip 2
      if (clip2.width > 0) {
        clip2.left = (videoWidth - clip2.width) / 2;
      }

      await studio.addClip([clip1, clip2], { trackId });
      studio.removeClipById(id);
    } catch (error) {
      Log.error("Failed to split caption clip:", error);
    }
  };

  // En PanelCaptions, modifica handleUpdateCaption:
  const handleUpdateCaption = async (id: string, text: string, fullUpdate = false) => {
    if (!studio) return;

    const clip = studio.getClipById(id);
    if (!clip) return;

    const tracks = studio.getTracks();
    const track = tracks.find((t) => t.clipIds.includes(id));
    if (!track) return;

    if (!fullUpdate) {
      // MODO RÁPIDO: solo actualizar text (para onChange)
      const captionClip = clip as any;
      captionClip.text = text;
      captionClip.emit("propsChange", { text });
      return;
    }

    // MODO COMPLETO: calcular words y timings (solo onBlur)
    const newWordsText = text.trim().split(/\s+/).filter(Boolean);
    const clipJson = (clip as any).toJSON ? (clip as any).toJSON() : { ...clip };
    const caption = clipJson.caption || {};
    const oldWords = caption.words || [];
    const paragraphIndex = oldWords[0]?.paragraphIndex ?? "";

    const isNewWordAdded = newWordsText.length > oldWords.length;
    let updatedWords;

    if (isNewWordAdded) {
      const totalDurationMs = (clipJson.display.to - clipJson.display.from) / 1000;
      const totalChars = newWordsText.reduce((acc, w) => acc + w.length, 0);
      const durationPerChar = totalChars > 0 ? totalDurationMs / totalChars : 0;

      let currentShift = 0;
      updatedWords = newWordsText.map((wordText, index) => {
        const wordDuration = wordText.length * durationPerChar;
        const word = {
          ...(oldWords[index] || { isKeyWord: false, paragraphIndex }),
          text: wordText,
          from: currentShift,
          to: currentShift + wordDuration,
        };
        currentShift += wordDuration;
        return word;
      });
    } else {
      updatedWords = newWordsText.map((wordText, index) => {
        if (oldWords[index]) {
          return {
            ...oldWords[index],
            text: wordText,
          };
        }
        return {
          text: wordText,
          from: 0,
          to: 0,
          isKeyWord: false,
        };
      });
    }

    const newClipJson = {
      ...clipJson,
      text,
      caption: {
        ...caption,
        words: updatedWords,
      },
      id: undefined,
    } as any;

    try {
      const newClip = await jsonToClip(newClipJson);
      await studio.addClip([newClip], { trackId: track.id });
      studio.removeClipById(id);
    } catch (error) {
      Log.error("Failed to update caption clip:", error);
    }
  };

  const handleDeleteCaption = (id: string) => {
    if (!studio) return;
    studio.removeClipById(id);
  };

  const handleSeek = (time: number) => {
    if (!studio) return;
    studio.seek(time);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden min-w-0">
        {mediaItems.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-center text-sm text-muted-foreground p-8">
            Add video or audio to the timeline to generate captions.
          </div>
        ) : captionItems.length > 0 ? (
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-4">
              <div className="flex flex-col gap-2 pb-4">
                {captionItems.map((item) => (
                  <CaptionItem
                    key={item.id}
                    item={item}
                    isActive={item.id === activeCaptionId}
                    onUpdate={(text, fullUpdate) => handleUpdateCaption(item.id, text, fullUpdate)}
                    onSplit={(pos, text) => handleSplitCaption(item.id, pos, text)}
                    onDelete={() => handleDeleteCaption(item.id)}
                    onSeek={() => handleSeek(item.display.from)}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-4 py-6 items-center text-center">
            <div className="text-sm text-muted-foreground">
              Recognize speech in the selected media and generate captions automatically.
            </div>
            <Button
              onClick={handleGenerateCaptions}
              variant="default"
              className="w-full"
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Captions"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function CaptionItem({
  item,
  isActive,
  onUpdate,
  onSplit,
  onDelete,
  onSeek,
}: {
  item: IClip;
  isActive: boolean;
  onUpdate: (text: string, fullUpdate?: boolean) => void;
  onSplit: (cursorPosition: number, text: string) => void;
  onDelete: () => void;
  onSeek: () => void;
}) {
  const [text, setText] = useState((item as any).text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText((item as any).text || "");
  }, [(item as any).text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onUpdate(e.target.value, false);
  };

  const handleBlur = () => {
    if (text !== (item as any).text) {
      onUpdate(text, true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const cursorPosition = textareaRef.current?.selectionStart || 0;
      onSplit(cursorPosition, text);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-2 rounded-md p-3 transition-colors border-l-2",
        isActive ? "bg-zinc-700/10 border-zinc-300 border" : "hover:bg-zinc-700/10  border",
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className="text-[10px] font-mono text-muted-foreground cursor-pointer hover:text-white transition-colors"
          onClick={onSeek}
        >
          {formatTime(item.display.from / 1_000_000)} - {formatTime(item.display.to / 1_000_000)}
        </div>

        <div
          className={cn(
            "flex items-center gap-1 opacity-0 transition-opacity",
            isActive || "group-hover:opacity-100",
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onSeek();
            }}
          >
            <Play className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="min-h-[20px] p-0 resize-none border-none focus-visible:ring-0 bg-transparent text-sm leading-relaxed text-zinc-300 focus:text-white placeholder:text-zinc-600"
        rows={Math.max(1, Math.ceil(text.length / 40))}
      />
    </div>
  );
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const hh = h > 0 ? `${h.toString().padStart(2, "0")}:` : "";
  const mm = m.toString().padStart(2, "0");
  const ss = s.toString().padStart(2, "0");

  return `${hh}${mm}:${ss}`;
}
