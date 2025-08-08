import type { Flashcard } from "@/common/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SRSAlgorithm } from "@/lib/srs";
import { BookOpen, Clock, Edit, Filter, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";

interface FlashcardListProps {
  flashcards: Flashcard[];
  onEdit: (flashcard: Flashcard) => void;
  onDelete: (flashcardId: string) => void;
  onAddNew: () => void;
}

export function FlashcardList({ flashcards, onEdit, onDelete, onAddNew }: FlashcardListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Filtrowanie fiszek
  const filteredFlashcards = flashcards.filter((card) => {
    const matchesSearch = 
      card.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSource = filterSource === "all" || card.source === filterSource;
    
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "ready" && SRSAlgorithm.isReadyForReview(card)) ||
      (filterStatus === "new" && card.repetitions === 0) ||
      (filterStatus === "learning" && card.repetitions > 0 && card.repetitions <= 2) ||
      (filterStatus === "mature" && card.repetitions > 2);

    return matchesSearch && matchesSource && matchesStatus;
  });

  const getStatusBadge = (card: Flashcard) => {
    if (card.repetitions === 0) {
      return <Badge variant="secondary">Nowa</Badge>;
    }
    if (SRSAlgorithm.isReadyForReview(card)) {
      return <Badge variant="default" className="bg-green-100 text-green-800">Gotowa</Badge>;
    }
    if (card.repetitions <= 2) {
      return <Badge variant="outline">Ucząca się</Badge>;
    }
    return <Badge variant="secondary">Dojrzała</Badge>;
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "ai":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">AI</Badge>;
      case "manual":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">Ręczna</Badge>;
      case "ai-edited":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">AI+Edycja</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header z akcjami */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Twoje fiszki</h2>
          <p className="text-muted-foreground">
            Zarządzaj i edytuj swoje fiszki
          </p>
        </div>
        <Button onClick={onAddNew} className="bg-black text-white hover:bg-gray-800">
          <Plus className="h-4 w-4 mr-2" />
          Dodaj fiszkę
        </Button>
      </div>

      {/* Filtry i wyszukiwanie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtry i wyszukiwanie</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj fiszek..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger>
                <SelectValue placeholder="Źródło" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie źródła</SelectItem>
                <SelectItem value="ai">AI</SelectItem>
                <SelectItem value="manual">Ręczne</SelectItem>
                <SelectItem value="ai-edited">AI+Edycja</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="ready">Gotowe do powtórki</SelectItem>
                <SelectItem value="new">Nowe</SelectItem>
                <SelectItem value="learning">Uczące się</SelectItem>
                <SelectItem value="mature">Dojrzałe</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center justify-center">
              {filteredFlashcards.length} z {flashcards.length} fiszek
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista fiszek */}
      <div className="space-y-4">
        {filteredFlashcards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Brak fiszek</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterSource !== "all" || filterStatus !== "all" 
                  ? "Nie znaleziono fiszek pasujących do filtrów"
                  : "Nie masz jeszcze żadnych fiszek. Zacznij od ich utworzenia!"
                }
              </p>
              {!searchTerm && filterSource === "all" && filterStatus === "all" && (
                <Button onClick={onAddNew} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Dodaj pierwszą fiszkę
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredFlashcards.map((card) => (
            <Card key={card.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Badges */}
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(card)}
                      {getSourceBadge(card.source)}
                      <Badge variant="outline" className="text-xs">
                        {SRSAlgorithm.getKnowledgeLevel(card)}
                      </Badge>
                    </div>

                    {/* Question */}
                    <div>
                      <h3 className="font-medium text-lg mb-1">Pytanie:</h3>
                      <p className="text-muted-foreground">{card.question}</p>
                    </div>

                    {/* Answer */}
                    <div>
                      <h4 className="font-medium mb-1">Odpowiedź:</h4>
                      <p className="text-muted-foreground">{card.answer}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{SRSAlgorithm.getTimeUntilNextReview(card)}</span>
                      </div>
                      <span>Powtórzenia: {card.repetitions}</span>
                      <span>Postęp: {SRSAlgorithm.calculateProgress(card)}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => onEdit(card)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edytuj
                    </Button>
                    <Button
                      onClick={() => onDelete(card.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Usuń
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 