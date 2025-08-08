import type { Flashcard } from "@/common/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, X } from "lucide-react";
import { useEffect, useState } from "react";

interface FlashcardFormProps {
  flashcard?: Flashcard | null;
  onSave: (flashcard: Omit<Flashcard, "id" | "created_at" | "updated_at" | "user_id">) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function FlashcardForm({ flashcard, onSave, onCancel, isSaving = false }: FlashcardFormProps) {
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    source: "manual" as const,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!flashcard;

  useEffect(() => {
    if (flashcard) {
      setFormData({
        question: flashcard.question,
        answer: flashcard.answer,
        source: flashcard.source as "manual" | "ai" | "ai-edited",
      });
    }
  }, [flashcard]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.question.trim()) {
      newErrors.question = "Pytanie jest wymagane";
    }

    if (!formData.answer.trim()) {
      newErrors.answer = "Odpowiedź jest wymagana";
    }

    if (formData.question.trim().length > 500) {
      newErrors.question = "Pytanie nie może być dłuższe niż 500 znaków";
    }

    if (formData.answer.trim().length > 1000) {
      newErrors.answer = "Odpowiedź nie może być dłuższa niż 1000 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const flashcardData = {
      front: formData.question,
      back: formData.answer,
      question: formData.question,
      answer: formData.answer,
      source: formData.source,
      ease_factor: flashcard?.ease_factor || 2.5,
      repetitions: flashcard?.repetitions || 0,
      interval: flashcard?.interval || 1,
      next_review_at: flashcard?.next_review_at || new Date().toISOString(),
      source_text_id: flashcard?.source_text_id || null,
      state: flashcard?.state || 0,
    };

    onSave(flashcardData);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>{isEditing ? "Edytuj fiszkę" : "Dodaj nową fiszkę"}</span>
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "Zmodyfikuj treść swojej fiszki"
                : "Utwórz nową fiszkę do nauki"
              }
            </CardDescription>
          </div>
          <Button onClick={onCancel} variant="outline" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Source selection */}
          <div className="space-y-2">
            <Label htmlFor="source">Źródło</Label>
            <Select
              value={formData.source}
              onValueChange={(value) => handleInputChange("source", value)}
              disabled={isSaving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Ręczne</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="ai-edited">AI+Edycja</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <Label htmlFor="question">Pytanie *</Label>
            <Textarea
              id="question"
              placeholder="Wprowadź pytanie..."
              value={formData.question}
              onChange={(e) => handleInputChange("question", e.target.value)}
              disabled={isSaving}
              rows={3}
              className={errors.question ? "border-red-500" : ""}
            />
            {errors.question && (
              <p className="text-sm text-red-600">{errors.question}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.question.length}/500 znaków
            </p>
          </div>

          {/* Answer */}
          <div className="space-y-2">
            <Label htmlFor="answer">Odpowiedź *</Label>
            <Textarea
              id="answer"
              placeholder="Wprowadź odpowiedź..."
              value={formData.answer}
              onChange={(e) => handleInputChange("answer", e.target.value)}
              disabled={isSaving}
              rows={4}
              className={errors.answer ? "border-red-500" : ""}
            />
            {errors.answer && (
              <p className="text-sm text-red-600">{errors.answer}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.answer.length}/1000 znaków
            </p>
          </div>

          {/* Preview */}
          {(formData.question || formData.answer) && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Podgląd:</h4>
              {formData.question && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pytanie:</p>
                  <p className="text-sm">{formData.question}</p>
                </div>
              )}
              {formData.answer && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Odpowiedź:</p>
                  <p className="text-sm">{formData.answer}</p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <Button
              type="button"
              onClick={onCancel}
              variant="outline"
              disabled={isSaving}
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-black text-white hover:bg-gray-800"
            >
              {isSaving ? (
                "Zapisywanie..."
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Zapisz zmiany" : "Dodaj fiszkę"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 