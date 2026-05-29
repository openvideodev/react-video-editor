export const config = {
  deepgram: {
    url: process.env.DEEPGRAM_URL || "https://api.deepgram.com/v1",
    model: process.env.DEEPGRAM_MODEL || "nova-2",
    key: process.env.DEEPGRAM_API_KEY as string,
  },
  r2: {
    bucket: process.env.R2_BUCKET_NAME as string,
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
    accountId: process.env.R2_ACCOUNT_ID as string,
    cdn: process.env.R2_PUBLIC_DOMAIN as string,
  },
  pexels: {
    url: process.env.PEXELS_URL || "https://api.pexels.com",
    key: process.env.PEXELS_API_KEY as string,
  },
  elevenLabs: {
    url: process.env.ELEVENLABS_URL || "https://api.elevenlabs.io",
    key: process.env.ELEVENLABS_API_KEY as string,
    model: process.env.ELEVENLABS_MODEL || "eleven_multilingual_sts_v2",
    workerUrl: process.env.ELEVENLABS_WORKER_URL as string,
  },
};
