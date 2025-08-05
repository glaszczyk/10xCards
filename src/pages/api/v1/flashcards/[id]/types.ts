import type { FlashcardSource } from "../../../../../common/types";

export interface FlashcardDetailResponse {
  id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  sourceTextId: string | null;
  createdAt: string;
  updatedAt: string;
  easeFactor: number | null;
  interval: number | null;
  nextReviewAt: string | null;
}

export interface ApiResponse<T> {
  data: T;
}

// PATCH /flashcards/:id types
export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
}

export interface UpdateFlashcardResponse {
  data: FlashcardDetailResponse;
}
