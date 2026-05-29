import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { R2StorageService } from "@/lib/r2";
import { config } from "@/lib/config";

interface PresignRequest {
  userId?: string;
  fileNames: string[];
  contentTypes?: string[];
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
    const { userId, fileNames, contentTypes } = body;

    // Use 'anonymous' as fallback if userId is not provided
    const effectiveUserId = userId || "anonymous";

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames array is required and must not be empty" },
        { status: 400 },
      );
    }

    const uploads = await Promise.all(
      fileNames.map(async (originalName, index) => {
        const cleanName = originalName.trim().replace(/\s+/g, "-");
        const uniqueName = `${effectiveUserId}/${randomUUID()}-${cleanName}`;
        const contentType = contentTypes?.[index];

        const presigned = await r2.createPresignedUpload(uniqueName, {
          contentType: contentType,
          expiresIn: 3600,
        });

        return {
          fileName: cleanName,
          originalFilename: cleanName,
          uniqueFilename: uniqueName,
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
