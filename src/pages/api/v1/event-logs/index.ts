import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../lib/data/provider-factory";
import { validateEventLogQuery } from "./validation";

// Wymagane dla endpointów API w Astro
export const prerender = false;

/**
 * GET /api/v1/event-logs
 * Retrieve user event logs with pagination and filtering
 */
export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Parse and validate query parameters
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const validatedQuery = validateEventLogQuery(queryParams);

    // Get data provider
    const provider = DataProviderFactory.getProvider();

    // Get event logs from provider
    const eventLogsResponse = await provider.getEventLogs({
      page: validatedQuery.page,
      perPage: validatedQuery.perPage,
      eventType: validatedQuery.eventType,
      severity: validatedQuery.severity,
      startDate: validatedQuery.startDate,
      endDate: validatedQuery.endDate,
    });

    const response = eventLogsResponse;

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "max-age=60, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error fetching event logs:", error);

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

    // Handle other errors
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to fetch event logs",
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
