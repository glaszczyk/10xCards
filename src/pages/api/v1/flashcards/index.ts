import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../lib/data/provider-factory";
import { CreateFlashcardSchema, validateFlashcardQuery } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

console.log("Flashcards API module loaded at:", new Date().toISOString());

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
  console.log("POST /api/v1/flashcards - Starting request processing");

  try {
    const body = await request.json();
    console.log("Request body:", body);

    // Validate request body
    const validatedData = CreateFlashcardSchema.parse(body);
    console.log("Validated data:", validatedData);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    let response;

    if (validatedData.mode === "manual") {
      console.log("Creating manual flashcard...");
      // Create manual flashcard
      const newCard = await provider.createManualFlashcard({
        front: validatedData.front,
        back: validatedData.back,
        sourceTextId: validatedData.sourceTextId,
      });
      console.log("Created manual flashcard:", newCard);

      response = {
        data: [newCard],
        meta: {
          generatedCount: 1,
          mode: "manual",
        },
      };
    } else {
      console.log("Creating AI flashcards...");
      // Create AI flashcards
      response = await provider.createAIFlashcards({
        textContent: validatedData.textContent,
      });
      console.log("Created AI flashcards:", response);
    }

    console.log("Sending response:", response);
    return new Response(JSON.stringify(response), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error creating flashcards:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    console.error(
      "Error name:",
      error instanceof Error ? error.name : "Unknown error type"
    );

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
