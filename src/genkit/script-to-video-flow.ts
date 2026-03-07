import { z } from "genkit";
import { ai } from "./chat-flow";
import { getScriptToVideoTools } from "./script-to-video-tools";

const SYSTEM_PROMPT = `You are a script-to-video assistant. Your goal is to help users create and refine scripts for their videos and configure generation parameters.

When a user provides a topic, brainstorm a creative and engaging script. 

SOCIAL MEDIA VIDEO BEST PRACTICES:
- THE HOOK (0-3s): Start with a high-impact sentence or visual to stop the scroll. (e.g., "The secret to...", "Stop doing this...", etc.)
- VALUE/STORY: Keep the content focused on ONE core message or tip. Use fast-paced, concise language. 
- CALL TO ACTION (CTA): End with a clear instruction (e.g., "Follow for more", "Check the link in bio", "Save this").

FORMATTING GUIDELINES for Script:
- Use the following scene-based format:
Scene [Number]
Narrator: [The spoken dialogue or text overlay]
Visuals: [Description of the visuals for this scene]

- Separate each scene block with a blank line.
- Do NOT include timestamps (e.g., 0:00-0:05) or markdown symbols like ** in the script.

CORE GUIDELINES:
- Always try to write scripts that are engaging and optimized for the chosen aspect ratio.
- If the user asks for a script, provide it in the chat using the Scene/Narrator/Visuals format, ensuring it has a strong Hook and a CTA.
- ALSO call update_video_config to update the hidden script field in the UI.
- Use the update_video_config tool whenever the user wants to adjust any generation parameter.
- Maintain a helpful and professional tone.

Parameters Mapping for update_video_config:
- script: The FULL text of the script in the specified format (no markdown symbols).
- visualType: AI_VIDEOS, AI_IMAGES, or STOCK_VIDEOS.
- visualStyle: Any descriptive style like 'Cinematic', 'Anime', 'Realism', etc. (use lowercase IDs if possible: cinematic, anime, realism, etc.)
- aspectRatio: '16:9', '9:16', or '1:1'.
- voiceId: If the user asks for a specific voice, use its ID.
- duration: '30', '45', or '60'.
- quality: 'regular' or 'high'.
- captionPosition: 'top', 'middle', or 'bottom'.
- captionSize: 'small', 'medium', or 'large'.`;

export const scriptToVideoFlow = ai.defineFlow(
  {
    name: "scriptToVideoFlow",
    inputSchema: z.object({
      message: z.string(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
    streamSchema: z.string(),
  },
  async ({ message }, { sendChunk }) => {
    const { stream, response } = ai.generateStream({
      system: SYSTEM_PROMPT,
      config: {
        thinkingConfig: {
          thinkingBudget: 2000,
          includeThoughts: true,
        },
      },
      prompt: `[USER]: ${message}`,
      tools: getScriptToVideoTools(),
    });

    const toolsQueue: Array<{ name: string; arg: any; response?: any }> = [];

    for await (const chunk of stream) {
      if (chunk.role === "model" && chunk.content?.[0]?.reasoning) {
        sendChunk(
          JSON.stringify({
            event: "reasoning",
            text: chunk.content[0].reasoning,
          }),
        );
      }

      if (chunk.role === "model" && chunk.content?.[0]?.toolRequest) {
        for (let idx = 0; idx < chunk.content.length; idx++) {
          const toolContent = chunk.content[idx];
          if (toolContent.toolRequest) {
            const name = toolContent.toolRequest.name;
            const arg = toolContent.toolRequest.input;
            toolsQueue.push({ name, arg });
          }
        }
      }

      if (chunk.role === "tool" && chunk.content?.[0]?.toolResponse) {
        for (let idx = 0; idx < chunk.content.length; idx++) {
          const toolContent = chunk.content[idx];
          if (toolContent.toolResponse) {
            const name = toolContent.toolResponse.name;
            const responseOutput = toolContent.toolResponse.output;
            const tool = toolsQueue.find((t) => t.name === name && t.response === undefined);
            if (tool) tool.response = responseOutput;
          }
        }
      }
    }

    for (const tool of toolsQueue) {
      sendChunk(
        JSON.stringify({
          event: "tool",
          name: tool.name,
          arg: tool.arg,
          response: tool.response,
        }),
      );
    }

    const { text } = await response;
    return { reply: text };
  },
);
