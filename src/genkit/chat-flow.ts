import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { getTools } from "./tools";
import { buildAssetInstruction, buildMessageContent } from "./utils";

export const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-2.5-flash"),
});

const SYSTEM_PROMPT = `You are a professional Multimodal Video Assistant.
Your goal is to help users analyze, explain, and edit their video projects.

CORE CAPABILITIES:
1. ANALYSIS: Use the provided media (video, audio, images) in the conversation to explain content, describe scenes, or answer questions.
2. EDITING: Use tools to modify the project (add/remove/update clips, transitions, and effects).
3. SEARCH: Find and add stock media from Pexels.
4. AUDIO: Generate voiceovers using ElevenLabs.
5. NAVIGATION: Move the playhead to specific times.

RULES:
- When asked to explain or describe, use your multimodal vision/hearing capabilities.
- When an edit is requested, use the appropriate tool.
- For NEW assets, generate a unique targetId (e.g., text_1738086000000_a7x). Default timing is 0-5s unless specified.
- Use the current playhead position [CURRENT_TIME] as a reference when adding assets if no specific time is mentioned.
- Respond naturally in the user's language. Do NOT expose internal IDs.`;

/* ---------------- FLOW ---------------- */

export const chatFlow = ai.defineFlow(
  {
    name: "chatFlow",
    inputSchema: z.object({
      message: z.string(),
      metadata: z
        .object({
          existingAssets: z.array(z.any()).optional(),
          selectedAssets: z.array(z.any()).optional(),
          currentTime: z.number().optional().describe("Current playhead position in seconds"),
        })
        .optional(),
    }),
    outputSchema: z.object({
      reply: z.string(),
    }),
    streamSchema: z.string(),
  },
  async ({ message, metadata }, { sendChunk }) => {
    const assets = metadata?.selectedAssets?.length
      ? metadata.selectedAssets
      : metadata?.existingAssets;
    const assetsContext = assets?.map(
      (asset, index) => buildAssetInstruction(asset, index === 0), // marcamos el primero como seleccionado
    );
    const context = (assetsContext || []).join("\n\n");
    const { stream, response } = ai.generateStream({
      system: SYSTEM_PROMPT,
      config: {
        thinkingConfig: {
          thinkingBudget: 2000,
          includeThoughts: true,
        },
      },
      prompt: `[CURRENT_TIME]: ${metadata?.currentTime || 0}s\n\n[CONTEXT]:\n${context}\n\n[USER]: ${message}`,
      ...(assets?.length
        ? {
            messages: [
              {
                role: "user",
                content: buildMessageContent(assets),
              },
            ],
          }
        : {}),
      tools: getTools(),
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
