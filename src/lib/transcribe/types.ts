export type Transcript = {
  id?: string;
  userId: string;
  sourceUrl: string;
  originalLanguage: string;
  targetLanguage: string;
  originalTranscript: any;
  translatedTranscript: any;
  status: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
};

export interface TranscriptObject {
  id: string;
  sourceUrl: string;
  duration: number;
  results: {
    main: {
      language: LanguageDetectionResultsEntry;
      text: string;
      words: Word[];
      paragraphs: Paragraph[];
    };
    translation?: {
      language: LanguageDetectionResultsEntry;
      text: string;
      words: Word[];
      paragraphs: Paragraph[];
    };
  };
  createdAt: Date;
}

export interface Word {
  word: string;
  start: number;
  end: number;
  confidence: number;
}

export type LanguageDetectionResults = LanguageDetectionResultsEntry[];

export interface LanguageDetectionResultsEntry {
  language: string;
  languageName: string;
  confidence?: number;
}

export interface Sentence {
  text: string;
  start: number;
  end: number;
}

export interface Paragraph {
  sentences: Sentence[];
  numWords: number;
  start: number;
  end: number;
}
