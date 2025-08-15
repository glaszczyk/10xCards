import { http, HttpResponse } from "msw";

// Mock AI API responses
export const aiHandlers = [
  http.post("/api/ai/generate", async ({ request }) => {
    const body = await request.json();

    if (!body.text || body.text.length < 100) {
      return HttpResponse.json(
        { error: "Text must be at least 100 characters long" },
        { status: 400 }
      );
    }

    // Mock successful AI response
    const mockFlashcards = [
      {
        id: "mock-1",
        front: "What is the main benefit of spaced repetition?",
        back: "It helps retain information longer by reviewing at optimal intervals.",
        source: "ai",
        created_at: new Date().toISOString(),
      },
      {
        id: "mock-2",
        front: "How does the SRS algorithm work?",
        back: "It adjusts review intervals based on how well you remember each card.",
        source: "ai",
        created_at: new Date().toISOString(),
      },
    ];

    return HttpResponse.json({ flashcards: mockFlashcards });
  }),
];

// Mock Supabase API responses
export const supabaseHandlers = [
  http.post("/api/v1/flashcards", async ({ request }) => {
    const body = await request.json();

    return HttpResponse.json({
      id: "mock-flashcard-id",
      ...body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.get("/api/v1/flashcards", () => {
    return HttpResponse.json([
      {
        id: "mock-1",
        front: "Test Question 1?",
        back: "Test Answer 1",
        source: "manual",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: "mock-2",
        front: "Test Question 2?",
        back: "Test Answer 2",
        source: "ai",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
  }),

  http.get("/api/v1/flashcards/:id", ({ params }) => {
    const { id } = params;

    return HttpResponse.json({
      id,
      front: `Test Question ${id}?`,
      back: `Test Answer ${id}`,
      source: "manual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }),

  http.put("/api/v1/flashcards/:id", async ({ request, params }) => {
    const body = await request.json();
    const { id } = params;

    return HttpResponse.json({
      id,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete("/api/v1/flashcards/:id", ({ params }) => {
    return HttpResponse.json({ success: true, id: params.id });
  }),
];

// Mock authentication responses
export const authHandlers = [
  http.post("/api/auth/register", async ({ request }) => {
    const body = await request.json();

    if (body.email === "existing@example.com") {
      return HttpResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: {
        id: "mock-user-id",
        email: body.email,
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    });
  }),

  http.post("/api/auth/login", async ({ request }) => {
    const body = await request.json();

    if (body.email === "invalid@example.com") {
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: {
        id: "mock-user-id",
        email: body.email,
        created_at: new Date().toISOString(),
      },
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
      },
    });
  }),

  http.post("/api/auth/logout", () => {
    return HttpResponse.json({ success: true });
  }),
];

export const handlers = [...aiHandlers, ...supabaseHandlers, ...authHandlers];
