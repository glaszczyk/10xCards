import type { FlashcardSource } from "../../../../../common/types";

export interface SourceTextResponse {
  id: string;
  textContent: string;
  createdAt: string;
}

export interface SourceTextWithFlashcardsResponse {
  id: string;
  textContent: string;
  createdAt: string;
  flashcards: {
    id: string;
    front: string;
    back: string;
    source: FlashcardSource;
    createdAt: string;
    updatedAt: string;
  }[];
  flashcardCount: number;
}

export interface ApiResponse<T> {
  data: T;
}
