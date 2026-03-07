import { R2StorageService } from "@/lib/r2";
import { NextRequest, NextResponse } from "next/server";

// Note: Reusing SFX logic for Music as a placeholder or if using SFX "instrumental" capabilities.
// If a specific Music API becomes available, this should be updated.

const r2 = new R2StorageService({
  bucketName: process.env.R2_BUCKET_NAME || "",
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  cdn: process.env.R2_PUBLIC_DOMAIN || "",
});

export async function POST(req: NextRequest) {
  try {
    const { text, duration } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text/Description is required" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    // Using SFX endpoint for now as discussed
    const url = `${process.env.ELEVENLABS_URL}/v1/sound-generation`;

    const headers = {
      Accept: "audio/mpeg",
      "Content-Type": "application/json",
      "xi-api-key": apiKey || "",
    };

    const data = {
      text, // Prompt might need to be adjusted to encourage "musical" results
      duration_seconds: duration || undefined,
    };

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs Music/SFX API Error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate music", details: errorText },
        { status: response.status },
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `music/${Date.now()}.mp3`;
    const publicUrl = await r2.uploadData(fileName, buffer, "audio/mpeg");

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Music generation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
