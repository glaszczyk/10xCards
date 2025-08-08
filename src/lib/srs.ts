import { FSRS, Rating, State } from "ts-fsrs";

// Inicjalizacja FSRS z domyślnymi parametrami
const fsrs = new FSRS();

export interface SRSData {
  ease_factor: number | null;
  repetitions: number;
  interval: number | null;
  next_review_at: string | null;
  state: State;
}

export interface SRSRating {
  rating: 1 | 2 | 3 | 4; // Again, Hard, Good, Easy
  review_time: number; // czas w sekundach
}

/**
 * Wrapper dla ts-fsrs z prostszym API
 */
export class SRSAlgorithm {
  /**
   * Oblicza nowe parametry SRS na podstawie oceny użytkownika
   */
  static calculateNextReview(currentData: SRSData, rating: SRSRating): SRSData {
    // Konwertuj nasze dane na format ts-fsrs
    const card = {
      due: new Date(currentData.next_review_at || new Date()),
      stability: currentData.interval || 0,
      difficulty: currentData.ease_factor || 2.5,
      elapsed_days: 0, // TODO: obliczyć rzeczywisty czas
      scheduled_days: 0,
      reps: currentData.repetitions,
      lapses: 0, // TODO: śledzić lapses
      state: currentData.state,
      learning_steps: 0,
      last_review: undefined,
    };

    // Oblicz nowe parametry
    const result = fsrs.repeat(card, rating.rating as Rating);
    const newCard = result[rating.rating.toString()].card;

    return {
      ease_factor: newCard.difficulty,
      repetitions: newCard.reps,
      interval: newCard.stability,
      next_review_at: newCard.due.toISOString(),
      state: newCard.state,
    };
  }

  /**
   * Inicjalizuje dane SRS dla nowej fiszki
   */
  static initializeSRSData(): SRSData {
    const card = fsrs.createEmptyCard();

    return {
      ease_factor: card.difficulty,
      repetitions: card.reps,
      interval: card.stability,
      next_review_at: card.due.toISOString(),
      state: card.state,
    };
  }

  /**
   * Sprawdza czy fiszka jest gotowa do powtórki
   */
  static isReadyForReview(srsData: SRSData): boolean {
    if (!srsData.next_review_at) return true;
    const now = new Date();
    const nextReview = new Date(srsData.next_review_at);
    return now >= nextReview;
  }

  /**
   * Oblicza procent postępu w nauce
   */
  static calculateProgress(srsData: SRSData): number {
    // Procent oparty na liczbie powtórzeń i ease factor
    const maxRepetitions = 10; // arbitralny limit
    const repetitionProgress = Math.min(
      srsData.repetitions / maxRepetitions,
      1
    );
    const easeFactor = srsData.ease_factor || 2.5;
    const easeProgress = Math.min((easeFactor - 1.3) / (2.5 - 1.3), 1);

    return Math.round((repetitionProgress * 0.7 + easeProgress * 0.3) * 100);
  }

  /**
   * Zwraca opis poziomu znajomości
   */
  static getKnowledgeLevel(srsData: SRSData): string {
    if (srsData.repetitions === 0) return "Nowa";
    if (srsData.repetitions <= 2) return "Ucząca się";
    if (srsData.repetitions <= 5) return "Znana";
    if (srsData.repetitions <= 10) return "Dobra";
    return "Mistrzowska";
  }

  /**
   * Oblicza czas do następnej powtórki
   */
  static getTimeUntilNextReview(srsData: SRSData): string {
    if (!srsData.next_review_at) return "Gotowa do powtórki";

    const now = new Date();
    const nextReview = new Date(srsData.next_review_at);
    const diffMs = nextReview.getTime() - now.getTime();

    if (diffMs <= 0) return "Gotowa do powtórki";

    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Jutro";
    if (diffDays < 7) return `Za ${diffDays} dni`;
    if (diffDays < 30) return `Za ${Math.ceil(diffDays / 7)} tygodni`;
    return `Za ${Math.ceil(diffDays / 30)} miesięcy`;
  }

  /**
   * Zwraca opis oceny
   */
  static getRatingDescription(rating: number): string {
    switch (rating) {
      case 1:
        return "Again";
      case 2:
        return "Hard";
      case 3:
        return "Good";
      case 4:
        return "Easy";
      default:
        return "Unknown";
    }
  }

  /**
   * Zwraca kolor dla oceny
   */
  static getRatingColor(rating: number): string {
    switch (rating) {
      case 1:
        return "text-red-600 bg-red-100";
      case 2:
        return "text-orange-600 bg-orange-100";
      case 3:
        return "text-green-600 bg-green-100";
      case 4:
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  }
}
