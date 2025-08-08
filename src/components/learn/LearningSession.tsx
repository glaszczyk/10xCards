import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SRSAlgorithm } from "@/lib/srs";
import type { Flashcard } from "@/types";
import { CheckCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";

interface LearningSessionProps {
  flashcards: Flashcard[];
  onComplete: (sessionStats: SessionStats) => void;
  onExit: () => void;
}

interface SessionStats {
  totalCards: number;
  reviewedCards: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageRating: number;
  sessionTime: number;
}

type SessionState = "question" | "answer" | "rating" | "complete";

export function LearningSession({ flashcards, onComplete, onExit }: LearningSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("question");
  const [startTime] = useState(Date.now());
  const [reviewStartTime, setReviewStartTime] = useState<number | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalCards: flashcards.length,
    reviewedCards: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageRating: 0,
    sessionTime: 0,
  });

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;

  useEffect(() => {
    if (sessionState === "question") {
      setReviewStartTime(Date.now());
    }
  }, [currentIndex, sessionState]);

  const handleShowAnswer = () => {
    setSessionState("answer");
  };

  const handleRate = (rating: 1 | 2 | 3 | 4) => {
    if (!reviewStartTime) return;

    const reviewTime = Math.floor((Date.now() - reviewStartTime) / 1000);
    
    // Aktualizuj statystyki sesji
    const isCorrect = rating >= 3;
    const newStats = {
      ...sessionStats,
      reviewedCards: sessionStats.reviewedCards + 1,
      correctAnswers: sessionStats.correctAnswers + (isCorrect ? 1 : 0),
      incorrectAnswers: sessionStats.incorrectAnswers + (isCorrect ? 0 : 1),
      averageRating: (sessionStats.averageRating * sessionStats.reviewedCards + rating) / (sessionStats.reviewedCards + 1),
    };

    setSessionStats(newStats);

    // TODO: Zaktualizuj dane SRS w bazie danych
    // const newSRSData = SRSAlgorithm.calculateNextReview(currentCard, { rating, review_time: reviewTime });
    // await updateFlashcardSRS(currentCard.id, newSRSData);

    // Przejdź do następnej fiszki lub zakończ sesję
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSessionState("question");
    } else {
      // Sesja zakończona
      const finalStats = {
        ...newStats,
        sessionTime: Math.floor((Date.now() - startTime) / 1000),
      };
      setSessionStats(finalStats);
      setSessionState("complete");
    }
  };

  const handleComplete = () => {
    onComplete(sessionStats);
  };

  if (sessionState === "complete") {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <span>Sesja zakończona!</span>
          </CardTitle>
          <CardDescription>
            Świetna praca! Oto podsumowanie Twojej sesji nauki.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Statystyki sesji */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{sessionStats.correctAnswers}</div>
              <div className="text-sm text-green-700">Poprawne</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{sessionStats.incorrectAnswers}</div>
              <div className="text-sm text-red-700">Błędne</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Przejrzane fiszki:</span>
              <span className="font-semibold">{sessionStats.reviewedCards}/{sessionStats.totalCards}</span>
            </div>
            <div className="flex justify-between">
              <span>Średnia ocena:</span>
              <span className="font-semibold">{sessionStats.averageRating.toFixed(1)}/4</span>
            </div>
            <div className="flex justify-between">
              <span>Czas sesji:</span>
              <span className="font-semibold">{Math.floor(sessionStats.sessionTime / 60)}m {sessionStats.sessionTime % 60}s</span>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button onClick={handleComplete} className="flex-1">
              Zakończ sesję
            </Button>
            <Button onClick={onExit} variant="outline">
              Wyjdź
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Postęp sesji</span>
          <span>{currentIndex + 1} z {flashcards.length}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fiszka {currentIndex + 1}</span>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{SRSAlgorithm.getTimeUntilNextReview(currentCard)}</span>
            </div>
          </CardTitle>
          <CardDescription>
            Poziom: {SRSAlgorithm.getKnowledgeLevel(currentCard)} • 
            Postęp: {SRSAlgorithm.calculateProgress(currentCard)}%
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question */}
          <div className="space-y-2">
            <h3 className="font-medium text-muted-foreground">Pytanie:</h3>
            <div className="p-4 bg-muted rounded-lg min-h-[100px] flex items-center">
              <p className="text-lg">{currentCard.question}</p>
            </div>
          </div>

          {/* Answer (hidden until shown) */}
          {sessionState === "answer" && (
            <div className="space-y-2">
              <h3 className="font-medium text-muted-foreground">Odpowiedź:</h3>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg min-h-[100px] flex items-center">
                <p className="text-lg">{currentCard.answer}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {sessionState === "question" && (
              <Button onClick={handleShowAnswer} size="lg">
                Pokaż odpowiedź
              </Button>
            )}

            {sessionState === "answer" && (
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleRate(1)}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Again
                </Button>
                <Button
                  onClick={() => handleRate(2)}
                  variant="outline"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  Hard
                </Button>
                <Button
                  onClick={() => handleRate(3)}
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  Good
                </Button>
                <Button
                  onClick={() => handleRate(4)}
                  variant="outline"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Easy
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Session controls */}
      <div className="flex justify-between">
        <Button onClick={onExit} variant="outline">
          Wyjdź z sesji
        </Button>
        <div className="text-sm text-muted-foreground">
          Poprawne: {sessionStats.correctAnswers} | Błędne: {sessionStats.incorrectAnswers}
        </div>
      </div>
    </div>
  );
} 