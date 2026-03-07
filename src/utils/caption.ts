export function addParagraphIndexToWords(asrJson: any) {
  const paragraphs = asrJson.results.main.paragraphs;
  const words = asrJson.results.main.words;

  const newWords = words.map((word: any) => {
    const paragraphIndex = paragraphs.findIndex(
      (p: any) => word.start >= p.start && word.end <= p.end,
    );

    return {
      ...word,
      paragraphIndex: paragraphIndex !== -1 ? paragraphIndex : null,
    };
  });

  return {
    ...asrJson,
    results: {
      ...asrJson.results,
      main: {
        ...asrJson.results.main,
        words: newWords,
      },
    },
  };
}
export function buildParagraphsFromCaptions(captions: any[]) {
  const paragraphMap = new Map<number, any>();

  captions.forEach((caption) => {
    const words = caption?.opts?.words ?? [];
    if (words.length === 0) return;

    const paragraphIndex = words[0].paragraphIndex;
    if (paragraphIndex === null || paragraphIndex === undefined) return;

    if (!paragraphMap.has(paragraphIndex)) {
      paragraphMap.set(paragraphIndex, {
        paragraphIndex,
        words: [],
        from: Number.POSITIVE_INFINITY,
        to: 0,
      });
    }

    const paragraph = paragraphMap.get(paragraphIndex);

    // Add absolute timing to words for seeking and preserve original timing
    const wordsWithAbsTiming = words.map((w: any) => ({
      ...w,
      absFrom: caption.display.from + (w.from || 0) * 1000,
      absTo: caption.display.from + (w.to || 0) * 1000,
      start: w.start !== undefined ? w.start : caption.display.from / 1000000 + w.from / 1000,
      end: w.end !== undefined ? w.end : caption.display.from / 1000000 + w.to / 1000,
    }));

    paragraph.words.push(...wordsWithAbsTiming);

    paragraph.from = Math.min(paragraph.from, caption.display.from);
    paragraph.to = Math.max(paragraph.to, caption.display.to);
  });

  return Array.from(paragraphMap.values())
    .sort((a, b) => a.paragraphIndex - b.paragraphIndex)
    .map((p) => ({
      ...p,
      text: p.words.map((w: any) => w.text).join(" "),
    }));
}
