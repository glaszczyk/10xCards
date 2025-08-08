import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface GenerateFormProps {
  onGenerate: (data: GenerateFormData) => Promise<void>;
  onCreateManual: () => void;
  isGenerating?: boolean;
}

export interface GenerateFormData {
  sourceText: string;
  cardCount: number;
  cardType: "basic" | "detailed" | "mcq";
  language: string;
}

export function GenerateForm({ onGenerate, onCreateManual, isGenerating = false }: GenerateFormProps) {
  const [formData, setFormData] = useState<GenerateFormData>({
    sourceText: "",
    cardCount: 5,
    cardType: "basic",
    language: "en"
  });
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof GenerateFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user starts typing
  };

  const validateForm = (): boolean => {
    if (!formData.sourceText.trim()) {
      setError("Please enter some text to generate flashcards from");
      return false;
    }
    
    if (formData.sourceText.trim().length < 1000) {
      setError("Text should be at least 1000 characters long for better results");
      return false;
    }
    
    if (formData.sourceText.trim().length > 10000) {
      setError("Text should not exceed 10000 characters for optimal AI processing");
      return false;
    }
    
    if (formData.cardCount < 1 || formData.cardCount > 20) {
      setError("Number of cards should be between 1 and 20");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onGenerate(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to generate flashcards");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Generate Flashcards with AI</CardTitle>
        <CardDescription>
          Enter your text and let AI create flashcards for you. You can choose the type and number of cards.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6 relative" noValidate>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Source Text */}
          <div className="space-y-2">
            <Label htmlFor="sourceText">Source Text</Label>
            <Textarea
              id="sourceText"
              placeholder="Paste your text here. It can be from a book, article, notes, or any educational content..."
              value={formData.sourceText}
              onChange={(e) => handleInputChange("sourceText", e.target.value)}
              disabled={isGenerating}
              rows={8}
              className="resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Minimum 1000 characters. Longer texts generally produce better flashcards.
              </p>
              <p className={`text-xs ${
                formData.sourceText.length > 10000 
                  ? 'text-destructive' 
                  : formData.sourceText.length > 8000 
                    ? 'text-orange-500' 
                    : 'text-muted-foreground'
              }`}>
                {formData.sourceText.length}/10000 characters
              </p>
            </div>
          </div>

          {/* Options Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Count */}
            <div className="space-y-2">
              <Label htmlFor="cardCount">Number of Cards</Label>
              <Select
                value={formData.cardCount.toString()}
                onValueChange={(value) => handleInputChange("cardCount", parseInt(value))}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  {[3, 5, 8, 10, 12, 15, 20].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} cards
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Card Type */}
            <div className="space-y-2">
              <Label htmlFor="cardType">Card Type</Label>
              <Select
                value={formData.cardType}
                onValueChange={(value) => handleInputChange("cardType", value as "basic" | "detailed" | "mcq")}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="basic">Basic Q&A</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange("language", value)}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg">
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="pl">Polish</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-between items-center">
            <div></div>
            <Button 
              type="submit" 
              className={`font-semibold bg-black text-white hover:bg-gray-800 ${isGenerating ? 'min-h-[60px]' : ''}`}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" text="Generating flashcards..." />
              ) : (
                "Generate with AI"
              )}
            </Button>
            <Button 
              type="button"
              variant="ghost"
              onClick={onCreateManual}
              disabled={isGenerating}
              size="lg"
            >
              Create Manual
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">💡 Tips for better results:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use clear, well-structured text</li>
              <li>• Include key concepts and definitions</li>
              <li>• Longer texts (200+ characters) work better</li>
              <li>• Choose the right card type for your content</li>
            </ul>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 