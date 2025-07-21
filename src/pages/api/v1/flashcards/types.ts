import type { FlashcardSource } from "../../../../common/types";

/**
 * Flashcard response DTO - format danych zwracanych przez API
 */
export interface FlashcardResponse {
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

/**
 * Query parameters for flashcards endpoint
 */
export interface FlashcardQuery {
  page?: number;
  perPage?: number;
  source?: FlashcardSource;
  sort?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
}

/**
 * API response for flashcards endpoint
 */
export interface FlashcardsResponse {
  data: FlashcardResponse[];
  meta: {
    pagination: PaginationMeta;
  };
}

/**
 * Default values for query parameters
 */
export const DEFAULT_QUERY_VALUES = {
  page: 1,
  perPage: 20,
  sort: "createdAt" as const,
  order: "desc" as const,
} as const;

/**
 * Maximum values for query parameters
 */
export const MAX_VALUES = {
  perPage: 100,
} as const;

// POST /flashcards types
export interface CreateManualFlashcardDto {
  mode: "manual";
  front: string;
  back: string;
  sourceTextId?: string;
}

export interface CreateAIFlashcardsDto {
  mode: "ai";
  textContent: string;
}

export type CreateFlashcardDto =
  | CreateManualFlashcardDto
  | CreateAIFlashcardsDto;

export interface CreateFlashcardResponse {
  data: FlashcardResponse[];
  meta: {
    sourceTextId?: string;
    generatedCount: number;
    mode: "manual" | "ai";
  };
}
