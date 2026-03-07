import { detectLanguage } from "./detect-language";
import type { Paragraph, TranscriptObject, Word } from "./types";

const getWords = (deepgramResult: any): Word[] => {
  const alternative = deepgramResult?.results?.channels?.[0]?.alternatives?.[0];
  if (!alternative?.words) {
    return [];
  }

  return alternative.words.map((w: any) => {
    return {
      word: w.punctuated_word,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    };
  });
};

const getParagraphs = (deepgramResult: any): Paragraph[] => {
  const alternative = deepgramResult?.results?.channels?.[0]?.alternatives?.[0];
  if (!alternative?.paragraphs?.paragraphs) {
    return [];
  }

  const paragraphs = alternative.paragraphs.paragraphs
    .map((p: any) => {
      return {
        sentences: p.sentences.map((s: any) => {
          return {
            text: s.text,
            start: s.start,
            end: s.end,
          };
        }),
        numWords: p.num_words,
        start: p.start,
        end: p.end,
      };
    })
    .filter((p: any) => p.sentences.length > 0);

  return paragraphs;
};

export async function deepgramToCombo(
  deepgramResult: any,
): Promise<Partial<TranscriptObject> | null> {
  const alternative = deepgramResult?.results?.channels?.[0]?.alternatives?.[0];
  const text = alternative?.transcript;

  if (!text) {
    return null;
  }

  const language = await detectLanguage(text);
  const words = getWords(deepgramResult);
  const duration = deepgramResult?.metadata?.duration || 0;
  const paragraphs = getParagraphs(deepgramResult);

  return {
    duration,
    results: {
      main: {
        language,
        paragraphs,
        text,
        words,
      },
    },
  };
}
