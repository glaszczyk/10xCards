import type { APIRoute } from "astro";
import { getMockSourceTextById } from "../../../../../lib/data/mock-source-text-store";
import type { ApiResponse, SourceTextWithFlashcardsResponse } from "./types";
import { SourceTextIdParamSchema } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  try {
    // Walidacja parametru id
    const { id } = SourceTextIdParamSchema.parse(params);

    // Pobierz tekst źródłowy po id z globalnego store
    const sourceText = getMockSourceTextById(id);
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
