export const calculateFrames = (display: { from: number; to: number }, fps: number) => {
  const from = (display.from / 1_000_000) * fps;
  const durationInFrames = (display.to / 1_000_000) * fps - from;
  return { from, durationInFrames };
};
