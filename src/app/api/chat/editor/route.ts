import { chatFlow } from "@/genkit/chat-flow";
import { appRoute } from "@genkit-ai/next";

export const POST = appRoute(chatFlow);
