"use client";

import { useState, useEffect, startTransition } from "react";
import { toast } from "sonner";
import { Compositor, Log } from "@openvideo/engine-pixi";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Video, Music, Clock, Settings2 } from "lucide-react";
import { useStudioStore } from "@/stores/studio-store";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Option definitions (sourced from mediabunny's supported formats/codecs)
// ---------------------------------------------------------------------------

const VIDEO_CODECS = [
  { value: "avc1.640033", label: "H.264 (AVC)", maxHeight: 2160 },
  { value: "hvc1.1.6.L153.B0", label: "H.265 (HEVC)", maxHeight: 2160 },
  { value: "vp09.00.51.08", label: "VP9", maxHeight: 2160 },
];

const AUDIO_CODECS = [
  { value: "aac", label: "AAC" },
  { value: "opus", label: "Opus" },
  { value: "mp3", label: "MP3" },
  { value: "flac", label: "FLAC" },
];

// Which container formats work with which video codecs
const VIDEO_FORMATS = [
  {
    value: "mp4",
    label: "MP4",
    codecs: ["avc1.640033", "hvc1.1.6.L153.B0", "vp09.00.51.08"],
  },
  { value: "webm", label: "WebM", codecs: ["vp09.00.51.08"] },
  {
    value: "mkv",
    label: "MKV",
    codecs: ["avc1.640033", "hvc1.1.6.L153.B0", "vp09.00.51.08"],
  },
  { value: "mov", label: "MOV", codecs: ["avc1.640033", "hvc1.1.6.L153.B0"] },
];

const AUDIO_FORMATS = [
  { value: "mp3", label: "MP3" },
  { value: "wav", label: "WAV" },
  { value: "flac", label: "FLAC" },
  { value: "ogg", label: "OGG" },
];

const FRAME_RATES = [
  { value: "23.976", label: "23.976 fps (Film)" },
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps (PAL)" },
  { value: "29.97", label: "29.97 fps (NTSC)" },
  { value: "30", label: "30 fps" },
  { value: "50", label: "50 fps" },
  { value: "59.94", label: "59.94 fps (NTSC)" },
  { value: "60", label: "60 fps" },
  { value: "15", label: "15 fps" },
];

interface ResolutionPreset {
  value: string;
  label: string;
  badge: string;
  bitrate: number;
  fps: number;
  codec: string;
  format: string;
}

const RESOLUTION_GROUPS: { group: string; items: ResolutionPreset[] }[] = [
  {
    group: "Standard",
    items: [
      {
        value: "1280x720",
        label: "HD",
        badge: "720p",
        bitrate: 7_000_000,
        fps: 30,
        codec: "avc1.640033",
        format: "mp4",
      },
      {
        value: "1920x1080",
        label: "Full HD",
        badge: "1080p",
        bitrate: 12_000_000,
        fps: 30,
        codec: "avc1.640033",
        format: "mp4",
      },
      {
        value: "2560x1440",
        label: "2K Quad HD",
        badge: "1440p",
        bitrate: 24_000_000,
        fps: 30,
        codec: "vp09.00.51.08",
        format: "mp4",
      },
      {
        value: "3840x2160",
        label: "4K Ultra HD",
        badge: "2160p",
        bitrate: 64_000_000,
        fps: 30,
        codec: "vp09.00.51.08",
        format: "mp4",
      },
    ],
  },
  {
    group: "Social Media",
    items: [
      {
        value: "1080x1920",
        label: "YouTube Shorts",
        badge: "1080p",
        bitrate: 12_000_000,
        fps: 30,
        codec: "avc1.640033",
        format: "mp4",
      },
      {
        value: "3840x2160",
        label: "YouTube 4K",
        badge: "2160p",
        bitrate: 64_000_000,
        fps: 30,
        codec: "vp09.00.51.08",
        format: "mp4",
      },
      {
        value: "1080x1920",
        label: "Instagram Reels",
        badge: "1080p",
        bitrate: 12_000_000,
        fps: 30,
        codec: "avc1.640033",
        format: "mp4",
      },
      {
        value: "1080x1920",
        label: "TikTok",
        badge: "1080p",
        bitrate: 12_000_000,
        fps: 30,
        codec: "avc1.640033",
        format: "mp4",
      },
    ],
  },
  {
    group: "Web",
    items: [
      {
        value: "1280x720",
        label: "HD",
        badge: "720p",
        bitrate: 5_000_000,
        fps: 30,
        codec: "vp09.00.51.08",
        format: "webm",
      },
      {
        value: "1920x1080",
        label: "Full HD",
        badge: "1080p",
        bitrate: 8_000_000,
        fps: 30,
        codec: "vp09.00.51.08",
        format: "webm",
      },
    ],
  },
];

const RESOLUTION_PRESETS = RESOLUTION_GROUPS.flatMap((g) => g.items);

const SAMPLE_RATES = [
  { value: "44100", label: "44.1 kHz" },
  { value: "48000", label: "48 kHz" },
];

// ---------------------------------------------------------------------------
// Shared UI primitives
// ---------------------------------------------------------------------------

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="w-36 shrink-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utility: freeze the editor render loop during export so the main thread is
// fully available to the encoder. Replaces window.requestAnimationFrame with a
// version that queues callbacks instead of running them — identical to what the
// browser does naturally when the tab is backgrounded (where export runs ~2×
// faster). Returns a restore function that must be called when export finishes.
// ---------------------------------------------------------------------------

function suppressRenderLoop(): () => void {
  const originalRAF = window.requestAnimationFrame.bind(window);
  const originalCAF = window.cancelAnimationFrame.bind(window);
  const queued = new Map<number, FrameRequestCallback>();
  let idCounter = 0x70000000;

  // DOM types mark rAF/cAF as readonly; one typed cast is required.
  const win = window as Window & {
    requestAnimationFrame: (cb: FrameRequestCallback) => number;
    cancelAnimationFrame: (id: number) => void;
  };

  win.requestAnimationFrame = (cb) => {
    const id = ++idCounter;
    queued.set(id, cb);
    return id;
  };
  win.cancelAnimationFrame = (id) => {
    if (!queued.delete(id)) originalCAF(id);
  };

  return () => {
    win.requestAnimationFrame = originalRAF;
    win.cancelAnimationFrame = originalCAF;
    queued.forEach((cb) => originalRAF(cb));
    queued.clear();
  };
}

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const { studio } = useStudioStore();
  const studioOpts = studio?.getOptions() || {
    width: 1920,
    height: 1080,
    fps: 30,
  };

  // Step state: "preset" | "advanced" | "exporting"
  const [step, setStep] = useState<"preset" | "advanced" | "exporting">("preset");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportBlobUrl, setExportBlobUrl] = useState<string | null>(null);
  const [exportStartTime, setExportStartTime] = useState<number | null>(null);
  const [exportCombinator, setExportCombinator] = useState<Compositor | null>(null);

  // Export settings
  const [includeVideo, setIncludeVideo] = useState(true);
  const [videoCodec, setVideoCodec] = useState("avc1.640033");
  const [quality, setQuality] = useState("12000000");
  const [format, setFormat] = useState("mp4");
  const [fps, setFps] = useState(String(studioOpts.fps || 30));
  const [resolution, setResolution] = useState("Full HD");

  const [includeAudio, setIncludeAudio] = useState(true);
  const [audioCodec, setAudioCodec] = useState("aac");
  const [audioSampleRate, setAudioSampleRate] = useState("48000");

  const maxDuration = studio?.getMaxDuration() || 0;

  // When video is disabled, switch to an audio-only format
  useEffect(() => {
    if (!includeVideo && format === "mp4") {
      setFormat("mp3");
    } else if (includeVideo && ["mp3", "wav", "flac", "ogg"].includes(format)) {
      setFormat("mp4");
    }
  }, [includeVideo]);

  // Ensure selected video codec is compatible with the chosen format
  // and auto-switch audio codec for webm (requires opus/vorbis, not aac)
  useEffect(() => {
    if (includeVideo) {
      const f = VIDEO_FORMATS.find((x) => x.value === format);
      if (f && !f.codecs.includes(videoCodec)) setVideoCodec(f.codecs[0]);
    }
    if (format === "webm") {
      if (!["opus", "vorbis"].includes(audioCodec)) setAudioCodec("opus");
    } else {
      if (["opus", "vorbis"].includes(audioCodec)) setAudioCodec("aac");
    }
  }, [format]);

  // When a resolution preset is selected, apply its recommended bitrate and
  // auto-switch to VP9 above 1080p (H.264/H.265 4K WebCodecs support is inconsistent).
  useEffect(() => {
    if (!includeVideo) return;
    const preset = RESOLUTION_PRESETS.find((r) => r.label === resolution);
    if (!preset) return;
    setQuality(String(preset.bitrate));
    const height = Number(preset.value.split("x")[1]);
    if (height > 1080) {
      setVideoCodec("vp09.00.51.08");
      if (format === "mov") setFormat("mp4");
    }
  }, [resolution, includeVideo]);

  const applyPreset = (preset: ResolutionPreset) => {
    setResolution(preset.label);
    setQuality(String(preset.bitrate));
    setFps(String(preset.fps));
    setVideoCodec(preset.codec);
    setFormat(preset.format);
  };

  const resetState = () => {
    if (exportCombinator) {
      exportCombinator.destroy();
      setExportCombinator(null);
    }
    if (exportBlobUrl) {
      URL.revokeObjectURL(exportBlobUrl);
      setExportBlobUrl(null);
    }
    setExportStartTime(null);
    setIsExporting(false);
    setExportProgress(0);
    setStep("preset");
  };

  const handleClose = () => {
    onOpenChange(false);
    resetState();
  };

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  const handleDownload = (url?: string) => {
    const downloadUrl = url || exportBlobUrl;
    if (!downloadUrl) return;
    const aEl = document.createElement("a");
    document.body.appendChild(aEl);
    aEl.setAttribute("href", downloadUrl);
    aEl.setAttribute("download", `openvideo-export-${Date.now()}.${format}`);
    aEl.setAttribute("target", "_self");
    aEl.click();
    setTimeout(() => {
      if (document.body.contains(aEl)) document.body.removeChild(aEl);
    }, 100);
  };

  const startExport = async () => {
    if (!studio) return;

    // Pause interactive playback/rendering while exporting to avoid
    // competing with the compositor on the main thread. This mirrors
    // the behavior you see when the tab is backgrounded, where the
    // editor render loop is throttled and export runs faster.
    const wasPlaying = studio.getIsPlaying();

    const restoreRAF = suppressRenderLoop();

    setStep("exporting");
    setIsExporting(true);
    setExportProgress(0);
    setExportBlobUrl(null);
    setExportStartTime(Date.now());

    try {
      if (wasPlaying) studio.pause();
      studio.suspendRendering();

      const json = studio.exportToJSON();
      if (!json.clips || Object.keys(json.clips).length === 0)
        throw new Error("No clips to export");

      const settings = json.settings || {};
      const resolvedPreset = RESOLUTION_PRESETS.find((r) => r.label === resolution);

      // Determine export dimensions, respecting project aspect ratio
      const projectWidth = settings.width || studioOpts.width || 1920;
      const projectHeight = settings.height || studioOpts.height || 1080;
      const isProjectPortrait = projectHeight > projectWidth;

      let exportWidth: number;
      let exportHeight: number;

      if (resolvedPreset?.value?.includes("x")) {
        const [presetW, presetH] = resolvedPreset.value.split("x").map(Number);
        const isPresetPortrait = presetH > presetW;

        // Swap dimensions if preset orientation doesn't match project orientation
        if (isProjectPortrait !== isPresetPortrait) {
          exportWidth = presetH;
          exportHeight = presetW;
        } else {
          exportWidth = presetW;
          exportHeight = presetH;
        }
      } else {
        exportWidth = projectWidth;
        exportHeight = projectHeight;
      }
      const compositorOptions: any = {
        width: includeVideo ? exportWidth : 0,
        height: includeVideo ? exportHeight : 0,
        fps: Number(fps),
        backgroundColor: settings.backgroundColor || "#000000",
        format,
        videoCodec: includeVideo ? videoCodec : undefined,
        bitrate: Number(quality),
        audio: includeAudio ? true : false,
        audioCodec: includeAudio ? audioCodec : undefined,
        audioSampleRate: includeAudio ? Number(audioSampleRate) : undefined,
        prioritizeSpeed: true,
      };

      const com = new Compositor(compositorOptions);
      if (includeVideo) await com.initPixiApp();
      setExportCombinator(com);

      // Throttle progress state updates to avoid React work competing
      // with encoding on the main thread. Using startTransition marks these
      // updates as non-urgent so React can defer them when the encoder needs CPU.
      let lastProgress = 0;
      let lastUpdateAt = 0;
      com.on("export:progress", (v) => {
        lastProgress = v;
        const now = Date.now();
        if (v === 1 || now - lastUpdateAt > 500) {
          lastUpdateAt = now;
          startTransition(() => {
            setExportProgress(lastProgress);
          });
        }
      });

      await com.loadFromJSON(json);
      const stream = com.output();
      const blob = await new Response(stream).blob();
      const blobUrl = URL.createObjectURL(blob);
      setExportBlobUrl(blobUrl);
      setIsExporting(false);

      setTimeout(() => {
        handleDownload(blobUrl);
        toast.success("Rendering complete! Your download has started.");
        setTimeout(() => handleClose(), 1500);
      }, 500);
    } catch (error) {
      Log.error("Export error:", error);
      alert("Failed to export: " + (error as Error).message);
      setIsExporting(false);
      setStep("advanced");
    } finally {
      restoreRAF();
      studio.resumeRendering();
      if (wasPlaying) studio.play().catch(() => undefined);
    }
  };

  if (!open) return null;

  const selectCls =
    "h-8 w-36 text-xs bg-muted border-border text-foreground hover:bg-muted/80 rounded-md";
  const selectContentCls =
    "bg-popover border-border text-popover-foreground backdrop-blur-xl text-xs";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className={`max-w-[400px] border border-border p-0 text-foreground shadow-2xl overflow-hidden rounded-2xl ${
          isExporting ? "bg-background" : "bg-background/80 backdrop-blur-2xl"
        }`}
        showCloseButton={false}
      >
        {/* ── STEP 1: Preset picker ─────────────────────────────── */}
        {step === "preset" && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Export
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(maxDuration / 1e6).toFixed(1)}s · {studioOpts.width}×{studioOpts.height}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                ✕
              </Button>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-4">
              {RESOLUTION_GROUPS.map((group) => (
                <div key={group.group}>
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                    {group.group}
                  </p>
                  <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
                    {group.items.map((preset) => (
                      <button
                        key={group.group + preset.label}
                        onClick={() => {
                          applyPreset(preset);
                          startExport();
                        }}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors text-left group"
                      >
                        <span className="text-sm text-foreground">{preset.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {preset.badge}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                            {preset.format.toUpperCase()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                  Advanced
                </p>
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <button
                    onClick={() => setStep("advanced")}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/60 transition-colors text-left"
                  >
                    <span className="text-sm text-foreground">Custom</span>
                    <div className="flex items-center gap-3">
                      <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Advanced settings ─────────────────────────── */}
        {step === "advanced" && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div>
                <DialogTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Custom Export
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {studioOpts.width}×{studioOpts.height} · {(maxDuration / 1e6).toFixed(1)}s
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => setStep("preset")}
                className="h-7 px-2 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                ← Back
              </Button>
            </div>

            <div className="px-5 pb-5 flex flex-col gap-3">
              {/* Video Section */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Video className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Video</span>
                  </div>
                  <Switch checked={includeVideo} onCheckedChange={setIncludeVideo} />
                </div>
                <div
                  className={`px-4 py-3 flex flex-col gap-3 transition-opacity ${!includeVideo ? "opacity-30 pointer-events-none" : ""}`}
                >
                  <Row label="Resolution">
                    <Select value={resolution} onValueChange={setResolution}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        <SelectItem value="HD">720p</SelectItem>
                        <SelectItem value="Full HD">1080p</SelectItem>
                        <SelectItem value="2K Quad HD">1440p</SelectItem>
                        <SelectItem value="4K Ultra HD">2160p</SelectItem>
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Bitrate (Mbps)">
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={Math.round(Number(quality) / 1_000_000)}
                      onChange={(e) => setQuality(String(Number(e.target.value) * 1_000_000))}
                      className="h-8 w-36 rounded-md bg-muted border border-border px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring tabular-nums"
                    />
                  </Row>
                  <Row label="Codec">
                    <Select value={videoCodec} onValueChange={setVideoCodec}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {VIDEO_CODECS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Format">
                    <Select value={format} onValueChange={setFormat}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {VIDEO_FORMATS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Frame Rate">
                    <Select value={fps} onValueChange={setFps}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {FRAME_RATES.map((fr) => (
                          <SelectItem key={fr.value} value={fr.value}>
                            {fr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                </div>
              </div>

              {/* Audio Section */}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Music className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Audio</span>
                  </div>
                  <Switch checked={includeAudio} onCheckedChange={setIncludeAudio} />
                </div>
                <div
                  className={`px-4 py-3 flex flex-col gap-3 transition-opacity ${!includeAudio ? "opacity-30 pointer-events-none" : ""}`}
                >
                  {!includeVideo && (
                    <Row label="Format">
                      <Select value={format} onValueChange={setFormat}>
                        <SelectTrigger className={selectCls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={selectContentCls}>
                          {AUDIO_FORMATS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Row>
                  )}
                  <Row label="Codec">
                    <Select value={audioCodec} onValueChange={setAudioCodec}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {AUDIO_CODECS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                  <Row label="Sample Rate">
                    <Select value={audioSampleRate} onValueChange={setAudioSampleRate}>
                      <SelectTrigger className={selectCls}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={selectContentCls}>
                        {SAMPLE_RATES.map((sr) => (
                          <SelectItem key={sr.value} value={sr.value}>
                            {sr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Row>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{(maxDuration / 1e6).toFixed(2)}s</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleClose}
                    className="h-8 px-4 text-xs rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={startExport}
                    className="h-8 px-5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  >
                    Export
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Progress ──────────────────────────────────── */}
        {step === "exporting" && (
          /* Progress view */
          <div className="flex flex-col p-6 gap-6">
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Exporting…
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {format.toUpperCase()} · {studioOpts.width}×{studioOpts.height}
              </p>
            </div>

            {/* Summary pill grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Format", value: format.toUpperCase() },
                { label: "FPS", value: fps },
                {
                  label: "Resolution",
                  value: includeVideo
                    ? (() => {
                        const p = RESOLUTION_PRESETS.find((r) => r.label === resolution);
                        return p
                          ? `${p.badge} (${p.value.replace("x", "×")})`
                          : `${studioOpts.width}×${studioOpts.height}`;
                      })()
                    : "N/A",
                },
                { label: "Video", value: includeVideo ? "On" : "Off" },
                { label: "Audio", value: includeAudio ? "On" : "Off" },
                {
                  label: "Sample",
                  value: includeAudio ? `${Number(audioSampleRate) / 1000}k` : "N/A",
                },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-border bg-card px-3 py-2">
                  <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
                  <p className="text-xs font-medium text-foreground truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Progress</span>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(exportProgress * 100)}%
                  {exportProgress > 0 && exportStartTime
                    ? (() => {
                        const elapsed = Date.now() - exportStartTime;
                        const remaining = (elapsed / exportProgress - elapsed) / 1000;
                        const mins = Math.floor(remaining / 60);
                        const secs = Math.floor(remaining % 60);
                        return ` · ${mins}m ${secs}s left`;
                      })()
                    : " · preparing…"}
                </span>
              </div>
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-primary"
                  style={{ width: `${exportProgress * 100}%` }}
                />
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={handleClose}
              className="w-full h-9 text-xs rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              {isExporting && <Loader2 className="h-3.5 w-3.5 mr-2" />}
              Cancel Export
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
