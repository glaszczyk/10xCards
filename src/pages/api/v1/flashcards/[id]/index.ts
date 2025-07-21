import type { APIRoute } from "astro";
import {
  deleteMockFlashcard,
  getMockFlashcardById,
  updateMockFlashcard,
} from "./mock-data";
import type {
  ApiResponse,
  FlashcardDetailResponse,
  UpdateFlashcardResponse,
} from "./types";
import { FlashcardIdParamSchema, UpdateFlashcardSchema } from "./validation";

export const GET: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const { id } = FlashcardIdParamSchema.parse(params);

    // Mock: pobierz fiszkę po id
    const card = getMockFlashcardById(id);
    if (!card) {
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

    const response: ApiResponse<FlashcardDetailResponse> = { data: card };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_UUID",
          message: error instanceof Error ? error.message : "Invalid id",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
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

    // Mock: aktualizuj fiszkę
    const updatedCard = updateMockFlashcard(id, validatedUpdates);
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

    // Mock: usuń fiszkę
    const deleted = deleteMockFlashcard(id);
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

    return new Response(
      JSON.stringify({
        error: {
          code: "INVALID_UUID",
          message: error instanceof Error ? error.message : "Invalid id",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
};
