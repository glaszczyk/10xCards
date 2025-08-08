import type { Flashcard } from "@/common/types";
import { useState } from "react";
import { LearningDashboard } from "./LearningDashboard";
import { LearningSession } from "./LearningSession";

interface SessionStats {
  totalCards: number;
  reviewedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageRating: number;
  sessionTime: number;
}

type PageState = "dashboard" | "session";

export function LearnPage() {
  const [pageState, setPageState] = useState<PageState>("dashboard");
  const [sessionCards, setSessionCards] = useState<Flashcard[]>([]);

  // Mock dane - w przyszłości będą pobierane z API
  const mockFlashcards: Flashcard[] = [
    {
      id: "1",
      front: "Co to jest SRS?",
      back: "Spaced Repetition System - system powtórek rozłożonych w czasie",
      question: "Co to jest SRS?",
      answer: "Spaced Repetition System - system powtórek rozłożonych w czasie",
      source: "ai",
      ease_factor: 2.5,
      repetitions: 0,
      interval: 1,
      next_review_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_text_id: null,
      user_id: "mock-user",
      state: 0,
    },
    {
      id: "2",
      front: "Jakie są główne zalety fiszek?",
      back: "Aktywne przypominanie, efektywne wykorzystanie czasu, długotrwałe zapamiętywanie",
      question: "Jakie są główne zalety fiszek?",
      answer: "Aktywne przypominanie, efektywne wykorzystanie czasu, długotrwałe zapamiętywanie",
      source: "ai",
      ease_factor: 2.3,
      repetitions: 2,
      interval: 6,
      next_review_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // wczoraj
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_text_id: null,
      user_id: "mock-user",
      state: 1,
    },
    {
      id: "3",
      front: "Co oznacza ease factor w SRS?",
      back: "Współczynnik łatwości - określa jak łatwo jest zapamiętać daną fiszkę",
      question: "Co oznacza ease factor w SRS?",
      answer: "Współczynnik łatwości - określa jak łatwo jest zapamiętać daną fiszkę",
      source: "ai",
      ease_factor: 2.1,
      repetitions: 5,
      interval: 15,
      next_review_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // za 2 dni
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_text_id: null,
      user_id: "mock-user",
      state: 2,
    },
  ];

  const handleStartSession = (cards: Flashcard[]) => {
    setSessionCards(cards);
    setPageState("session");
  };

  const handleSessionComplete = (stats: SessionStats) => {
    console.log("Session completed:", stats);
    // TODO: Zapisz statystyki sesji do bazy danych
    setPageState("dashboard");
  };

  const handleSessionExit = () => {
    setPageState("dashboard");
  };

  // Usunięto handleBack - teraz używamy nawigacji w header

  if (pageState === "session") {
    return (
      <LearningSession
        flashcards={sessionCards}
        onComplete={handleSessionComplete}
        onExit={handleSessionExit}
      />
    );
  }

  return (
    <LearningDashboard
      flashcards={mockFlashcards}
      onStartSession={handleStartSession}
    />
  );
} 