import type {
  EventLogQuery,
  EventLogsResponse,
} from "../../pages/api/v1/event-logs/types";
import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";
import type { SourceTextWithFlashcardsResponse } from "../../pages/api/v1/source-texts/[id]/types";
import type { SourceTextResponse } from "../../pages/api/v1/source-texts/types";

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

export interface FlashcardUpdateData {
  front?: string;
  back?: string;
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

export interface SourceTextQuery {
  page: number;
  perPage: number;
  sort: "createdAt";
  order: "asc" | "desc";
}

export interface SourceTextCreateData {
  textContent: string;
}

export interface SourceTextListResponse {
  data: SourceTextResponse[];
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
  getFlashcardById(id: string): Promise<FlashcardResponse | null>;
  createManualFlashcard(data: FlashcardCreateData): Promise<FlashcardResponse>;
  createAIFlashcards(
    data: FlashcardCreateAIData
  ): Promise<FlashcardCreateResponse>;
  updateFlashcard(
    id: string,
    data: FlashcardUpdateData
  ): Promise<FlashcardResponse | null>;
  deleteFlashcard(id: string): Promise<boolean>;

  // Source text operations
  getSourceTexts(query: SourceTextQuery): Promise<SourceTextListResponse>;
  getSourceTextById(
    id: string
  ): Promise<SourceTextWithFlashcardsResponse | null>;
  createSourceText(data: SourceTextCreateData): Promise<SourceTextResponse>;
  updateSourceText(
    id: string,
    data: Partial<SourceTextCreateData>
  ): Promise<SourceTextResponse | null>;
  deleteSourceText(id: string): Promise<boolean>;

  // Event log operations
  getEventLogs(query: EventLogQuery): Promise<EventLogsResponse>;

  // Health check
  isHealthy(): Promise<boolean>;
}
