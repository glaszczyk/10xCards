import type { Database } from "@/db/database.types";

// Re-export z common/types.ts dla zgodności
export type {
  ApiError,
  ApiResponse,
  AuthContext,
  EventType,
  FlashcardSource,
} from "@/common/types";

// Database types
export type Tables = Database["public"]["Tables"];
export type FlashcardRow = Tables["flashcards"]["Row"];
export type SourceTextRow = Tables["source_texts"]["Row"];
export type EventLogRow = Tables["event_logs"]["Row"];

// Extended types for UI components
export type { Flashcard } from "@/common/types";

export interface FlashcardForReview extends Flashcard {
  isReviewTime: boolean;
  daysSinceLastReview: number;
}

export interface GeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  status: "viewing" | "editing" | "saving";
}

export interface SessionStats {
  total: number;
  completed: number;
  easy: number;
  hard: number;
  repeat: number;
}

// Component state types
export interface LoginState {
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  formData: { email: string; password: string };
}

export interface RegisterState {
  status: "idle" | "loading" | "error" | "success";
  error: string | null;
  formData: { email: string; password: string; confirmPassword: string };
  validationErrors: Record<string, string>;
}

export interface GenerateState {
  sourceText: string;
  sourceTextId: string | null;
  generatedCards: GeneratedFlashcard[];
  status: "idle" | "generating" | "error";
  error: string | null;
  mode: "input" | "review";
}

export interface LearningState {
  flashcards: FlashcardForReview[];
  currentIndex: number;
  status: "idle" | "loading" | "error" | "active" | "completed";
  error: string | null;
  sessionStats: SessionStats;
  cardState: "front" | "back" | "rating";
}

export interface ManageState {
  flashcards: Flashcard[];
  status: "idle" | "loading" | "error" | "loaded";
  error: string | null;
  activeAction: {
    type: "edit" | "delete" | null;
    cardId: string | null;
  };
}

// Universal Error component props
export interface UniversalErrorProps {
  errorType: "404" | "500" | "network" | "generic";
  message?: string;
  showRetry?: boolean;
  onRetry?: () => void;
}

// User session types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: User | null;
  profile: Profile | null; // Nowe pole
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshProfile: () => Promise<void>; // Nowa funkcja
}
