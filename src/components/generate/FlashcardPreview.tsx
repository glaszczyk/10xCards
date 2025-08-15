import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Flashcard } from "@/types";
import { ChevronLeft, ChevronRight, Edit, Plus, Save, Trash2, X } from "lucide-react";
import { useState } from "react";

interface FlashcardPreviewProps {
  flashcards: Flashcard[];
  sourceText?: string;
  onSave: (flashcards: Flashcard[]) => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
}

export function FlashcardPreview({ flashcards, sourceText, onSave, onBack, isSaving = false }: FlashcardPreviewProps) {
  const [editableCards, setEditableCards] = useState<Flashcard[]>(flashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Dodajemy status dla każdej fiszki
  const [cardStatuses, setCardStatuses] = useState<Record<string, 'draft' | 'accepted' | 'rejected'>>(
    flashcards.reduce((acc, card) => ({ ...acc, [card.id]: 'draft' }), {})
  );

  const currentCard = editableCards[currentIndex];

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSave = (index: number) => {
    setEditingIndex(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    // Reset to original flashcards
    setEditableCards(flashcards);
  };

  const handleCardChange = (index: number, field: keyof Flashcard, value: string) => {
    setEditableCards(prev => 
      prev.map((card, i) => 
        i === index ? { ...card, [field]: value } : card
      )
    );
  };

  const handleAddCard = () => {
    const newCard: Flashcard = {
      id: `temp-${Date.now()}`,
      front: "",
      back: "",
      question: "",
      answer: "",
      source: "ai-edited",
      user_id: "temp-user-id", // TODO: Replace with actual user ID from auth context
      source_text_id: null,
      ease_factor: 2.5,
      interval: 0,
      next_review_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // TODO: FUTURE MIGRATION - These fields will be moved to database
      // Current: temporary values for SRS algorithm compatibility
      // Future: values will come from database after migration
      repetitions: 0, // opcjonalne pole dla SRS
      state: 0 // opcjonalne pole dla SRS
    };
    setEditableCards(prev => [...prev, newCard]);
    setCurrentIndex(editableCards.length); // Go to new card
  };

  const handleDeleteCard = (index: number) => {
    setEditableCards(prev => prev.filter((_, i) => i !== index));
    if (currentIndex >= editableCards.length - 1) {
      setCurrentIndex(Math.max(0, editableCards.length - 2));
    }
  };

  const handleAcceptCard = (index: number) => {
    const cardId = editableCards[index].id;
    setCardStatuses(prev => ({ ...prev, [cardId]: 'accepted' }));
  };

  const handleRejectCard = (index: number) => {
    const cardId = editableCards[index].id;
    setCardStatuses(prev => ({ ...prev, [cardId]: 'rejected' }));
  };

  const handleResetCard = (index: number) => {
    const cardId = editableCards[index].id;
    setCardStatuses(prev => ({ ...prev, [cardId]: 'draft' }));
  };

  const handleSaveAll = async () => {
    try {
      // Get only accepted cards
      const acceptedCards = editableCards.filter(card => cardStatuses[card.id] === 'accepted');
      
      if (acceptedCards.length === 0) {
        setError("No cards have been accepted. Please accept at least one card before saving.");
        return;
      }

      // Validate that all accepted cards have content
      const hasEmptyCards = acceptedCards.some(card => !card.question.trim() || !card.answer.trim());
      if (hasEmptyCards) {
        setError("All accepted cards must have both question and answer");
        return;
      }

      await onSave(acceptedCards);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save flashcards");
    }
  };

  if (editableCards.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Flashcards Generated</CardTitle>
          <CardDescription>
            No flashcards were generated. Please try again with different text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="outline">
            Back to Generator
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Review & Edit Flashcards</h2>
          <p className="text-muted-foreground">
            Review and edit your generated flashcards before saving them.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <Button onClick={handleAddCard} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
                              <Button onClick={handleSaveAll} disabled={isSaving}>
                      {isSaving ? "Saving..." : `Save ${editableCards.filter(card => cardStatuses[card.id] === 'accepted').length} Accepted Cards`}
                    </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Source Text Section */}
      {sourceText && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>📄</span>
              <span>Source Text</span>
            </CardTitle>
            <CardDescription>
              The text used to generate these flashcards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{sourceText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        
        <span className="text-sm text-muted-foreground">
          Card {currentIndex + 1} of {editableCards.length}
        </span>
        
        <Button
          variant="outline"
          onClick={() => setCurrentIndex(Math.min(editableCards.length - 1, currentIndex + 1))}
          disabled={currentIndex === editableCards.length - 1}
        >
          Next
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Flashcard */}
      <Card className="w-full">
                          <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CardTitle>Flashcard {currentIndex + 1}</CardTitle>
                        {cardStatuses[currentCard.id] === 'accepted' && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            ✓ Accepted
                          </span>
                        )}
                        {cardStatuses[currentCard.id] === 'rejected' && (
                          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                            ✗ Rejected
                          </span>
                        )}
                        {cardStatuses[currentCard.id] === 'draft' && (
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            📝 Draft
                          </span>
                        )}
                      </div>
                                <div className="flex items-center space-x-2">
                      {editingIndex === currentIndex ? (
                        <>
                          <Button onClick={() => handleSave(currentIndex)} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={handleCancel} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEdit(currentIndex)} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          {cardStatuses[currentCard.id] === 'accepted' ? (
                            <Button 
                              onClick={() => handleResetCard(currentIndex)} 
                              variant="outline" 
                              size="sm"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Reset
                            </Button>
                          ) : cardStatuses[currentCard.id] === 'rejected' ? (
                            <Button 
                              onClick={() => handleResetCard(currentIndex)} 
                              variant="outline" 
                              size="sm"
                              className="text-orange-600 hover:text-orange-700"
                            >
                              Reset
                            </Button>
                          ) : (
                            <>
                              <Button 
                                onClick={() => handleAcceptCard(currentIndex)} 
                                variant="outline" 
                                size="sm"
                                className="text-green-600 hover:text-green-700"
                              >
                                Accept
                              </Button>
                              <Button 
                                onClick={() => handleRejectCard(currentIndex)} 
                                variant="outline" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button 
                            onClick={() => handleDeleteCard(currentIndex)} 
                            variant="outline" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            {editingIndex === currentIndex ? (
              <Textarea
                id="question"
                value={currentCard.question}
                onChange={(e) => handleCardChange(currentIndex, "question", e.target.value)}
                rows={3}
                placeholder="Enter the question..."
              />
            ) : (
              <div className="p-3 bg-muted rounded-md min-h-[60px]">
                {currentCard.question || "No question"}
              </div>
            )}
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            {editingIndex === currentIndex ? (
              <Textarea
                id="answer"
                value={currentCard.answer}
                onChange={(e) => handleCardChange(currentIndex, "answer", e.target.value)}
                rows={4}
                placeholder="Enter the answer..."
              />
            ) : (
              <div className="p-3 bg-muted rounded-md min-h-[80px]">
                {currentCard.answer || "No answer"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Summary:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {editableCards.length} flashcards ready to save</li>
          <li>• {editableCards.filter(card => card.question.trim() && card.answer.trim()).length} cards have content</li>
          <li>• {editableCards.filter(card => !card.question.trim() || !card.answer.trim()).length} cards need content</li>
        </ul>
      </div>
    </div>
  );
} 