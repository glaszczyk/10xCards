import type { APIRoute } from "astro";
import {
  getEventLogSummary,
  getMockEventLogs,
} from "../../../../lib/data/mock-event-log-store";
import type { EventLogsResponse } from "./types";
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

    // For now, use a default user ID (will be replaced with auth later)
    const userId = "default-user-id";

    // Use mock data with filtering and pagination from global store
    const { data: eventLogs, total } = getMockEventLogs(
      validatedQuery.page,
      validatedQuery.perPage,
      validatedQuery.eventType,
      validatedQuery.severity,
      validatedQuery.startDate,
      validatedQuery.endDate
    );

    // Get summary statistics from global store
    const summary = getEventLogSummary();

    const response: EventLogsResponse = {
      data: eventLogs,
      meta: {
        pagination: {
          total,
          page: validatedQuery.page,
          perPage: validatedQuery.perPage,
        },
        summary,
      },
    };

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
