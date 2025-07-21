import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";

export interface FlashcardQuery {
  page: number;
  perPage: number;
  source?: "ai" | "manual" | "ai-edited";
  sort: "createdAt" | "updatedAt";
  order: "asc" | "desc";
}

export interface FlashcardCreateData {
  front: string;
  back: string;
  sourceTextId?: string;
}

export interface FlashcardCreateAIData {
  textContent: string;
}

export interface FlashcardCreateResponse {
  data: FlashcardResponse[];
  meta: {
    sourceTextId?: string;
    generatedCount: number;
    mode: "manual" | "ai";
  };
}

export interface FlashcardListResponse {
  data: FlashcardResponse[];
  meta: {
    pagination: {
      total: number;
      page: number;
      perPage: number;
    };
  };
}

export interface DataProvider {
  // Flashcard operations
  getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse>;
  createManualFlashcard(data: FlashcardCreateData): Promise<FlashcardResponse>;
  createAIFlashcards(
    data: FlashcardCreateAIData
  ): Promise<FlashcardCreateResponse>;

  // Health check
  isHealthy(): Promise<boolean>;
}
