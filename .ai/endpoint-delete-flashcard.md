# Plan Implementacji Endpointa DELETE `/api/v1/flashcards/:id`

## Przegląd

Endpoint umożliwia trwałe usunięcie fiszki należącej do zalogowanego użytkownika.

## Specyfikacja API

### Podstawowe informacje

```json
{
  "endpoint": "/api/v1/flashcards/:id",
  "method": "DELETE",
  "requestSchema": {
    "params": {
      "id": "UUID string (required)"
    }
  },
  "responseSchema": "ApiResponse<null>",
  "authentication": "Bearer JWT Token",
  "rateLimit": "100 requests/minute per user",
  "idempotent": true,
  "security": {
    "https": "required",
    "contentType": "application/json",
    "rateLimiting": "express-rate-limit",
    "rbac": "user can only delete own flashcards"
  }
}
```

### OpenAPI Specification

```yaml
/api/v1/flashcards/{id}:
  delete:
    tags:
      - Flashcards
    summary: Delete a flashcard
    description: Permanently deletes a flashcard belonging to the authenticated user
    operationId: deleteFlashcard
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
        description: UUID of the flashcard to delete
        schema:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
    responses:
      "204":
        description: Flashcard successfully deleted
      "400":
        description: Invalid UUID format
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "401":
        description: Unauthorized - missing or invalid token
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "404":
        description: Flashcard not found
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "429":
        description: Rate limit exceeded
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "500":
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
```

### Parametry ścieżki

- **id** (string, required): UUID fiszki do usunięcia

### Schemat odpowiedzi

```typescript
{
  // Brak danych w response - tylko status 204 No Content
}
```

## Implementacja bezpieczeństwa

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const deleteFlashcardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many delete requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip; // Rate limit per user, fallback to IP
  },
});

app.use("/api/v1/flashcards/:id", deleteFlashcardLimiter);
```

### HTTPS Enforcement

```typescript
const httpsOnly = (req: Request, res: Response, next: NextFunction) => {
  if (
    req.header("x-forwarded-proto") !== "https" &&
    process.env.NODE_ENV === "production"
  ) {
    return res.status(403).json({
      error: {
        code: "HTTPS_REQUIRED",
        message: "HTTPS is required for this endpoint",
      },
    });
  }
  next();
};

app.use("/api/v1/*", httpsOnly);
```

### Input Validation & Sanitization

```typescript
import { body, param, validationResult } from "express-validator";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const validateFlashcardId = [
  param("id")
    .isUUID()
    .withMessage("Invalid UUID format")
    .customSanitizer((value) => purify.sanitize(value)),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid input parameters",
          details: errors.array(),
        },
      });
    }
    next();
  },
];
```

### RBAC Implementation

```typescript
interface UserRole {
  id: string;
  name: "user" | "admin" | "premium";
  permissions: string[];
}

const checkFlashcardOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const flashcardId = req.params.id;

    // Check if user owns the flashcard
    const { data: flashcard, error } = await supabase
      .from("flashcards")
      .select("user_id")
      .eq("id", flashcardId)
      .single();

    if (error || !flashcard) {
      return res.status(404).json({
        error: {
          code: "FLASHCARD_NOT_FOUND",
          message: "Flashcard not found",
        },
      });
    }

    if (flashcard.user_id !== userId) {
      await logSecurityEvent({
        userId,
        eventType: "unauthorized_delete_attempt",
        payload: {
          flashcardId,
          attemptedBy: userId,
          actualOwner: flashcard.user_id,
        },
      });

      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You can only delete your own flashcards",
        },
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
```

## Kroki implementacji

### 1. **Walidacja i autoryzacja**

- Sprawdzenie obecności i ważności tokenu JWT
- Pobranie `userId` z tokenu za pomocą Supabase Auth
- Walidacja parametru `id` jako poprawny UUID

### 2. **Sprawdzenie istnienia fiszki**

- Pobranie fiszki z bazy danych
- Sprawdzenie czy fiszka istnieje i należy do użytkownika
- Przygotowanie danych do logowania

### 3. **Usunięcie fiszki**

- Soft delete lub hard delete (w zależności od strategii)
- Dla MVP: hard delete z tabeli `flashcards`
- Automatyczne zachowanie source_text przez ON DELETE SET NULL

### 4. **Logowanie zdarzenia**

- Zapisanie event logu typu "card_deleted"
- Payload z podstawowymi informacjami o usuniętej fiszce

### 5. **Zwrócenie odpowiedzi**

- Status 204 No Content (brak body)

## Implementacja z middleware

```typescript
app.delete(
  "/api/v1/flashcards/:id",
  validateFlashcardId,
  authenticateUser,
  checkFlashcardOwnership,
  async (req: Request, res: Response) => {
    try {
      const authContext = req.user;
      const flashcardId = req.params.id;

      // Add idempotency token support
      const idempotencyToken = req.headers["idempotency-key"] as string;
      if (idempotencyToken) {
        const existingOperation = await checkIdempotencyToken(
          idempotencyToken,
          authContext.userId
        );
        if (existingOperation) {
          return res
            .status(existingOperation.statusCode)
            .json(existingOperation.response);
        }
      }

      // 2. Sprawdzenie istnienia fiszki i pobranie danych do logowania
      const { data: existingFlashcard, error: fetchError } = await supabase
        .from("flashcards")
        .select("id, front, back, source, source_text_id, created_at")
        .eq("id", flashcardId)
        .eq("user_id", authContext.userId)
        .single();

      if (fetchError || !existingFlashcard) {
        throw new FlashcardNotFoundError(flashcardId);
      }

      // 3. Usunięcie fiszki z bazy danych
      const { error: deleteError } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", flashcardId)
        .eq("user_id", authContext.userId); // Dodatkowa walidacja bezpieczeństwa

      if (deleteError) {
        throw new DatabaseError("Failed to delete flashcard");
      }

      // 4. Logowanie zdarzenia
      await logEvent({
        userId: authContext.userId,
        eventType: "card_deleted",
        payload: {
          flashcardId,
          originalFront: existingFlashcard.front,
          originalBack: existingFlashcard.back,
          source: existingFlashcard.source,
          sourceTextId: existingFlashcard.source_text_id,
          createdAt: existingFlashcard.created_at,
          deletedAt: new Date().toISOString(),
        },
      });

      // Store idempotency token result
      if (idempotencyToken) {
        await storeIdempotencyResult(
          idempotencyToken,
          authContext.userId,
          204,
          null
        );
      }

      // 5. Zwrócenie odpowiedzi (204 No Content)
      res.status(204).send();
    } catch (error) {
      await handleApiError(error, res, {
        userId: req.user?.id,
        endpoint: "DELETE /api/v1/flashcards/:id",
        flashcardId: req.params.id,
      });
    }
  }
);
```

## Obsługa błędów

### Definicje błędów

```typescript
export class FlashcardNotFoundError extends Error {
  constructor(flashcardId: string) {
    super(`Flashcard with id ${flashcardId} not found`);
    this.name = "FlashcardNotFoundError";
  }
}

export class InvalidUUIDError extends Error {
  constructor(value: string) {
    super(`Invalid UUID format: ${value}`);
    this.name = "InvalidUUIDError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
  }
}
```

### Mapowanie błędów na kody HTTP

```typescript
const errorMapping = [
  { type: "UnauthorizedError", status: 401, code: "UNAUTHORIZED" },
  { type: "InvalidUUIDError", status: 400, code: "INVALID_UUID" },
  { type: "FlashcardNotFoundError", status: 404, code: "FLASHCARD_NOT_FOUND" },
  { type: "DatabaseError", status: 500, code: "DATABASE_ERROR" },
  { type: "RateLimitError", status: 429, code: "RATE_LIMIT_EXCEEDED" },
];
```

## Przykłady użycia

### Przykład 1: Pomyślne usunięcie fiszki

```bash
curl -X DELETE http://localhost:3000/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```
HTTP/1.1 204 No Content
```

### Przykład 2: Fiszka nie znaleziona

```bash
curl -X DELETE http://localhost:3000/api/v1/flashcards/nonexistent-id \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard with id nonexistent-id not found"
  }
}
```

### Przykład 3: Nieprawidłowy UUID

```bash
curl -X DELETE http://localhost:3000/api/v1/flashcards/invalid-uuid \
  -H "Authorization: Bearer <jwt_token>"
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "INVALID_UUID",
    "message": "Invalid UUID format: invalid-uuid"
  }
}
```

### Przykład 4: Brak autoryzacji

```bash
curl -X DELETE http://localhost:3000/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000
```

**Odpowiedź:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid authorization token"
  }
}
```

