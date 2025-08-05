import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../../lib/data/provider-factory";
import type {
  ApiResponse,
  FlashcardDetailResponse,
  UpdateFlashcardResponse,
} from "./types";
import { FlashcardIdParamSchema, UpdateFlashcardSchema } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  console.log("🚀 GET /api/v1/flashcards/:id called with params:", params);

  try {
    // Walidacja parametru id
    const { id } = FlashcardIdParamSchema.parse(params);
    console.log("✅ Validation passed, searching for ID:", id);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Pobierz fiszkę po id z providera
    const card = await provider.getFlashcardById(id);
    if (!card) {
      console.log("❌ Flashcard not found");
      return new Response(
        JSON.stringify({
          error: {
            code: "FLASHCARD_NOT_FOUND",
            message: `Flashcard with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Flashcard found:", card.id);
    const response: ApiResponse<FlashcardDetailResponse> = { data: card };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.log("❌ Error:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid id parameter",
            details: error.message,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes("Database error")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Database connection failed",
            details: error.message,
          },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch flashcard",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PATCH /api/v1/flashcards/:id
 * Update flashcard fields
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    // Walidacja parametru id
    const { id } = FlashcardIdParamSchema.parse(params);

    // Walidacja body
    const body = await request.json();
    const validatedUpdates = UpdateFlashcardSchema.parse(body);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Aktualizuj fiszkę w providerze
    const updatedCard = await provider.updateFlashcard(id, validatedUpdates);
    if (!updatedCard) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FLASHCARD_NOT_FOUND",
            message: `Flashcard with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: UpdateFlashcardResponse = { data: updatedCard };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating flashcard:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.message,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes("Database error")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Database connection failed",
            details: error.message,
          },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to update flashcard",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/v1/flashcards/:id
 * Delete flashcard
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const { id } = FlashcardIdParamSchema.parse(params);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Usuń fiszkę z providera
    const deleted = await provider.deleteFlashcard(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: {
            code: "FLASHCARD_NOT_FOUND",
            message: `Flashcard with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // DELETE zwraca 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting flashcard:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid id parameter",
            details: error.message,
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle database connection errors
    if (error instanceof Error && error.message.includes("Database error")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "DATABASE_ERROR",
            message: "Database connection failed",
            details: error.message,
          },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to delete flashcard",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
