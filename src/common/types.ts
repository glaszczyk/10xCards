import type { Database } from "../db/database.types";

export type UserRole = "authenticated";

export interface AuthContext {
  userId: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      total: number;
      page: number;
      perPage: number;
    };
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type FlashcardSource = "ai" | "manual" | "ai-edited";

export type EventType =
  | "aiCardCreated"
  | "aiEditedCardCreated"
  | "manualCardCreated"
  | "aiCardReviewed"
  | "cardEdited"
  | "cardDeleted";

export type Tables = Database["public"]["Tables"];
export type FlashcardRow = Tables["flashcards"]["Row"];
export type SourceTextRow = Tables["source_texts"]["Row"];
export type EventLogRow = Tables["event_logs"]["Row"];

// Alias dla kompatybilności z komponentami
export interface Flashcard extends FlashcardRow {
  question: string; // alias dla front
  answer: string; // alias dla back

  // TODO: FUTURE MIGRATION - Add SRS fields to database
  // These fields are currently optional but will be required in future migrations:
  // - repetitions: number (number of times card has been reviewed)
  // - state: number (SRS state: 0=new, 1=learning, 2=review, 3=relearning)
  // Migration needed: ALTER TABLE flashcards ADD COLUMN repetitions INTEGER DEFAULT 0, ADD COLUMN state INTEGER DEFAULT 0;
  repetitions?: number; // opcjonalne pole dla SRS
  state?: number; // opcjonalne pole dla SRS
}