## Testy

### 1. Testy jednostkowe

```typescript
describe("DELETE /api/v1/flashcards/:id", () => {
  test("should delete flashcard successfully", async () => {
    const flashcardId = "123e4567-e89b-12d3-a456-426614174000";

    const mockExistingFlashcard = {
      id: flashcardId,
      front: "Test question",
      back: "Test answer",
      source: "manual",
      source_text_id: null,
      created_at: "2024-01-15T10:30:00Z",
    };

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest
              .fn()
              .mockResolvedValue({ data: mockExistingFlashcard, error: null }),
          }),
        }),
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      }),
    });

    const response = await request(app)
      .delete(`/api/v1/flashcards/${flashcardId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(204);

    expect(response.body).toEqual({});
  });

  test("should return 404 for non-existent flashcard", async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    });

    await request(app)
      .delete("/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(404);
  });

  test("should return 400 for invalid UUID", async () => {
    await request(app)
      .delete("/api/v1/flashcards/invalid-uuid")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(400);
  });

  test("should return 401 for unauthorized request", async () => {
    await request(app)
      .delete("/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000")
      .expect(401);
  });
});
```

### 2. Testy integracyjne

```typescript
describe("DELETE /api/v1/flashcards/:id integration", () => {
  test("should delete flashcard and log event", async () => {
    // Utwórz fiszkę w bazie
    const { data: flashcard } = await supabase
      .from("flashcards")
      .insert({
        front: "Test question",
        back: "Test answer",
        source: "manual",
        user_id: testUserId,
      })
      .select()
      .single();

    // Usuń fiszkę przez API
    await request(app)
      .delete(`/api/v1/flashcards/${flashcard.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(204);

    // Sprawdź czy fiszka została usunięta
    const { data: deletedFlashcard } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", flashcard.id)
      .single();

    expect(deletedFlashcard).toBeNull();

    // Sprawdź event log
    const { data: eventLog } = await supabase
      .from("event_logs")
      .select("*")
      .eq("user_id", testUserId)
      .eq("event_type", "card_deleted")
      .order("timestamp", { ascending: false })
      .limit(1)
      .single();

    expect(eventLog.payload.flashcardId).toBe(flashcard.id);
    expect(eventLog.payload.originalFront).toBe("Test question");
    expect(eventLog.payload.source).toBe("manual");
  });

  test("should not delete flashcard belonging to different user", async () => {
    // Utwórz fiszkę dla innego użytkownika
    const { data: otherUserFlashcard } = await supabase
      .from("flashcards")
      .insert({
        front: "Other user question",
        back: "Other user answer",
        source: "manual",
        user_id: "other-user-id",
      })
      .select()
      .single();

    // Próba usunięcia przez innego użytkownika
    await request(app)
      .delete(`/api/v1/flashcards/${otherUserFlashcard.id}`)
      .set("Authorization", `Bearer ${authToken}`)
      .expect(404); // RLS causes this to appear as not found

    // Sprawdź czy fiszka nadal istnieje
    const { data: stillExists } = await supabase
      .from("flashcards")
      .select("*")
      .eq("id", otherUserFlashcard.id)
      .single();

    expect(stillExists).toBeTruthy();
  });
});
```

### 3. Testy bezpieczeństwa

```typescript
describe("DELETE /api/v1/flashcards/:id security", () => {
  test("should prevent deletion without authentication", async () => {
    const flashcardId = "123e4567-e89b-12d3-a456-426614174000";

    await request(app).delete(`/api/v1/flashcards/${flashcardId}`).expect(401);
  });

  test("should prevent deletion with invalid token", async () => {
    const flashcardId = "123e4567-e89b-12d3-a456-426614174000";

    await request(app)
      .delete(`/api/v1/flashcards/${flashcardId}`)
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  });

  test("should use RLS to prevent cross-user deletion", async () => {
    // Test jest pokryty w integration tests
    // RLS automatycznie filtruje zapytania po user_id
  });
});
```

## Wydajność

### Caching Strategy

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache headers for delete operations
const setCacheHeaders = (res: Response) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
};

// Invalidate related cache after deletion
const invalidateFlashcardCache = async (
  userId: string,
  flashcardId: string
) => {
  const cacheKeys = [
    `user:${userId}:flashcards`,
    `user:${userId}:flashcards:count`,
    `flashcard:${flashcardId}`,
    `user:${userId}:stats`,
  ];

  await redis.del(...cacheKeys);
};
```

### Database Optimizations

```sql
-- Optimized indexes for delete operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_flashcards_user_id_id
ON flashcards(user_id, id)
WHERE deleted_at IS NULL;

-- Index for audit logging
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_event_logs_user_event_timestamp
ON event_logs(user_id, event_type, timestamp DESC);
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  deleteLatencyP50: number; // Target: < 100ms
  deleteLatencyP95: number; // Target: < 500ms
  deleteLatencyP99: number; // Target: < 1000ms
  deleteThroughput: number; // Target: > 100 req/sec
  errorRate: number; // Target: < 1%
  authLatency: number; // Target: < 50ms
}

const trackPerformance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime.bigint();

  res.on("finish", async () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms

    await metricsClient.histogram("api.delete.flashcard.duration", duration, {
      status_code: res.statusCode.toString(),
      user_id: req.user?.id || "anonymous",
    });
  });

  next();
};
```

## Testy wydajności

### Load Testing

```typescript
// k6 load test script
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up
    { duration: "5m", target: 10 }, // Steady state
    { duration: "2m", target: 20 }, // Ramp up
    { duration: "5m", target: 20 }, // Steady state
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"], // Error rate under 1%
  },
};

