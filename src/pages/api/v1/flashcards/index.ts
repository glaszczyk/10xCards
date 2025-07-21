import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../lib/data/provider-factory";
import { CreateFlashcardSchema, validateFlashcardQuery } from "./validation";

/**
 * GET /api/v1/flashcards
 * Retrieve user flashcards with pagination and filtering
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    console.log("Raw query params:", queryParams);

    const validatedQuery = validateFlashcardQuery(queryParams);
    console.log("Validated query:", validatedQuery);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Fetch flashcards using the provider
    const response = await provider.getFlashcards(validatedQuery);

    console.log(
      `Returning ${response.data.length} flashcards out of ${response.meta.pagination.total} total`
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching flashcards:", error);

    // Handle validation errors
    if (error instanceof Error && error.message.includes("validation")) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
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
        {
          status: 503,
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
          message: "Failed to fetch flashcards",
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

/**
 * POST /api/v1/flashcards
 * Create new flashcards (manual or AI mode)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateFlashcardSchema.parse(body);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    let response;

    if (validatedData.mode === "manual") {
      // Create manual flashcard
      const newCard = await provider.createManualFlashcard({
        front: validatedData.front,
        back: validatedData.back,
        sourceTextId: validatedData.sourceTextId,
      });

      response = {
        data: [newCard],
        meta: {
          generatedCount: 1,
          mode: "manual",
        },
      };
    } else {
      // Create AI flashcards
      response = await provider.createAIFlashcards({
        textContent: validatedData.textContent,
      });
    }

    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating flashcards:", error);

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
        {
          status: 503,
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
          message: "Failed to create flashcards",
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
