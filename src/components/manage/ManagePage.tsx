import type { Flashcard } from "@/common/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";
import { DeleteConfirmation } from "./DeleteConfirmation";
import { FlashcardForm } from "./FlashcardForm";
import { FlashcardList } from "./FlashcardList";

type PageState = "list" | "add" | "edit" | "delete";

export function ManagePage() {
  const [pageState, setPageState] = useState<PageState>("list");
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      source: "manual",
      ease_factor: 2.3,
      repetitions: 2,
      interval: 6,
      next_review_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
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
      source: "ai-edited",
      ease_factor: 2.1,
      repetitions: 5,
      interval: 15,
      next_review_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source_text_id: null,
      user_id: "mock-user",
      state: 2,
    },
  ];

  const handleAddNew = () => {
    setSelectedFlashcard(null);
    setPageState("add");
    setError(null);
  };

  const handleEdit = (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setPageState("edit");
    setError(null);
  };

  const handleDelete = (flashcardId: string) => {
    const flashcard = mockFlashcards.find(f => f.id === flashcardId);
    if (flashcard) {
      setSelectedFlashcard(flashcard);
      setPageState("delete");
      setError(null);
    }
  };

  const handleSave = async (flashcardData: Omit<Flashcard, "id" | "created_at" | "updated_at" | "user_id">) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Na przyszłość - zapisywanie do bazy danych
      // await saveFlashcard(flashcardData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Flashcard saved:", flashcardData);
      
      // Return to list
      setPageState("list");
      setSelectedFlashcard(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił błąd podczas zapisywania");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedFlashcard) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Na przyszłość - usuwanie z bazy danych
      // await deleteFlashcard(selectedFlashcard.id);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log("Flashcard deleted:", selectedFlashcard.id);
      
      // Return to list
      setPageState("list");
      setSelectedFlashcard(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Wystąpił błąd podczas usuwania");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPageState("list");
    setSelectedFlashcard(null);
    setError(null);
  };

  // Render different states
  if (pageState === "add" || pageState === "edit") {
    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <FlashcardForm
          flashcard={pageState === "edit" ? selectedFlashcard : undefined}
          onSave={handleSave}
          onCancel={handleCancel}
          isSaving={isLoading}
        />
      </div>
    );
  }

  if (pageState === "delete" && selectedFlashcard) {
    return (
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DeleteConfirmation
          flashcard={selectedFlashcard}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancel}
          isDeleting={isLoading}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <FlashcardList
        flashcards={mockFlashcards}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddNew={handleAddNew}
      />
    </div>
  );
} 