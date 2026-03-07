export interface UploadResult {
  fileName: string;
  filePath: string;
  contentType: string;
  presignedUrl: string;
  url: string;
}

export const uploadFile = async (file: File): Promise<UploadResult> => {
  // 1. Get presigned URL
  const response = await fetch("/api/uploads/presign", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileNames: [file.name],
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to get presigned URL");
  }

  const { uploads } = await response.json();
  const uploadConfig = uploads[0];

  // 2. Upload to R2
  const uploadResponse = await fetch(uploadConfig.presignedUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to storage");
  }

  return uploadConfig;
};
