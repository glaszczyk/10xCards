import type {
  EventLogQuery,
  EventLogsResponse,
} from "../../pages/api/v1/event-logs/types";
import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";
import type {
  SourceTextResponse,
  SourceTextWithFlashcardsResponse,
} from "../../pages/api/v1/source-texts/[id]/types";
import type {
  DataProvider,
  FlashcardCreateAIData,
  FlashcardCreateData,
  FlashcardCreateResponse,
  FlashcardListResponse,
  FlashcardQuery,
  FlashcardUpdateData,
  SourceTextCreateData,
  SourceTextListResponse,
  SourceTextQuery,
} from "./interface";
import { getEventLogSummary, getMockEventLogs } from "./mock-event-log-store";
import {
  addMockFlashcard,
  deleteMockFlashcard,
  mockFlashcards,
  updateMockFlashcard,
} from "./mock-flashcard-store";
import {
  addMockSourceText,
  deleteMockSourceText,
  getMockSourceTextById,
  mockSourceTexts,
  updateMockSourceText,
} from "./mock-source-text-store";

export class MockProvider implements DataProvider {
  async getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Filter by source if specified
    let filtered = query.source
      ? mockFlashcards.filter((card) => card.source === query.source)
      : mockFlashcards;

    // Sort the data
    filtered = [...filtered].sort((a, b) => {
      const aValue = query.sort === "createdAt" ? a.createdAt : a.updatedAt;
      const bValue = query.sort === "createdAt" ? b.createdAt : b.updatedAt;

      return query.order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    // Apply pagination
    const startIndex = (query.page - 1) * query.perPage;
    const endIndex = startIndex + query.perPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        pagination: {
          total: filtered.length,
          page: query.page,
          perPage: query.perPage,
        },
      },
    };
  }

  async createManualFlashcard(
    data: FlashcardCreateData
  ): Promise<FlashcardResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));

    const newId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    const newCard: FlashcardResponse = {
      id: newId,
      front: data.front,
      back: data.back,
      source: "manual",
      sourceTextId: data.sourceTextId || null,
      createdAt: now,
      updatedAt: now,
      easeFactor: null,
      interval: null,
      nextReviewAt: null,
    };

    // Add to global mock store
    addMockFlashcard(newCard);

    return newCard;
  }

  async createAIFlashcards(
    data: FlashcardCreateAIData
  ): Promise<FlashcardCreateResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Mock AI generuje 2-4 fiszki na podstawie tekstu
    const mockCards = [
      {
        front: "What is the main topic of this text?",
        back: "This text discusses various programming concepts and technologies.",
      },
      {
        front: "What are the key benefits mentioned?",
        back: "Improved productivity, better code quality, and enhanced developer experience.",
      },
      {
        front: "What technologies are discussed?",
        back: "TypeScript, React, Astro, Supabase, and other modern web development tools.",
      },
    ];

    const sourceTextId = `text-${Date.now()}`;
    const now = new Date().toISOString();

    const newCards: FlashcardResponse[] = mockCards.map((card, index) => {
      const newId = `mock-ai-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;

      return {
        id: newId,
        front: card.front,
        back: card.back,
        source: "ai" as const,
        sourceTextId,
        createdAt: now,
        updatedAt: now,
        easeFactor: 2.5,
        interval: 1,
        nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      };
    });

    // Add to global mock store
    newCards.forEach(addMockFlashcard);

    return {
      data: newCards,
      meta: {
        sourceTextId,
        generatedCount: newCards.length,
        mode: "ai",
      },
    };
  }

  async getFlashcardById(id: string): Promise<FlashcardResponse | null> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return mockFlashcards.find((card) => card.id === id) || null;
  }

  async updateFlashcard(
    id: string,
    data: FlashcardUpdateData
  ): Promise<FlashcardResponse | null> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));
    return updateMockFlashcard(id, data);
  }

  async deleteFlashcard(id: string): Promise<boolean> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));
    return deleteMockFlashcard(id);
  }

  async isHealthy(): Promise<boolean> {
    // Mock provider is always healthy
    return true;
  }

  // Source text operations
  async getSourceTexts(
    query: SourceTextQuery
  ): Promise<SourceTextListResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Sort the data
    const sorted = [...mockSourceTexts].sort((a, b) => {
      const aValue = a.createdAt;
      const bValue = b.createdAt;

      return query.order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    // Apply pagination
    const startIndex = (query.page - 1) * query.perPage;
    const endIndex = startIndex + query.perPage;
    const paginatedData = sorted.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      meta: {
        pagination: {
          total: sorted.length,
          page: query.page,
          perPage: query.perPage,
        },
      },
    };
  }

  async getSourceTextById(
    id: string
  ): Promise<SourceTextWithFlashcardsResponse | null> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));
    return getMockSourceTextById(id);
  }

  async createSourceText(
    data: SourceTextCreateData
  ): Promise<SourceTextResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));

    const newId = `text-${Date.now()}`;
    const now = new Date().toISOString();

    const newText: SourceTextResponse = {
      id: newId,
      textContent: data.textContent,
      createdAt: now,
    };

    addMockSourceText(newText);
    return newText;
  }

  async updateSourceText(
    id: string,
    data: Partial<SourceTextCreateData>
  ): Promise<SourceTextResponse | null> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));
    return updateMockSourceText(id, data);
  }

  async deleteSourceText(id: string): Promise<boolean> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 50));
    return deleteMockSourceText(id);
  }

  async getEventLogs(query: EventLogQuery): Promise<EventLogsResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    const { data: eventLogs, total } = getMockEventLogs(
      query.page || 1,
      query.perPage || 20,
      query.eventType,
      query.severity,
      query.startDate,
      query.endDate
    );

    const summary = getEventLogSummary();

    return {
      data: eventLogs,
      meta: {
        pagination: {
          total,
          page: query.page || 1,
          perPage: query.perPage || 20,
        },
        summary,
      },
    };
  }
}