export default function () {
  const params = {
    headers: {
      Authorization: `Bearer ${__ENV.JWT_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  // Create flashcard first
  const createResponse = http.post(
    `${__ENV.BASE_URL}/api/v1/flashcards`,
    JSON.stringify({
      mode: "manual",
      front: "Test question",
      back: "Test answer",
    }),
    params
  );

  if (createResponse.status === 201) {
    const flashcardId = createResponse.json().data[0].id;

    // Then delete it
    const deleteResponse = http.del(
      `${__ENV.BASE_URL}/api/v1/flashcards/${flashcardId}`,
      null,
      params
    );

    check(deleteResponse, {
      "delete status is 204": (r) => r.status === 204,
      "delete response time < 500ms": (r) => r.timings.duration < 500,
    });
  }

  sleep(1);
}
```

### Security Testing

```typescript
// OWASP Top 10 Security Tests
describe("DELETE /api/v1/flashcards/:id Security Tests", () => {
  test("A01:2021 - Broken Access Control", async () => {
    // Test unauthorized access to other user's flashcards
    const otherUserFlashcard = await createFlashcardForUser("other-user-id");

    const response = await request(app)
      .delete(`/api/v1/flashcards/${otherUserFlashcard.id}`)
      .set("Authorization", `Bearer ${currentUserToken}`);

    expect(response.status).toBe(403);
  });

  test("A03:2021 - Injection", async () => {
    // Test SQL injection in UUID parameter
    const maliciousId = "'; DROP TABLE flashcards; --";

    const response = await request(app)
      .delete(`/api/v1/flashcards/${maliciousId}`)
      .set("Authorization", `Bearer ${authToken}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_FAILED");
  });

  test("A07:2021 - Identification and Authentication Failures", async () => {
    // Test without authentication
    const response = await request(app).delete(
      "/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000"
    );

    expect(response.status).toBe(401);
  });

  test("Rate Limiting", async () => {
    // Perform 101 requests rapidly
    const promises = Array(101)
      .fill(0)
      .map(() =>
        request(app)
          .delete("/api/v1/flashcards/123e4567-e89b-12d3-a456-426614174000")
          .set("Authorization", `Bearer ${authToken}`)
      );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

## Wersjonowanie i kompatybilność

### Versioning Strategy

```typescript
// API Version Configuration
const API_VERSIONS = {
  v1: {
    supported: true,
    deprecated: false,
    sunset: null,
    changes: [],
  },
  v2: {
    supported: false,
    deprecated: false,
    sunset: null,
    changes: ["Enhanced security", "New rate limiting"],
  },
};

// Version-specific middleware
const versionHandler = (req: Request, res: Response, next: NextFunction) => {
  const version = req.params.version || "v1";
  const versionConfig = API_VERSIONS[version];

  if (!versionConfig || !versionConfig.supported) {
    return res.status(404).json({
      error: {
        code: "VERSION_NOT_SUPPORTED",
        message: `API version ${version} is not supported`,
        supportedVersions: Object.keys(API_VERSIONS).filter(
          (v) => API_VERSIONS[v].supported
        ),
      },
    });
  }

  if (versionConfig.deprecated) {
    res.set("Sunset", versionConfig.sunset);
    res.set("Deprecation", "true");
  }

  next();
};
```

### Deprecation Policy

```typescript
interface DeprecationPolicy {
  announceDeprecation: "6 months before sunset";
  warningPeriod: "3 months";
  sunsetNotice: "1 month";
  supportedVersions: 2; // Current + previous version
}

// Deprecation headers
const addDeprecationHeaders = (res: Response, version: string) => {
  if (version === "v1" && API_VERSIONS.v2.supported) {
    res.set("Deprecation", "Tue, 15 Jan 2025 00:00:00 GMT");
    res.set("Sunset", "Tue, 15 Jul 2025 00:00:00 GMT");
    res.set("Link", '</api/v2/flashcards>; rel="successor-version"');
  }
};
```

## Monitorowanie i alerting

### Key Performance Indicators

```typescript
interface KPIs {
  availability: number; // Target: 99.9%
  latency: {
    p50: number; // Target: < 100ms
    p95: number; // Target: < 500ms
    p99: number; // Target: < 1000ms
  };
  throughput: number; // Target: > 100 req/sec
  errorRate: number; // Target: < 1%
  securityIncidents: number; // Target: 0 per month
}

// Alerting thresholds
const ALERT_THRESHOLDS = {
  high_latency: 500, // ms
  high_error_rate: 0.05, // 5%
  low_availability: 0.995, // 99.5%
  security_events: 1, // per hour
};
```

### Metrics Collection

```typescript
import StatsD from "hot-shots";

const metrics = new StatsD({
  prefix: "api.v1.flashcards.delete.",
  globalTags: ["service:flashcards-api"],
});

const trackOperationMetrics = async (
  operation: string,
  duration: number,
  success: boolean
) => {
  metrics.timing(`${operation}.duration`, duration);
  metrics.increment(`${operation}.count`, 1, { success: success.toString() });

  if (!success) {
    metrics.increment(`${operation}.errors`);
  }
};
```

## Podsumowanie

Endpoint DELETE `/api/v1/flashcards/:id` zapewnia:

✅ **Struktura URI**: RESTful design z wersjonowaniem  
✅ **Semantyka HTTP**: Idempotentny DELETE z właściwymi kodami  
✅ **Bezpieczeństwo**: HTTPS, JWT, rate limiting, RBAC, input validation  
✅ **Testowanie**: Unit, integration, security, load testing  
✅ **Obsługa błędów**: Spójny format, właściwe kody, logging  
✅ **Dokumentacja**: OpenAPI specification z przykładami  
✅ **Wydajność**: Caching, compression, database optimization  
✅ **Kontrola dostępu**: RBAC, RLS, audit logging  
✅ **Idempotentność**: Tokeny idempotentności, stateless design  
✅ **Wersjonowanie**: URL versioning, deprecation policy
