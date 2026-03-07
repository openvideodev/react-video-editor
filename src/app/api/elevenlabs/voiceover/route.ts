import { R2StorageService } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

const r2 = new R2StorageService({
  bucketName: process.env.R2_BUCKET_NAME || "",
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  cdn: process.env.R2_PUBLIC_DOMAIN || "",
});

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId = "21m00Tcm4TlvDq8ikWAM" } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
    const url = `${process.env.ELEVENLABS_URL}/v1/text-to-speech/${voiceId}`;

    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey || "",
    };

    const data = {
      text,
      model_id: model,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate voiceover", details: errorText },
        { status: response.status },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `voiceovers/${Date.now()}.mp3`;
    const publicUrl = await r2.uploadData(fileName, buffer, "audio/mpeg");

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Voiceover generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
