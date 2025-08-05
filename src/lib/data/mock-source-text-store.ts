import type { SourceTextWithFlashcardsResponse } from "../../pages/api/v1/source-texts/[id]/types";
import type { SourceTextResponse } from "../../pages/api/v1/source-texts/types";

// Wspólny store mocków dla source-texts
export const mockSourceTexts: SourceTextWithFlashcardsResponse[] = [
  {
    id: "text-123",
    textContent:
      "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i pozwala na tworzenie komponentów wielokrotnego użytku. React używa Virtual DOM do optymalizacji renderowania.",
    createdAt: "2024-01-15T10:00:00Z",
    flashcards: [
      {
        id: "123e4567-e89b-12d3-a456-426614174001",
        front: "What is React?",
        back: "A JavaScript library for building user interfaces.",
        source: "ai",
        createdAt: "2024-01-15T11:00:00Z",
        updatedAt: "2024-01-15T11:00:00Z",
      },
      {
        id: "123e4567-e89b-12d3-a456-426614174008",
        front: "What is the Virtual DOM?",
        back: "A lightweight copy of the actual DOM that React uses to optimize rendering.",
        source: "ai-edited",
        createdAt: "2024-01-15T18:00:00Z",
        updatedAt: "2024-01-15T19:00:00Z",
      },
    ],
    flashcardCount: 2,
  },
  {
    id: "text-124",
    textContent:
      "TypeScript to nadzbiór JavaScript, który dodaje opcjonalne typowanie statyczne. Pozwala na wczesne wykrywanie błędów i lepsze wsparcie IDE. TypeScript kompiluje się do czystego JavaScript.",
    createdAt: "2024-01-15T12:00:00Z",
    flashcards: [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        front: "What is TypeScript?",
        back: "A typed superset of JavaScript that compiles to plain JavaScript.",
        source: "manual",
        createdAt: "2024-01-15T10:30:00Z",
        updatedAt: "2024-01-15T10:30:00Z",
      },
    ],
    flashcardCount: 1,
  },
];

// CRUD helpers
export function getMockSourceTextById(
  id: string
): SourceTextWithFlashcardsResponse | null {
  return mockSourceTexts.find((text) => text.id === id) || null;
}

export function addMockSourceText(text: SourceTextResponse) {
  const newText: SourceTextWithFlashcardsResponse = {
    ...text,
    flashcards: [],
    flashcardCount: 0,
  };
  mockSourceTexts.unshift(newText);
}

export function updateMockSourceText(
  id: string,
  updates: Partial<Omit<SourceTextResponse, "id">>
) {
  const idx = mockSourceTexts.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  mockSourceTexts[idx] = { ...mockSourceTexts[idx], ...updates };
  return mockSourceTexts[idx];
}

export function deleteMockSourceText(id: string) {
  const idx = mockSourceTexts.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  mockSourceTexts.splice(idx, 1);
  return true;
}
