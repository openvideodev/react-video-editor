import { randomUUID } from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/lib/config";
import { R2StorageService } from "@/lib/r2";

interface PresignRequest {
  userId: string;
  fileNames: string[];
}

const r2 = new R2StorageService({
  bucketName: config.r2.bucket,
  accessKeyId: config.r2.accessKeyId,
  secretAccessKey: config.r2.secretAccessKey,
  accountId: config.r2.accountId,
  cdn: config.r2.cdn,
});

export async function POST(request: NextRequest) {
  try {
    const body: PresignRequest = await request.json();
    const { userId = "mockuser", fileNames } = body;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames array is required and must not be empty" },
        { status: 400 },
      );
    }

    const uploads = await Promise.all(
      fileNames.map(async (originalName) => {
        const cleanName = originalName.trim();
        const uniqueName = `${userId}/${randomUUID()}-${cleanName}`;

        const presigned = await r2.createPresignedUpload(uniqueName, {
          contentType: undefined,
          expiresIn: 3600,
        });

        return {
          fileName: cleanName,
          filePath: presigned.filePath,
          contentType: presigned.contentType,
          presignedUrl: presigned.presignedUrl,
          url: presigned.url,
        };
      }),
    );

    return NextResponse.json({ success: true, uploads });
  } catch (error) {
    console.error("Error in presign route:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
