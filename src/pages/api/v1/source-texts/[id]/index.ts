import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../../lib/data/provider-factory";
import type {
  ApiResponse,
  SourceTextResponse,
  SourceTextWithFlashcardsResponse,
} from "./types";
import { SourceTextIdParamSchema } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const { id } = SourceTextIdParamSchema.parse(params);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Pobierz tekst źródłowy po id z providera
    const sourceText = await provider.getSourceTextById(id);
    if (!sourceText) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SOURCE_TEXT_NOT_FOUND",
            message: `Source text with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: ApiResponse<SourceTextWithFlashcardsResponse> = {
      data: sourceText,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching source text:", error);

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
          message: "Failed to fetch source text",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PUT /api/v1/source-texts/[id]
 * Update source text
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    // Walidacja parametru id
    const { id } = SourceTextIdParamSchema.parse(params);

    const body = await request.json();

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Update source text using provider
    const updatedSourceText = await provider.updateSourceText(id, body);
    if (!updatedSourceText) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SOURCE_TEXT_NOT_FOUND",
            message: `Source text with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const response: ApiResponse<SourceTextResponse> = {
      data: updatedSourceText,
    };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating source text:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request parameters",
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
          message: "Failed to update source text",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/v1/source-texts/[id]
 * Delete source text
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const { id } = SourceTextIdParamSchema.parse(params);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Delete source text using provider
    const deleted = await provider.deleteSourceText(id);
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: {
            code: "SOURCE_TEXT_NOT_FOUND",
            message: `Source text with id ${id} not found`,
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting source text:", error);

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
          message: "Failed to delete source text",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
