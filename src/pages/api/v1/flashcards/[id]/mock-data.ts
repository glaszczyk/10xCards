import type { FlashcardDetailResponse } from "./types";

export const mockFlashcards: FlashcardDetailResponse[] = [
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

export function getMockFlashcardById(id: string) {
  return mockFlashcards.find((card) => card.id === id) || null;
}

// PATCH /flashcards/:id mock function
export function updateMockFlashcard(
  id: string,
  updates: { front?: string; back?: string }
): FlashcardDetailResponse | null {
  const cardIndex = mockFlashcards.findIndex((card) => card.id === id);
  if (cardIndex === -1) return null;

  const updatedCard = {
    ...mockFlashcards[cardIndex],
    ...updates,
    updatedAt: new Date().toISOString(),
    source: "ai-edited" as const, // Zmiana źródła na ai-edited po edycji
  };

  // W mocku nie modyfikujemy oryginalnej tablicy, tylko zwracamy zaktualizowany obiekt
  return updatedCard;
}

// DELETE /flashcards/:id mock function
export function deleteMockFlashcard(id: string): boolean {
  const cardIndex = mockFlashcards.findIndex((card) => card.id === id);
  if (cardIndex === -1) return false;

  // W mocku nie usuwamy z oryginalnej tablicy, tylko zwracamy true/false
  return true;
}
