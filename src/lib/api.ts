import type {
  ApiError,
  ApiResponse,
  FlashcardRow,
  SourceTextRow,
} from "@/types";

// Base API configuration
const API_BASE_URL = "/api/v1";

// Generic API error handler
class ApiErrorHandler extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Generic fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;

      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.error.message || errorMessage;
      } catch {
        // If JSON parsing fails, use generic message
      }

      throw new ApiErrorHandler(errorMessage, response.status);
    }

    const data: ApiResponse<T> = await response.json();
    return data.data;
  } catch (error) {
    if (error instanceof ApiErrorHandler) {
      throw error;
    }

    // Network errors, etc.
    throw new ApiErrorHandler(
      error instanceof Error ? error.message : "Network error occurred"
    );
  }
}

// Flashcards API
export const flashcardsApi = {
  // Get all flashcards for current user
  async getAll(): Promise<FlashcardRow[]> {
    return apiRequest<FlashcardRow[]>("/flashcards");
  },

  // Get flashcards for review (SRS algorithm)
  async getForReview(): Promise<FlashcardRow[]> {
    return apiRequest<FlashcardRow[]>("/flashcards?review=true");
  },

  // Get single flashcard
  async getById(id: string): Promise<FlashcardRow> {
    return apiRequest<FlashcardRow>(`/flashcards/${id}`);
  },

  // Create new flashcard
  async create(flashcard: {
    front: string;
    back: string;
    source_text_id?: string;
    source?: "ai" | "manual" | "ai-edited";
  }): Promise<FlashcardRow> {
    return apiRequest<FlashcardRow>("/flashcards", {
      method: "POST",
      body: JSON.stringify(flashcard),
    });
  },

  // Update flashcard
  async update(
    id: string,
    updates: Partial<
      Pick<
        FlashcardRow,
        "front" | "back" | "ease_factor" | "interval" | "next_review_at"
      >
    >
  ): Promise<FlashcardRow> {
    return apiRequest<FlashcardRow>(`/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Delete flashcard
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/flashcards/${id}`, {
      method: "DELETE",
    });
  },

  // Update SRS parameters after review
  async updateSRS(
    id: string,
    rating: "easy" | "hard" | "repeat"
  ): Promise<FlashcardRow> {
    return apiRequest<FlashcardRow>(`/flashcards/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ srs_rating: rating }),
    });
  },
};

// Source Texts API
export const sourceTextsApi = {
  // Get all source texts
  async getAll(): Promise<SourceTextRow[]> {
    return apiRequest<SourceTextRow[]>("/source-texts");
  },

  // Get single source text
  async getById(id: string): Promise<SourceTextRow> {
    return apiRequest<SourceTextRow>(`/source-texts/${id}`);
  },

  // Create new source text
  async create(sourceText: { text_content: string }): Promise<SourceTextRow> {
    return apiRequest<SourceTextRow>("/source-texts", {
      method: "POST",
      body: JSON.stringify(sourceText),
    });
  },

  // Update source text
  async update(
    id: string,
    updates: Partial<Pick<SourceTextRow, "text_content">>
  ): Promise<SourceTextRow> {
    return apiRequest<SourceTextRow>(`/source-texts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Delete source text
  async delete(id: string): Promise<void> {
    return apiRequest<void>(`/source-texts/${id}`, {
      method: "DELETE",
    });
  },
};

// Event Logs API (for analytics/debugging)
export const eventLogsApi = {
  // Log custom event
  async log(event: {
    event_type: string;
    flashcard_id?: string;
    source_text_id?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    return apiRequest<void>("/event-logs", {
      method: "POST",
      body: JSON.stringify(event),
    });
  },
};

// Health check
export const healthApi = {
  async check(): Promise<{ status: string; timestamp: string }> {
    return apiRequest<{ status: string; timestamp: string }>("/health");
  },
};

// AI Generation API (when implemented)
export const aiApi = {
  // Generate flashcards from text (placeholder - will be implemented later)
  async generateFlashcards(
    sourceTextId: string,
    config?: { count?: number; difficulty?: string }
  ): Promise<Array<{ front: string; back: string }>> {
    // TODO: Implement AI generation endpoint
    // For now, return mock data that matches expected structure
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { front: "Example Question 1", back: "Example Answer 1" },
          { front: "Example Question 2", back: "Example Answer 2" },
        ]);
      }, 2000);
    });
  },
};

// Export centralized error handler for components
export { ApiErrorHandler };
