import { detectAll } from "tinyld";
import type { LanguageDetectionResults } from "./types";

export async function detectLanguage(text: string) {
  const tinyldResults = detectAll(text);

  const results: LanguageDetectionResults = tinyldResults.map((result) => ({
    language: result.lang,
    languageName: languageCodeToName(result.lang),
    confidence: result.accuracy,
  }));

  const [mainLanguage] = results;

  if (mainLanguage.language === "und") {
    mainLanguage.language = "en";
    mainLanguage.languageName = "English";
  }

  return mainLanguage;
}

export function languageCodeToName(languageCode: string) {
  const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

  let translatedLanguageName: string | undefined;

  try {
    translatedLanguageName = languageNames.of(languageCode);
  } catch (e) {}

  return translatedLanguageName || "Unknown";
}
