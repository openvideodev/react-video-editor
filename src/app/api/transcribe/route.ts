// app/api/transcribe/route.ts
import { NextResponse } from "next/server";
import { transcribe } from "@/lib/transcribe";
import { config } from "@/lib/config";
import { generateUUID } from "@/utils/id";
import { R2StorageService } from "@/lib/r2";

const r2 = new R2StorageService({
  bucketName: config.r2.bucket,
  accessKeyId: config.r2.accessKeyId,
  secretAccessKey: config.r2.secretAccessKey,
  accountId: config.r2.accountId,
  cdn: config.r2.cdn,
});

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

    let transcriptionUrl = null;
    if (body.saveToR2) {
      const fileName = `transcription-${generateUUID()}.json`;
      const fileBuffer = Buffer.from(JSON.stringify(result));
      transcriptionUrl = await r2.uploadData(fileName, fileBuffer, "application/json");
    }

    return NextResponse.json({ ...result, url: transcriptionUrl }, { status: 200 });
  } catch (error) {
    console.error("Transcription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
