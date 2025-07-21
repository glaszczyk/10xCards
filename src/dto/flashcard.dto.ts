import type { FlashcardSource } from "../common/types";

// Union type dla obsługi dwóch scenariuszy
export type CreateFlashcardDto =
  | CreateManualFlashcardDto
  | CreateAIFlashcardsDto;

// Scenariusz 1: Ręczne tworzenie pojedynczej fiszki
export interface CreateManualFlashcardDto {
  mode: "manual";
  front: string;
  back: string;
  sourceTextId?: string; // opcjonalne powiązanie z istniejącym tekstem
}

// Scenariusz 2: AI generuje fiszki z tekstu (1-N fiszek)
export interface CreateAIFlashcardsDto {
  mode: "ai";
  textContent: string; // tekst do analizy przez AI
}

export interface UpdateFlashcardDto {
  front?: string;
  back?: string;
}

export interface FlashcardQueryDto {
  source?: FlashcardSource;
  sort?: "createdAt" | "updatedAt";
  order?: "asc" | "desc";
  page?: number;
  perPage?: number;
}

export interface FlashcardResponseDto {
  id: string;
  front: string;
  back: string;
  source: FlashcardSource;
  sourceTextId?: string;
  createdAt: string;
  updatedAt: string;
  easeFactor?: number;
  interval?: number;
  nextReviewAt?: string;
}

// Type guards for runtime validation
export const isCreateFlashcardDto = (
  dto: unknown
): dto is CreateFlashcardDto => {
  if (typeof dto !== "object" || dto === null) return false;

  const candidate = dto as CreateFlashcardDto;

  if (candidate.mode === "manual") {
    const { front, back } = candidate as CreateManualFlashcardDto;
    return (
      typeof front === "string" &&
      front.length <= 250 &&
      typeof back === "string" &&
      back.length <= 750
    );
  }

  if (candidate.mode === "ai") {
    const { textContent } = candidate as CreateAIFlashcardsDto;
    return (
      typeof textContent === "string" &&
      textContent.length > 0 &&
      textContent.length <= 10000
    );
  }

  return false;
};

export const isUpdateFlashcardDto = (
  dto: unknown
): dto is UpdateFlashcardDto => {
  if (typeof dto !== "object" || dto === null) return false;
  const { front, back } = dto as UpdateFlashcardDto;
  return (
    (front === undefined ||
      (typeof front === "string" && front.length <= 250)) &&
    (back === undefined || (typeof back === "string" && back.length <= 750))
  );
};

export const isFlashcardQueryDto = (dto: unknown): dto is FlashcardQueryDto => {
  if (typeof dto !== "object" || dto === null) return false;
  const { source, sort, order, page, perPage } = dto as FlashcardQueryDto;
  return (
    (source === undefined ||
      source === "ai" ||
      source === "manual" ||
      source === "ai-edited") &&
    (sort === undefined || sort === "createdAt" || sort === "updatedAt") &&
    (order === undefined || order === "asc" || order === "desc") &&
    (page === undefined || (typeof page === "number" && page > 0)) &&
    (perPage === undefined || (typeof perPage === "number" && perPage > 0))
  );
};
