import type { FlashcardResponse } from "../../pages/api/v1/flashcards/types";

// Wspólny store mocków dla wszystkich endpointów
export const mockFlashcards: FlashcardResponse[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    front: "What is TypeScript?",
    back: "A typed superset of JavaScript that compiles to plain JavaScript.",
    source: "manual",
    sourceTextId: null,
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    easeFactor: 2.5,
    interval: 1,
    nextReviewAt: "2024-01-16T10:30:00Z",
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    front: "What is React?",
    back: "A JavaScript library for building user interfaces.",
    source: "ai",
    sourceTextId: "text-123",
    createdAt: "2024-01-15T11:00:00Z",
    updatedAt: "2024-01-15T11:00:00Z",
    easeFactor: 2.0,
    interval: 2,
    nextReviewAt: "2024-01-17T11:00:00Z",
  },
];

// CRUD helpers
export function getMockFlashcardById(id: string) {
  return mockFlashcards.find((card) => card.id === id) || null;
}

export function addMockFlashcard(card: FlashcardResponse) {
  mockFlashcards.unshift(card);
}

export function updateMockFlashcard(
  id: string,
  updates: Partial<Omit<FlashcardResponse, "id">>
) {
  const idx = mockFlashcards.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  mockFlashcards[idx] = {
    ...mockFlashcards[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return mockFlashcards[idx];
}

export function deleteMockFlashcard(id: string) {
  const idx = mockFlashcards.findIndex((c) => c.id === id);
  if (idx === -1) return false;
  mockFlashcards.splice(idx, 1);
  return true;
}
