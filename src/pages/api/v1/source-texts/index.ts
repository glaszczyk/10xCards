import type { APIRoute } from "astro";
import { addMockSourceText } from "../../../../lib/data/mock-source-text-store";
import type { ApiResponse, SourceTextResponse } from "./types";
import { CreateSourceTextSchema } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

// Funkcja do tworzenia mock source text
function createMockSourceText(textContent: string): SourceTextResponse {
  const newId = `text-${Date.now()}`;
  const now = new Date().toISOString();

  const newText: SourceTextResponse = {
    id: newId,
    textContent,
    createdAt: now,
  };

  addMockSourceText(newText);
  return newText;
}

/**
 * POST /api/v1/source-texts
 * Create new source text
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateSourceTextSchema.parse(body);

    // Create source text using global store
    const newSourceText = createMockSourceText(validatedData.textContent);

    const response: ApiResponse<SourceTextResponse> = { data: newSourceText };
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating source text:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: error.message,
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to create source text",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
