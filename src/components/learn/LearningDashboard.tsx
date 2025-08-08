import type { Flashcard } from "@/common/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SRSAlgorithm } from "@/lib/srs";
import { BookOpen, Clock, Play, TrendingUp } from "lucide-react";
import { useState } from "react";

interface LearningDashboardProps {
  flashcards: Flashcard[];
  onStartSession: (cards: Flashcard[]) => void;
}

export function LearningDashboard({ flashcards, onStartSession }: LearningDashboardProps) {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Filtruj fiszki gotowe do powtórki
  const readyCards = flashcards.filter(card => SRSAlgorithm.isReadyForReview(card));
  const newCards = flashcards.filter(card => card.repetitions === 0);
  const learningCards = flashcards.filter(card => card.repetitions > 0 && card.repetitions <= 2);
  const matureCards = flashcards.filter(card => card.repetitions > 2);

  const handleSelectAll = () => {
    if (selectedCards.size === readyCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(readyCards.map(card => card.id)));
    }
  };

  const handleSelectCard = (cardId: string) => {
    const newSelected = new Set(selectedCards);
    if (newSelected.has(cardId)) {
      newSelected.delete(cardId);
    } else {
      newSelected.add(cardId);
    }
    setSelectedCards(newSelected);
  };

  const handleStartSession = () => {
    const cardsToStudy = readyCards.filter(card => selectedCards.has(card.id));
    if (cardsToStudy.length > 0) {
      onStartSession(cardsToStudy);
    }
  };

  const getCardStats = () => {
    const total = flashcards.length;
    const ready = readyCards.length;
    const newCount = newCards.length;
    const learning = learningCards.length;
    const mature = matureCards.length;

    return { total, ready, newCount, learning, mature };
  };

  const stats = getCardStats();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Nauka fiszek</h1>
        <p className="text-muted-foreground">
          Wybierz fiszki do powtórki i rozpocznij sesję nauki
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Wszystkie</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.ready}</div>
                <div className="text-sm text-muted-foreground">Gotowe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Play className="h-5 w-5 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.newCount}</div>
                <div className="text-sm text-muted-foreground">Nowe</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">{stats.learning}</div>
                <div className="text-sm text-muted-foreground">Uczące się</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.mature}</div>
                <div className="text-sm text-muted-foreground">Dojrzałe</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready Cards Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fiszki gotowe do powtórki</CardTitle>
              <CardDescription>
                {readyCards.length} fiszek czeka na powtórkę
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleSelectAll}
                variant="outline"
                size="sm"
              >
                {selectedCards.size === readyCards.length ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
              </Button>
              <Button
                onClick={handleStartSession}
                disabled={selectedCards.size === 0}
                className="bg-black text-white hover:bg-gray-800"
              >
                Rozpocznij sesję ({selectedCards.size})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {readyCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Brak fiszek gotowych do powtórki!</p>
              <p className="text-sm">Wszystkie fiszki zostały już przejrzane na dzisiaj.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {readyCards.map((card) => (
                <Card
                  key={card.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCards.has(card.id)
                      ? 'ring-2 ring-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectCard(card.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {SRSAlgorithm.getKnowledgeLevel(card)}
                      </Badge>
                      <input
                        type="checkbox"
                        checked={selectedCards.has(card.id)}
                        onChange={() => handleSelectCard(card.id)}
                        className="mt-1"
                      />
                    </div>
                    <h4 className="font-medium mb-2 line-clamp-2">{card.question}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">{card.answer}</p>
                    <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                      <span>Powtórzenia: {card.repetitions}</span>
                      <span>Postęp: {SRSAlgorithm.calculateProgress(card)}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Cards Info */}
      {(newCards.length > 0 || learningCards.length > 0 || matureCards.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Pozostałe fiszki</CardTitle>
            <CardDescription>
              Fiszki, które nie są jeszcze gotowe do powtórki
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {newCards.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Nowe fiszki</h4>
                  <p className="text-sm text-blue-700 mb-2">{newCards.length} fiszek</p>
                  <p className="text-xs text-blue-600">
                    Fiszki, które jeszcze nie były powtarzane
                  </p>
                </div>
              )}

              {learningCards.length > 0 && (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-900 mb-2">Uczące się</h4>
                  <p className="text-sm text-orange-700 mb-2">{learningCards.length} fiszek</p>
                  <p className="text-xs text-orange-600">
                    Fiszki w trakcie nauki (1-2 powtórzenia)
                  </p>
                </div>
              )}

              {matureCards.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Dojrzałe</h4>
                  <p className="text-sm text-green-700 mb-2">{matureCards.length} fiszek</p>
                  <p className="text-xs text-green-600">
                    Fiszki z długimi interwałami powtórzeń
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 