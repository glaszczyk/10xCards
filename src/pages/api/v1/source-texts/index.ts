import type { APIRoute } from "astro";
import { createMockSourceText } from "./mock-data";
import type { ApiResponse, SourceTextResponse } from "./types";
import { CreateSourceTextSchema } from "./validation";

/**
 * POST /api/v1/source-texts
 * Create new source text
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateSourceTextSchema.parse(body);

    // Mock: create source text
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
