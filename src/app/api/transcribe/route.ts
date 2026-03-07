// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import { transcribe } from "@/lib/transcribe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, targetLanguage, language, model } = body;

    if (!url) {
      return NextResponse.json({ message: "Audio URL is required" }, { status: 400 });
    }

    // Transcribe audio using the shared transcribe library
    const result = await transcribe({
      url,
      language: targetLanguage || language, // Support both field names
      model: model || "nova-3",
      smartFormat: true,
      paragraphs: true,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
