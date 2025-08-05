# Plan Implementacji Endpointa POST `/api/v1/source-texts`

## Przegląd

Endpoint umożliwia tworzenie nowego tekstu źródłowego, który może być użyty później do generowania fiszek AI.

## Specyfikacja API

### Podstawowe informacje

```json
{
  "endpoint": "/api/v1/source-texts",
  "method": "POST",
  "requestSchema": "CreateSourceTextDto",
  "responseSchema": "ApiResponse<SourceTextResponseDto>",
  "authentication": "Bearer JWT Token",
  "rateLimit": "50 requests/minute per user",
  "security": {
    "https": "required",
    "contentType": "application/json",
    "rateLimiting": "express-rate-limit",
    "inputSanitization": "DOMPurify",
    "rbac": "authenticated users only"
  },
  "caching": {
    "strategy": "no-cache",
    "headers": "Cache-Control: no-store"
  }
}
```

### OpenAPI Specification

```yaml
/api/v1/source-texts:
  post:
    tags:
      - Source Texts
    summary: Create a new source text
    description: Creates a new source text that can be used later for AI flashcard generation
    operationId: createSourceText
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - textContent
            properties:
              textContent:
                type: string
                minLength: 1
                maxLength: 10000
                description: The text content to be stored
                example: "React to biblioteka JavaScript do budowania interfejsów użytkownika. Została stworzona przez Facebook i pozwala na tworzenie komponentów wielokrotnego użytku."
    responses:
      "201":
        description: Source text created successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  $ref: "#/components/schemas/SourceTextResponse"
      "400":
        description: Validation error
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "401":
        description: Unauthorized
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
      "413":
        description: Payload too large
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

components:
  schemas:
    SourceTextResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        textContent:
          type: string
        createdAt:
          type: string
          format: date-time
```

### Schemat żądania

```typescript
{
  "textContent": "string (max 10000 chars, required)"
}
```

### Schemat odpowiedzi

```typescript
{
  "data": {
    "id": "string (UUID)",
    "textContent": "string",
    "createdAt": "string (ISO 8601)"
  }
}
```

## Implementacja bezpieczeństwa

### Rate Limiting

```typescript
import rateLimit from "express-rate-limit";

const createSourceTextLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Lower limit for POST operations due to resource usage
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many source text creation requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
});

app.use("/api/v1/source-texts", createSourceTextLimiter);
```

### Input Validation & Sanitization

```typescript
import { body, validationResult } from "express-validator";
import DOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const window = new JSDOM("").window;
const purify = DOMPurify(window);

const validateCreateSourceText = [
  body("textContent")
    .isString()
    .withMessage("Text content must be a string")
    .isLength({ min: 1, max: 10000 })
    .withMessage("Text content must be between 1 and 10000 characters")
    .customSanitizer((value) => {
      // Remove dangerous content but preserve formatting
      return purify.sanitize(value, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true,
      });
    })
    .custom((value) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /data:text\/html/i,
      ];

      if (suspiciousPatterns.some((pattern) => pattern.test(value))) {
        throw new Error("Text content contains potentially malicious code");
      }
      return true;
    }),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid input data",
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
interface CreateSourceTextPermissions {
  maxSourceTextsPerDay: number;
  maxTextLength: number;
  canUseAdvancedFeatures: boolean;
}

const ROLE_PERMISSIONS: Record<string, CreateSourceTextPermissions> = {
  user: {
    maxSourceTextsPerDay: 10,
    maxTextLength: 5000,
    canUseAdvancedFeatures: false,
  },
  premium: {
    maxSourceTextsPerDay: 50,
    maxTextLength: 10000,
    canUseAdvancedFeatures: true,
  },
  admin: {
    maxSourceTextsPerDay: 1000,
    maxTextLength: 50000,
    canUseAdvancedFeatures: true,
  },
};

const checkSourceTextQuotas = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role || "user";
    const permissions = ROLE_PERMISSIONS[userRole];

    // Check daily quota
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("source_texts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00.000Z`);

    if (count >= permissions.maxSourceTextsPerDay) {
      return res.status(429).json({
        error: {
          code: "DAILY_QUOTA_EXCEEDED",
          message: `Daily quota of ${permissions.maxSourceTextsPerDay} source texts exceeded`,
        },
      });
    }

    // Check text length based on role
    const textLength = req.body.textContent?.length || 0;
    if (textLength > permissions.maxTextLength) {
      return res.status(413).json({
        error: {
          code: "TEXT_TOO_LONG",
          message: `Text length ${textLength} exceeds maximum allowed ${permissions.maxTextLength} characters for your role`,
        },
      });
    }

    req.userPermissions = permissions;
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
- Walidacja request body za pomocą `isCreateSourceTextDto()`

