import type { APIRoute } from "astro";
import { DataProviderFactory } from "../../../../lib/data/provider-factory";

// Wymagane dla endpointów API w Astro
export const prerender = false;

/**
 * GET /api/v1/health
 * Check the health status of the application and data providers
 */
export const GET: APIRoute = async () => {
  try {
    const providerType = DataProviderFactory.getCurrentProviderType();
    const isHealthy = await DataProviderFactory.isHealthy();

    const response = {
      status: "ok",
      timestamp: new Date().toISOString(),
      data: {
        provider: {
          type: providerType,
          healthy: isHealthy,
        },
        environment: {
          nodeEnv: import.meta.env.MODE,
          dataProvider: import.meta.env.DATA_PROVIDER || "auto",
          hasSupabaseConfig: !!(
            import.meta.env.SUPABASE_URL && import.meta.env.SUPABASE_ANON_KEY
          ),
        },
      },
    };

    const statusCode = isHealthy ? 200 : 503;

    return new Response(JSON.stringify(response), {
      status: statusCode,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Health check failed:", error);

    const response = {
      status: "error",
      timestamp: new Date().toISOString(),
      error: {
        message: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

/**
 * POST /api/v1/health
 * Test POST method
 */
export const POST: APIRoute = async ({ request }) => {
  console.log("POST /api/v1/health - Test endpoint called");

  try {
    const body = await request.json();
    console.log("Health POST body:", body);

    return new Response(
      JSON.stringify({
        status: "ok",
        message: "POST method works",
        receivedData: body,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Health POST error:", error);

    return new Response(
      JSON.stringify({
        status: "error",
        message: "POST method failed",
        error: error instanceof Error ? error.message : "Unknown error",
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
