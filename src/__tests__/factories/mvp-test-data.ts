import type { Flashcard, FlashcardRow, Tables } from "@/common/types";

type ProfileRow = Tables["profiles"]["Row"];
type FlashcardRowFromDB = Tables["flashcards"]["Row"];

// Minimal test data for MVP - zgodnie z planem testów
export class MVPTestData {
  static createFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
    return {
      id: "test-id-1",
      front: "Test Question?",
      back: "Test Answer",
      question: "Test Question?", // alias dla front
      answer: "Test Answer", // alias dla back
      source: "ai",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: "test-user-1",
      source_text_id: null,
      ease_factor: 2.5,
      interval: 1,
      next_review_at: new Date().toISOString(),
      repetitions: 0,
      state: 0,
      ...overrides,
    };
  }

  static createUser(overrides: Partial<ProfileRow> = {}): ProfileRow {
    return {
      id: "test-user-1",
      email: "test@example.com",
      full_name: "Test User",
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createSRSCard(
    overrides: Partial<FlashcardRowFromDB> = {}
  ): FlashcardRowFromDB {
    return {
      id: "test-srs-1",
      front: "Test Question?",
      back: "Test Answer",
      source: "ai",
      user_id: "test-user-1",
      source_text_id: null,
      ease_factor: 2.5,
      interval: 1,
      next_review_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...overrides,
    };
  }

  static createFlashcardList(count: number = 3): Flashcard[] {
    return Array.from({ length: count }, (_, index) =>
      this.createFlashcard({
        id: `test-id-${index + 1}`,
        front: `Test Question ${index + 1}?`,
        back: `Test Answer ${index + 1}`,
        question: `Test Question ${index + 1}?`,
        answer: `Test Answer ${index + 1}`,
      })
    );
  }

  static createUserWithSession() {
    return {
      user: this.createUser(),
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    };
  }

  static createAIGenerationResponse(count: number = 3) {
    return {
      flashcards: this.createFlashcardList(count).map((card) => ({
        ...card,
        source: "ai" as const,
      })),
    };
  }

  static createErrorResponse(message: string, status: number = 400) {
    return {
      error: message,
      status,
    };
  }
}