### 2. **Walidacja treści**

- Sprawdzenie długości tekstu (max 10000 znaków)
- Sanityzacja tekstu (usunięcie potencjalnie szkodliwych znaków)
- Sprawdzenie czy tekst nie jest pusty

### 3. **Zapis do bazy danych**

- Utworzenie nowego rekordu w tabeli `source_texts`
- Automatyczne wygenerowanie UUID i timestamp

### 4. **Zwrócenie odpowiedzi**

- Status 201 Created z danymi nowego source text
- Cache headers (no-cache dla POST operations)

## Implementacja z middleware

```typescript
app.post(
  "/api/v1/source-texts",
  validateCreateSourceText,
  authenticateUser,
  checkSourceTextQuotas,
  async (req: Request, res: Response) => {
    try {
      const authContext = req.user;
      const { textContent } = req.body;

      // Content analysis for premium features
      let contentMetadata = {};
      if (req.userPermissions.canUseAdvancedFeatures) {
        contentMetadata = await analyzeContent(textContent);
      }

      // Check for duplicate content
      const existingContent = await checkForDuplicateContent(
        textContent,
        authContext.userId
      );
      if (existingContent) {
        return res.status(409).json({
          error: {
            code: "DUPLICATE_CONTENT",
            message: "Similar content already exists",
            existingId: existingContent.id,
          },
        });
      }

      // Zapis do bazy danych
      const { data: sourceText, error } = await supabase
        .from("source_texts")
        .insert({
          text_content: textContent,
          user_id: authContext.userId,
          metadata: contentMetadata,
        })
        .select()
        .single();

      if (error || !sourceText) {
        throw new DatabaseError("Failed to create source text");
      }

      // Logowanie zdarzenia
      await logEvent({
        userId: authContext.userId,
        eventType: "source_text_created",
        payload: {
          sourceTextId: sourceText.id,
          textLength: textContent.length,
          userRole: authContext.role,
        },
      });

      // Mapowanie odpowiedzi
      const responseData: SourceTextResponseDto = {
        id: sourceText.id,
        textContent: sourceText.text_content,
        createdAt: sourceText.created_at,
      };

      const response: ApiResponse<SourceTextResponseDto> = {
        data: responseData,
      };

      // Cache headers
      res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
      });

      res.status(201).json(response);
    } catch (error) {
      await handleApiError(error, res, {
        userId: req.user?.id,
        endpoint: "POST /api/v1/source-texts",
        requestBody: req.body,
      });
    }
  }
);
```

## Wydajność

### Caching Strategy

```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

// Cache for duplicate detection
const checkForDuplicateContent = async (
  textContent: string,
  userId: string
) => {
  const contentHash = createHash("sha256").update(textContent).digest("hex");
  const cacheKey = `content_hash:${userId}:${contentHash}`;

  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Check database
  const { data } = await supabase
    .from("source_texts")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("content_hash", contentHash)
    .single();

  if (data) {
    // Cache the result for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(data));
  }

  return data;
};

// Content analysis caching
const analyzeContent = async (textContent: string) => {
  const contentHash = createHash("sha256").update(textContent).digest("hex");
  const cacheKey = `content_analysis:${contentHash}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Perform expensive analysis
  const analysis = {
    wordCount: textContent.split(/\s+/).length,
    language: detectLanguage(textContent),
    complexity: calculateComplexity(textContent),
    topics: extractTopics(textContent),
  };

  // Cache for 24 hours
  await redis.setex(cacheKey, 86400, JSON.stringify(analysis));

  return analysis;
};
```

### Database Optimizations

```sql
-- Optimized indexes for source text operations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_texts_user_created
ON source_texts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_texts_content_hash
ON source_texts(user_id, content_hash)
WHERE content_hash IS NOT NULL;

-- Full-text search index for content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_texts_content_fts
ON source_texts USING gin(to_tsvector('english', text_content));
```

### Performance Metrics

```typescript
interface SourceTextMetrics {
  creationLatencyP50: number; // Target: < 200ms
  creationLatencyP95: number; // Target: < 1000ms
  creationLatencyP99: number; // Target: < 2000ms
  throughput: number; // Target: > 50 req/sec
  duplicateDetectionLatency: number; // Target: < 100ms
  contentAnalysisLatency: number; // Target: < 500ms
}
```

## Load Testing

```typescript
// k6 load test for source text creation
import http from "k6/http";
import { check, sleep } from "k6";

export let options = {
  stages: [
    { duration: "2m", target: 5 }, // Lower concurrent users for POST
    { duration: "5m", target: 5 },
    { duration: "2m", target: 10 },
    { duration: "5m", target: 10 },
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95% under 1s for content creation
    http_req_failed: ["rate<0.02"], // Error rate under 2%
  },
};

