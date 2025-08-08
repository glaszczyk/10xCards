import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Flashcard } from "@/types";
import { Edit, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { useState } from "react";

interface ManualFlashcardFormProps {
  onSave: (flashcards: Flashcard[]) => Promise<void>;
  onBack: () => void;
  onGenerateAI: () => void;
  sourceText?: string;
  isSaving?: boolean;
}

export function ManualFlashcardForm({ onSave, onBack, onGenerateAI, sourceText, isSaving = false }: ManualFlashcardFormProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddCard = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      setError("Both question and answer are required");
      return;
    }

    const newCard: Flashcard = {
      id: `temp-${Date.now()}`,
      question: currentQuestion.trim(),
      answer: currentAnswer.trim(),
      source: "manual" as const,
      ease_factor: 2.5,
      repetitions: 0,
      interval: 0,
      next_review_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setFlashcards(prev => [...prev, newCard]);
    setCurrentQuestion("");
    setCurrentAnswer("");
    setError(null);
  };

  const handleEditCard = (index: number) => {
    setEditingIndex(index);
    setCurrentQuestion(flashcards[index].question);
    setCurrentAnswer(flashcards[index].answer);
  };

  const handleSaveEdit = () => {
    if (!currentQuestion.trim() || !currentAnswer.trim()) {
      setError("Both question and answer are required");
      return;
    }

    setFlashcards(prev => 
      prev.map((card, i) => 
        i === editingIndex! 
          ? { ...card, question: currentQuestion.trim(), answer: currentAnswer.trim() }
          : card
      )
    );

    setEditingIndex(null);
    setCurrentQuestion("");
    setCurrentAnswer("");
    setError(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setCurrentQuestion("");
    setCurrentAnswer("");
    setError(null);
  };

  const handleDeleteCard = (index: number) => {
    setFlashcards(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveAll = async () => {
    if (flashcards.length === 0) {
      setError("Add at least one flashcard before saving");
      return;
    }

    try {
      await onSave(flashcards);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save flashcards");
    }
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      const importedCards: Flashcard[] = lines.map((line, index) => {
        const [question = "", answer = ""] = line.split(',').map(s => s.trim());
        return {
          id: `temp-import-${Date.now()}-${index}`,
          question,
          answer,
          source: "manual" as const,
          ease_factor: 2.5,
          repetitions: 0,
          interval: 0,
          next_review_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }).filter(card => card.question && card.answer);

      setFlashcards(prev => [...prev, ...importedCards]);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Create Flashcards Manually</h2>
          <p className="text-muted-foreground">
            Add flashcards one by one or import from CSV file.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onBack} variant="outline">
            Back
          </Button>
          <Button onClick={onGenerateAI} variant="outline">
            Generate with AI
          </Button>
          <Button onClick={handleSaveAll} disabled={isSaving || flashcards.length === 0}>
            {isSaving ? "Saving..." : `Save ${flashcards.length} Cards`}
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
              The text you're creating flashcards from
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{sourceText}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Import from CSV</span>
          </CardTitle>
          <CardDescription>
            Upload a CSV file with format: question,answer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="csv-import">Choose CSV file</Label>
            <Input
              id="csv-import"
              type="file"
              accept=".csv"
              onChange={handleCSVImport}
              className="cursor-pointer"
            />
            <p className="text-xs text-muted-foreground">
              CSV format: "Question text","Answer text"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Add New Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add New Card</span>
          </CardTitle>
          <CardDescription>
            Create a new flashcard manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              placeholder="Enter the question..."
              value={currentQuestion}
              onChange={(e) => setCurrentQuestion(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              placeholder="Enter the answer..."
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              rows={4}
            />
          </div>

          <Button onClick={handleAddCard} className="font-semibold bg-black text-white hover:bg-gray-800">
            <Plus className="h-4 w-4 mr-2" />
            Add Card
          </Button>
        </CardContent>
      </Card>

      {/* Cards List */}
      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Cards ({flashcards.length})</CardTitle>
            <CardDescription>
              Review and edit your flashcards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {flashcards.map((card, index) => (
                <div key={card.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Card {index + 1}</h4>
                    <div className="flex items-center space-x-2">
                      {editingIndex === index ? (
                        <>
                          <Button onClick={handleSaveEdit} size="sm">
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button onClick={handleCancelEdit} variant="outline" size="sm">
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button onClick={() => handleEditCard(index)} variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDeleteCard(index)} 
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Question:</Label>
                    <div className="p-2 bg-muted rounded text-sm">
                      {editingIndex === index ? (
                        <Textarea
                          value={currentQuestion}
                          onChange={(e) => setCurrentQuestion(e.target.value)}
                          rows={2}
                          className="text-sm"
                        />
                      ) : (
                        card.question
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Answer:</Label>
                    <div className="p-2 bg-muted rounded text-sm">
                      {editingIndex === index ? (
                        <Textarea
                          value={currentAnswer}
                          onChange={(e) => setCurrentAnswer(e.target.value)}
                          rows={3}
                          className="text-sm"
                        />
                      ) : (
                        card.answer
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 