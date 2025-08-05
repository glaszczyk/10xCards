import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../lib/data/provider-factory";
import type { ApiResponse, SourceTextResponse } from "./types";
import { CreateSourceTextSchema } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

/**
 * GET /api/v1/source-texts
 * Retrieve user source texts with pagination and sorting
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    console.log("Raw query params:", queryParams);

    // Default values
    const page = parseInt(queryParams.page || "1");
    const perPage = parseInt(queryParams.perPage || "10");
    const sort = (queryParams.sort || "createdAt") as "createdAt";
    const order = (queryParams.order || "desc") as "asc" | "desc";

    // Validate parameters
    if (page < 1 || perPage < 1 || perPage > 100) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid pagination parameters",
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

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Fetch source texts using the provider
    const response = await provider.getSourceTexts({
      page,
      perPage,
      sort,
      order,
    });

    console.log(
      `Returning ${response.data.length} source texts out of ${response.meta.pagination.total} total`
    );

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching source texts:", error);

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
          message: "Failed to fetch source texts",
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
 * POST /api/v1/source-texts
 * Create new source text
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = CreateSourceTextSchema.parse(body);

    // Get the appropriate data provider
    const provider = DataProviderFactory.getProvider();
    const providerType = DataProviderFactory.getCurrentProviderType();
    console.log(`Using data provider: ${providerType}`);

    // Create source text using provider
    const newSourceText = await provider.createSourceText({
      textContent: validatedData.textContent,
    });

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
