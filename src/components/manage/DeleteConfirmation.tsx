import type { Flashcard } from "@/common/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmationProps {
  flashcard: Flashcard;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export function DeleteConfirmation({ flashcard, onConfirm, onCancel, isDeleting = false }: DeleteConfirmationProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Usuń fiszkę</span>
          </CardTitle>
          <Button onClick={onCancel} variant="outline" size="sm">
            <X className="h-4 w-4 mr-1" />
            Zamknij
          </Button>
        </div>
        <CardDescription>
          Ta akcja nie może być cofnięta. Fiszka zostanie trwale usunięta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Flashcard preview */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pytanie:</p>
            <p className="text-sm">{flashcard.question}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Odpowiedź:</p>
            <p className="text-sm">{flashcard.answer}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            <strong>Uwaga:</strong> Usunięcie tej fiszki spowoduje utratę wszystkich danych o postępach w nauce, 
            w tym historii powtórzeń i algorytmu SRS.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <Button
            onClick={onCancel}
            variant="outline"
            disabled={isDeleting}
          >
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              "Usuwanie..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Tak, usuń fiszkę
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 