const generateRandomText = () => {
  const topics = ["JavaScript", "React", "Node.js", "TypeScript", "API"];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  return (
    `${topic} is a powerful technology for building modern applications. ` +
    `It offers many benefits including performance, scalability, and developer experience. ` +
    `Learning ${topic} can significantly improve your development skills.`
  );
};

export default function () {
  const payload = JSON.stringify({
    textContent: generateRandomText(),
  });

  const params = {
    headers: {
      Authorization: `Bearer ${__ENV.JWT_TOKEN}`,
      "Content-Type": "application/json",
    },
  };

  const response = http.post(
    `${__ENV.BASE_URL}/api/v1/source-texts`,
    payload,
    params
  );

  check(response, {
    "status is 201": (r) => r.status === 201,
    "has source text id": (r) => r.json().data.id !== undefined,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
  });

  sleep(1);
}
```

## Security Testing

```typescript
describe("POST /api/v1/source-texts Security Tests", () => {
  test("A03:2021 - Injection Prevention", async () => {
    const maliciousPayloads = [
      '<script>alert("xss")</script>',
      "javascript:alert(1)",
      "<img src=x onerror=alert(1)>",
      "${7*7}", // Template injection
      "'; DROP TABLE source_texts; --",
    ];

    for (const payload of maliciousPayloads) {
      const response = await request(app)
        .post("/api/v1/source-texts")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ textContent: payload });

      // Should either reject or sanitize
      if (response.status === 201) {
        expect(response.body.data.textContent).not.toContain("<script>");
        expect(response.body.data.textContent).not.toContain("javascript:");
      } else {
        expect(response.status).toBe(400);
      }
    }
  });

  test("A04:2021 - Insecure Design - Rate Limiting", async () => {
    const promises = Array(51)
      .fill(0)
      .map(() =>
        request(app)
          .post("/api/v1/source-texts")
          .set("Authorization", `Bearer ${authToken}`)
          .send({ textContent: "Test content" })
      );

    const responses = await Promise.all(promises);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test("A07:2021 - Authentication Failures", async () => {
    const response = await request(app)
      .post("/api/v1/source-texts")
      .send({ textContent: "Test content" });

    expect(response.status).toBe(401);
  });
});
```

## Monitorowanie i metryki

### Kluczowe metryki

1. **Performance metrics**:

   - Czas tworzenia source text (P50, P95, P99)
   - Throughput (requests/second)
   - Database operation latency
   - Cache hit/miss ratio

2. **Business metrics**:

   - Średnia długość utworzonych tekstów
   - Częstotliwość tworzenia source texts
   - Rate wykorzystania do generowania AI flashcards
   - User engagement z różnymi długościami tekstów

3. **Security metrics**:

   - Rate błędów walidacji input
   - Liczba zablokowanych malicious requests
   - Authentication failure rate
   - Quota violation attempts

4. **Content metrics**:
   - Rozkład długości tekstów
   - Duplicate content detection rate
   - Language distribution
   - Content complexity distribution

### Alerting

```typescript
const ALERT_THRESHOLDS = {
  high_creation_latency: 1000, // ms
  high_error_rate: 0.05, // 5%
  quota_violation_spike: 10, // per minute
  suspicious_content_rate: 0.1, // 10%
};

const setupAlerts = () => {
  // High latency alert
  metrics.gauge("source_text.creation.latency.p95", (value) => {
    if (value > ALERT_THRESHOLDS.high_creation_latency) {
      alertManager.send({
        severity: "warning",
        summary: "High source text creation latency",
        description: `P95 latency is ${value}ms, threshold is ${ALERT_THRESHOLDS.high_creation_latency}ms`,
      });
    }
  });
};
```

## Podsumowanie

Endpoint POST `/api/v1/source-texts` zapewnia:

✅ **Struktura URI**: RESTful design z wersjonowaniem  
✅ **Semantyka HTTP**: POST dla tworzenia z odpowiednimi kodami  
✅ **Bezpieczeństwo**: HTTPS, JWT, rate limiting, input sanitization, RBAC  
✅ **Testowanie**: Unit, integration, security, load testing  
✅ **Obsługa błędów**: Spójny format, walidacja, logging  
✅ **Dokumentacja**: OpenAPI specification z przykładami  
✅ **Wydajność**: Caching, duplicate detection, database optimization  
✅ **Kontrola dostępu**: Role-based quotas, permission checking  
✅ **Stateless**: Self-contained requests, no server state  
✅ **Wersjonowanie**: URL versioning, deprecation strategy
