import { z } from "genkit";
import { ai } from "./chat-flow";

// Lazy tool initialization to prevent re-registration errors
let toolsCache: any[] | null = null;

export function getScriptToVideoTools() {
  if (toolsCache) return toolsCache;

  const update_video_config = ai.defineTool(
    {
      name: "update_video_config",
      description: "Update the video script and generation parameters based on user input.",
      inputSchema: z.object({
        script: z.string().describe("The video script content."),
        aspectRatio: z
          .string()
          .optional()
          .describe("The aspect ratio of the video (e.g., '16:9', '9:16', '1:1')."),
        visualType: z
          .string()
          .optional()
          .describe("The type of visuals to use ('AI_VIDEOS', 'AI_IMAGES', 'STOCK_VIDEOS')."),
        visualStyle: z
          .string()
          .optional()
          .describe("The visual style (e.g., Cinematic, Anime, Realism)."),
        voiceId: z.string().optional().describe("The ID of the voice to use."),
        duration: z
          .string()
          .optional()
          .describe("The duration of the video in seconds ('30', '45', '60')."),
        quality: z.string().optional().describe("The video quality ('regular', 'high')."),
        captionPosition: z
          .string()
          .optional()
          .describe("The position of captions ('top', 'middle', 'bottom')."),
        captionSize: z
          .string()
          .optional()
          .describe("The size of captions ('small', 'medium', 'large')."),
      }),
      outputSchema: z.object({
        message: z.string(),
      }),
    },
    async (args) => {
      // The actual logic is handled on the client side, here we just acknowledge.
      // We return the args so the model sees what it called, but mainly for the client to act on.
      return {
        message: "Video configuration updated.",
      };
    },
  );

  toolsCache = [update_video_config];

  return toolsCache;
}
