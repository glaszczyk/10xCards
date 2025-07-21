import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";
import type {
  DataProvider,
  FlashcardCreateAIData,
  FlashcardCreateData,
  FlashcardCreateResponse,
  FlashcardListResponse,
  FlashcardQuery,
} from "./interface";

/**
 * Mock data for flashcards endpoint testing
 * These simulate real flashcards with various sources and states
 */
const mockFlashcards: FlashcardResponse[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    front: "What is TypeScript?",
    back: "A typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, classes, and modules to JavaScript.",
    source: "manual",
    sourceTextId: null,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    easeFactor: null,
    interval: null,
    nextReviewAt: null,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    front: "What is React?",
    back: "A JavaScript library for building user interfaces, particularly single-page applications. It's used for handling the view layer and can be used for developing both web and mobile applications.",
    source: "ai",
    sourceTextId: "text-123",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T11:00:00Z",
    easeFactor: 2.5,
    interval: 1,
    nextReviewAt: "2024-01-16T11:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174002",
    front: "What is Astro?",
    back: "A modern static site generator that allows you to use your favorite JavaScript framework (React, Vue, Svelte, etc.) to build fast websites with less JavaScript.",
    source: "ai-edited",
    sourceTextId: "text-124",
    createdAt: "2024-01-15T12:00:00Z",
    updatedAt: "2024-01-15T14:30:00Z",
    easeFactor: 2.0,
    interval: 3,
    nextReviewAt: "2024-01-18T12:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174003",
    front: "What is Supabase?",
    back: "An open-source Firebase alternative that provides a PostgreSQL database, authentication, instant APIs, and real-time subscriptions.",
    source: "manual",
    sourceTextId: null,
    createdAt: "2024-01-15T13:00:00Z",
    updatedAt: "2024-01-15T13:00:00Z",
    easeFactor: null,
    interval: null,
    nextReviewAt: null,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174004",
    front: "What is Tailwind CSS?",
    back: "A utility-first CSS framework for rapidly building custom user interfaces. It provides low-level utility classes that let you build completely custom designs without ever leaving your HTML.",
    source: "ai",
    sourceTextId: "text-125",
    createdAt: "2024-01-15T14:00:00Z",
    updatedAt: "2024-01-15T14:00:00Z",
    easeFactor: 2.3,
    interval: 2,
    nextReviewAt: "2024-01-17T14:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174005",
    front: "What is Zod?",
    back: "A TypeScript-first schema declaration and validation library. It's designed to be developer-friendly and provides excellent TypeScript inference.",
    source: "ai-edited",
    sourceTextId: "text-126",
    createdAt: "2024-01-15T15:00:00Z",
    updatedAt: "2024-01-15T16:00:00Z",
    easeFactor: 1.8,
    interval: 5,
    nextReviewAt: "2024-01-20T15:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174006",
    front: "What is the difference between let, const, and var in JavaScript?",
    back: "let: block-scoped, can be reassigned; const: block-scoped, cannot be reassigned; var: function-scoped, can be reassigned, hoisted. Use const by default, let when you need to reassign, avoid var.",
    source: "manual",
    sourceTextId: null,
    createdAt: "2024-01-15T16:00:00Z",
    updatedAt: "2024-01-15T16:00:00Z",
    easeFactor: null,
    interval: null,
    nextReviewAt: null,
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174007",
    front: "What is a Promise in JavaScript?",
    back: "A Promise is an object representing the eventual completion or failure of an asynchronous operation. It has three states: pending, fulfilled, and rejected.",
    source: "ai",
    sourceTextId: "text-127",
    createdAt: "2024-01-15T17:00:00Z",
    updatedAt: "2024-01-15T17:00:00Z",
    easeFactor: 2.1,
    interval: 1,
    nextReviewAt: "2024-01-16T17:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174008",
    front: "What is the Virtual DOM?",
    back: "A lightweight copy of the actual DOM that React uses to optimize rendering. It allows React to batch multiple DOM updates and only apply the necessary changes to the real DOM.",
    source: "ai-edited",
    sourceTextId: "text-128",
    createdAt: "2024-01-15T18:00:00Z",
    updatedAt: "2024-01-15T19:00:00Z",
    easeFactor: 1.9,
    interval: 4,
    nextReviewAt: "2024-01-19T18:00:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174009",
    front: "What is REST API?",
    back: "Representational State Transfer (REST) is an architectural style for designing networked applications. It uses HTTP methods (GET, POST, PUT, DELETE) to perform CRUD operations on resources.",
    source: "manual",
    sourceTextId: null,
    createdAt: "2024-01-15T19:00:00Z",
    updatedAt: "2024-01-15T19:00:00Z",
    easeFactor: null,
    interval: null,
    nextReviewAt: null,
  },
];

export class MockProvider implements DataProvider {
  async getFlashcards(query: FlashcardQuery): Promise<FlashcardListResponse> {
    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Filter by source if specified
    let filtered = query.source
      ? mockFlashcards.filter((card) => card.source === query.source)
      : mockFlashcards;

    // Sort the data
    filtered.sort((a, b) => {
      const aValue = query.sort === "createdAt" ? a.createdAt : a.updatedAt;
      const bValue = query.sort === "createdAt" ? b.createdAt : b.updatedAt;

      if (query.order === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
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

    // Add to mock data (in a real implementation, this would persist)
    mockFlashcards.unshift(newCard);

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

    // Add to mock data (in a real implementation, this would persist)
    mockFlashcards.unshift(...newCards);

    return {
      data: newCards,
      meta: {
        sourceTextId,
        generatedCount: newCards.length,
        mode: "ai",
      },
    };
  }

  async isHealthy(): Promise<boolean> {
    // Mock provider is always healthy
    return true;
  }
}
