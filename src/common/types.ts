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
