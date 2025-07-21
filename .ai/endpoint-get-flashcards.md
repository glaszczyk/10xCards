# Enhanced REST API Implementation: GET `/api/v1/flashcards`

## Overview

Critical analysis and implementation of GET `/api/v1/flashcards` endpoint following comprehensive REST API best practices checklist covering security, performance, testing, documentation, and monitoring.

## 1. OpenAPI Specification

```yaml
/api/v1/flashcards:
  get:
    summary: Retrieve user flashcards with pagination and filtering
    description: |
      Fetches a paginated list of flashcards belonging to the authenticated user.
      Supports filtering by source, sorting, and comprehensive query parameters.
    tags:
      - Flashcards
    security:
      - bearerAuth: []
    parameters:
      - name: page
        in: query
        description: Page number for pagination (1-based)
        required: false
        schema:
          type: integer
          minimum: 1
          default: 1
          example: 1
      - name: per_page
        in: query
        description: Number of items per page
        required: false
        schema:
          type: integer
          minimum: 1
          maximum: 100
          default: 20
          example: 20
      - name: source
        in: query
        description: Filter by flashcard source type
        required: false
        schema:
          type: string
          enum: [ai, manual, ai-edited]
          example: manual
      - name: sort
        in: query
        description: Field to sort by
        required: false
        schema:
          type: string
          enum: [created_at, updated_at]
          default: created_at
      - name: order
        in: query
        description: Sort order
        required: false
        schema:
          type: string
          enum: [asc, desc]
          default: desc
    responses:
      "200":
        description: Successfully retrieved flashcards
        headers:
          X-RateLimit-Limit:
            description: Request limit per time window
            schema:
              type: integer
          X-RateLimit-Remaining:
            description: Remaining requests in current window
            schema:
              type: integer
          X-RateLimit-Reset:
            description: Time when rate limit resets
            schema:
              type: integer
          ETag:
            description: Entity tag for caching
            schema:
              type: string
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: array
                  items:
                    $ref: "#/components/schemas/FlashcardResponse"
                meta:
                  type: object
                  properties:
                    pagination:
                      $ref: "#/components/schemas/PaginationMeta"
            examples:
              successful_response:
                summary: Successful flashcards retrieval
                value:
                  data:
                    - id: "123e4567-e89b-12d3-a456-426614174000"
                      front: "What is TypeScript?"
                      back: "A typed superset of JavaScript"
                      source: "manual"
                      sourceTextId: null
                      createdAt: "2024-01-15T10:30:00Z"
                      updatedAt: "2024-01-15T10:30:00Z"
                      easeFactor: null
                      interval: null
                      nextReviewAt: null
                  meta:
                    pagination:
                      total: 150
                      page: 1
                      per_page: 20
      "400":
        description: Invalid query parameters
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
            example:
              error:
                code: "VALIDATION_ERROR"
                message: "Invalid query parameters"
                details:
                  page: "Must be a positive integer"
      "401":
        description: Authentication required
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
            example:
              error:
                code: "UNAUTHORIZED"
                message: "Invalid or missing JWT token"
      "429":
        description: Rate limit exceeded
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"
            example:
              error:
                code: "RATE_LIMIT_EXCEEDED"
                message: "Too many requests"
      "500":
        description: Internal server error
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ErrorResponse"

components:
  schemas:
    FlashcardResponse:
      type: object
      properties:
        id:
          type: string
          format: uuid
        front:
          type: string
          maxLength: 250
        back:
          type: string
          maxLength: 750
        source:
          type: string
          enum: [ai, manual, ai-edited]
        sourceTextId:
          type: string
          format: uuid
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        easeFactor:
          type: number
          nullable: true
        interval:
          type: number
          nullable: true
        nextReviewAt:
          type: string
          format: date-time
          nullable: true
    PaginationMeta:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        per_page:
          type: integer
```

## 2. Security Implementation

### Rate Limiting Middleware

```typescript
import rateLimit from "express-rate-limit";
import { Request } from "express";

const flashcardsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes for listing
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many flashcard requests, please try again later",
    },
  },
  keyGenerator: (req: Request) => {
    return req.user?.id || req.ip; // Per user rate limiting
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```

### HTTPS Enforcement & Security Headers

```typescript
import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

const securityMiddleware = [
  helmet({
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
];

const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  if (!req.secure && req.get("x-forwarded-proto") !== "https") {
    return res.redirect(301, `https://${req.get("host")}${req.url}`);
  }
  next();
};
```

### Input Validation & Sanitization

```typescript
import DOMPurify from "isomorphic-dompurify";
import { z } from "zod";

const FlashcardQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, "Page must be a positive integer"),
  per_page: z
    .string()
    .optional()
    .default("20")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, "Per page must be between 1 and 100"),
  source: z.enum(["ai", "manual", "ai-edited"]).optional(),
  sort: z.enum(["created_at", "updated_at"]).optional().default("created_at"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

const sanitizeAndValidateQuery = (query: any) => {
  // Sanitize string inputs
  const sanitized = Object.entries(query).reduce((acc, [key, value]) => {
    if (typeof value === "string") {
      acc[key] = DOMPurify.sanitize(value.trim());
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as any);

  return FlashcardQuerySchema.parse(sanitized);
};
```

### Role-Based Access Control (RBAC)

```typescript
interface UserRole {
  name: string;
  permissions: string[];
  quotas: {
    maxFlashcardsPerPage: number;
    maxRequestsPerHour: number;
  };
}

const userRoles: Record<string, UserRole> = {
  user: {
    name: "Basic User",
    permissions: ["flashcards:read"],
    quotas: {
      maxFlashcardsPerPage: 50,
      maxRequestsPerHour: 1000,
    },
  },
  premium: {
    name: "Premium User",
    permissions: ["flashcards:read", "flashcards:export"],
    quotas: {
      maxFlashcardsPerPage: 100,
      maxRequestsPerHour: 2000,
    },
  },
};

const checkPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userRole = await getUserRole(req.user.id);
  const maxPerPage = userRoles[userRole].quotas.maxFlashcardsPerPage;

  if (
    req.query.per_page &&
    parseInt(req.query.per_page as string) > maxPerPage
  ) {
    return res.status(403).json({
      error: {
        code: "QUOTA_EXCEEDED",
        message: `Maximum ${maxPerPage} flashcards per page for ${userRole} users`,
      },
    });
  }

  next();
};
```

## 3. Complete Implementation

```typescript
import express, { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { authenticateUser } from "../middleware/auth";
import { logSecurityEvent, trackPerformance } from "../utils/monitoring";

const app = express();

app.get(
  "/api/v1/flashcards",
  enforceHTTPS,
  ...securityMiddleware,
  flashcardsRateLimit,
  authenticateUser,
  checkPermissions,
  async (req: Request, res: Response) => {
    const startTime = Date.now();
    let performanceData: any = {};

    try {
      // 1. Validate and sanitize input
      const validatedQuery = sanitizeAndValidateQuery(req.query);
      const { page, per_page, source, sort, order } = validatedQuery;

      const pageNum = parseInt(page);
      const perPage = parseInt(per_page);
      const userId = req.user.id;

      // 2. Generate cache key and check cache
      const cacheKey = `flashcards:${userId}:${JSON.stringify(validatedQuery)}`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        const cachedData = JSON.parse(cached);
        res.setHeader("X-Cache", "HIT");
        res.setHeader("ETag", generateETag(cachedData));
        res.setHeader("Cache-Control", "max-age=60, must-revalidate");

        return res.status(200).json(cachedData);
      }

      // 3. Build database query with performance tracking
      const queryStart = Date.now();

      let query = supabase
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", userId);

      // Apply filtering
      if (source) {
        query = query.eq("source", source);
      }

      // Apply sorting
      query = query.order(sort, { ascending: order === "asc" });

      // Apply pagination
      const from = (pageNum - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data: flashcards, count, error } = await query;

      performanceData.dbQueryTime = Date.now() - queryStart;

      if (error) {
        throw new DatabaseError("Failed to fetch flashcards", error);
      }

      // 4. Transform data
      const transformStart = Date.now();
      const responseData = {
        data: (flashcards || []).map(mapToFlashcardResponseDto),
        meta: {
          pagination: {
            total: count || 0,
            page: pageNum,
            per_page: perPage,
          },
        },
      };

      performanceData.transformTime = Date.now() - transformStart;

      // 5. Cache the response
      await redis.setex(cacheKey, 60, JSON.stringify(responseData));

      // 6. Set response headers
      const etag = generateETag(responseData);
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "max-age=60, must-revalidate");
      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Total-Count", count?.toString() || "0");

      // 7. Performance tracking
      performanceData.totalTime = Date.now() - startTime;
      await trackPerformance("GET /api/v1/flashcards", performanceData, userId);

      res.status(200).json(responseData);
    } catch (error) {
      performanceData.totalTime = Date.now() - startTime;
      performanceData.error = error.name;

      await trackPerformance(
        "GET /api/v1/flashcards",
        performanceData,
        req.user?.id
      );
      await handleApiError(error, res, {
        userId: req.user?.id,
        endpoint: "GET /api/v1/flashcards",
        query: req.query,
      });
    }
  }
);
```

## 4. Testing Strategy

### Unit Tests

```typescript
describe("GET /api/v1/flashcards - Unit Tests", () => {
  test("should validate query parameters correctly", () => {
    const validQuery = {
      page: "1",
      per_page: "20",
      source: "manual",
      sort: "created_at",
      order: "desc",
    };

    const result = sanitizeAndValidateQuery(validQuery);
    expect(result.page).toBe("1");
    expect(result.source).toBe("manual");
  });

  test("should reject invalid page numbers", () => {
    expect(() => {
      sanitizeAndValidateQuery({ page: "0" });
    }).toThrow("Page must be a positive integer");
  });

  test("should sanitize malicious input", () => {
    const maliciousQuery = {
      source: "<script>alert('xss')</script>manual",
    };

    const result = sanitizeAndValidateQuery(maliciousQuery);
    expect(result.source).not.toContain("<script>");
  });
});
```

### Integration Tests

```typescript
describe("GET /api/v1/flashcards - Integration Tests", () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await createTestFlashcards(testUserId, 25);
  });

  test("should return paginated flashcards with correct metadata", async () => {
    const response = await request(app)
      .get("/api/v1/flashcards?page=1&per_page=10")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.body.data).toHaveLength(10);
    expect(response.body.meta.pagination.total).toBe(25);
    expect(response.body.meta.pagination.page).toBe(1);
    expect(response.body.meta.pagination.per_page).toBe(10);
    expect(response.headers.etag).toBeDefined();
  });

  test("should filter by source correctly", async () => {
    const response = await request(app)
      .get("/api/v1/flashcards?source=manual")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    response.body.data.forEach((flashcard) => {
      expect(flashcard.source).toBe("manual");
    });
  });

  test("should respect user permissions for per_page limit", async () => {
    const basicUserToken = await generateTokenForRole("user");

    await request(app)
      .get("/api/v1/flashcards?per_page=101")
      .set("Authorization", `Bearer ${basicUserToken}`)
      .expect(403);
  });
});
```

### Security Testing (OWASP Top 10)

```typescript
describe("GET /api/v1/flashcards - Security Tests", () => {
  // A01:2021 - Broken Access Control
  test("should prevent access to other users' flashcards", async () => {
    const user1Token = await generateToken(user1Id);
    const user2Token = await generateToken(user2Id);

    // Create flashcard for user1
    await createTestFlashcard(user1Id);

    // Try to access with user2 token
    const response = await request(app)
      .get("/api/v1/flashcards")
      .set("Authorization", `Bearer ${user2Token}`)
      .expect(200);

    // Should not see user1's flashcards
    expect(response.body.data).toHaveLength(0);
  });

  // A03:2021 - Injection
  test("should prevent SQL injection in query parameters", async () => {
    const maliciousQueries = [
      "1'; DROP TABLE flashcards; --",
      "1 UNION SELECT * FROM users",
      "1' OR '1'='1",
    ];

    for (const malicious of maliciousQueries) {
      await request(app)
        .get(`/api/v1/flashcards?page=${encodeURIComponent(malicious)}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400); // Should be rejected by validation
    }
  });

  // A04:2021 - Insecure Design - Rate Limiting
  test("should enforce rate limits", async () => {
    const requests = Array(205)
      .fill(null)
      .map(() =>
        request(app)
          .get("/api/v1/flashcards")
          .set("Authorization", `Bearer ${authToken}`)
      );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter((r) => r.status === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  // A05:2021 - Security Misconfiguration
  test("should include security headers", async () => {
    const response = await request(app)
      .get("/api/v1/flashcards")
      .set("Authorization", `Bearer ${authToken}`)
      .expect(200);

    expect(response.headers["strict-transport-security"]).toBeDefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBeDefined();
  });

  // A07:2021 - Identification and Authentication Failures
  test("should require valid JWT token", async () => {
    await request(app).get("/api/v1/flashcards").expect(401);

    await request(app)
      .get("/api/v1/flashcards")
      .set("Authorization", "Bearer invalid_token")
      .expect(401);
  });
});
```

### Load Testing

```typescript
// k6 load test script
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up
    { duration: "5m", target: 50 }, // Stay at 50 users
    { duration: "2m", target: 100 }, // Ramp to 100 users
    { duration: "5m", target: 100 }, // Stay at 100 users
    { duration: "2m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // 95% of requests under 500ms
    http_req_failed: ["rate<0.01"], // Error rate under 1%
    errors: ["rate<0.01"],
  },
};

export default function () {
  const baseUrl = "http://localhost:3000";
  const token = "your_test_jwt_token";

  const params = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  // Test different scenarios
  const scenarios = [
    "/api/v1/flashcards",
    "/api/v1/flashcards?page=1&per_page=20",
    "/api/v1/flashcards?source=manual",
    "/api/v1/flashcards?sort=updated_at&order=asc",
  ];

  const endpoint = scenarios[Math.floor(Math.random() * scenarios.length)];
  const response = http.get(`${baseUrl}${endpoint}`, params);

  const result = check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "has pagination meta": (r) =>
      JSON.parse(r.body).meta?.pagination !== undefined,
    "has cache headers": (r) => r.headers["etag"] !== undefined,
  });

  errorRate.add(!result);
  sleep(1);
}
```

## 5. Performance Optimization

### Database Indexing

```sql
-- Composite index for user queries with filtering and sorting
CREATE INDEX CONCURRENTLY idx_flashcards_user_performance
ON flashcards(user_id, source, created_at DESC, updated_at DESC);

-- Index for pagination performance
CREATE INDEX CONCURRENTLY idx_flashcards_user_created
ON flashcards(user_id, created_at DESC)
WHERE user_id IS NOT NULL;

-- Partial index for specific source types
CREATE INDEX CONCURRENTLY idx_flashcards_user_ai
ON flashcards(user_id, created_at DESC)
WHERE source IN ('ai', 'ai-edited');
```

### Caching Strategy

```typescript
interface CacheStrategy {
  key: string;
  ttl: number;
  invalidateOn: string[];
}

const flashcardsCacheStrategy: CacheStrategy = {
  key: "flashcards:{userId}:{queryHash}",
  ttl: 60, // 1 minute for list queries
  invalidateOn: ["flashcard:created", "flashcard:updated", "flashcard:deleted"],
};

const cacheManager = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key);
      if (cached) {
        await this.trackCacheHit(key);
        return JSON.parse(cached);
      }
      await this.trackCacheMiss(key);
      return null;
    } catch (error) {
      console.warn("Cache get error:", error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.warn("Cache set error:", error);
    }
  },

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn("Cache invalidation error:", error);
    }
  },

  async trackCacheHit(key: string): Promise<void> {
    await statsD.increment("cache.hit", 1, {
      cache_key: this.keyCategory(key),
    });
  },

  async trackCacheMiss(key: string): Promise<void> {
    await statsD.increment("cache.miss", 1, {
      cache_key: this.keyCategory(key),
    });
  },

  keyCategory(key: string): string {
    return key.split(":")[0];
  },
};

// Cache invalidation on flashcard changes
const invalidateFlashcardsCache = async (userId: string) => {
  await cacheManager.invalidatePattern(`flashcards:${userId}:*`);
};
```

### Response Compression

```typescript
import compression from "compression";

const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers["x-no-compression"]) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Good balance of speed vs compression ratio
  threshold: 1024, // Only compress if response > 1KB
});

app.use(compressionMiddleware);
```

## 6. Monitoring & Alerting

### Key Performance Indicators

```typescript
interface FlashcardsKPIs {
  // Performance metrics
  averageResponseTime: number; // Target: <200ms P50, <500ms P95
  throughputPerSecond: number; // Target: >100 req/sec
  cacheHitRate: number; // Target: >80%

  // Business metrics
  averageFlashcardsPerUser: number;
  mostUsedFilters: string[];
  paginationPatterns: {
    averagePageSize: number;
    deepPaginationRate: number; // % of requests for page > 10
  };

  // Error metrics
  errorRate: number; // Target: <0.1%
  rateLimitHitRate: number; // Target: <5%
}

const kpiCollector = {
  async collectMetrics(): Promise<FlashcardsKPIs> {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const [responseTimes, throughput, cacheStats, errorCounts, rateLimitHits] =
      await Promise.all([
        this.getResponseTimes(oneHourAgo, now),
        this.getThroughput(oneHourAgo, now),
        this.getCacheStats(oneHourAgo, now),
        this.getErrorCounts(oneHourAgo, now),
        this.getRateLimitHits(oneHourAgo, now),
      ]);

    return {
      averageResponseTime: responseTimes.p50,
      throughputPerSecond: throughput.average,
      cacheHitRate: cacheStats.hitRate,
      errorRate: errorCounts.rate,
      rateLimitHitRate: rateLimitHits.rate,
      // ... other metrics
    };
  },
};
```

### Alerting Configuration

```typescript
interface AlertConfig {
  metric: string;
  threshold: number;
  operator: ">" | "<" | "=";
  duration: number; // seconds
  severity: "low" | "medium" | "high" | "critical";
  channels: string[];
}

const flashcardsAlerts: AlertConfig[] = [
  {
    metric: "response_time_p95",
    threshold: 1000, // 1 second
    operator: ">",
    duration: 300, // 5 minutes
    severity: "high",
    channels: ["slack", "email"],
  },
  {
    metric: "error_rate",
    threshold: 0.05, // 5%
    operator: ">",
    duration: 60, // 1 minute
    severity: "critical",
    channels: ["slack", "email", "pagerduty"],
  },
  {
    metric: "cache_hit_rate",
    threshold: 0.6, // 60%
    operator: "<",
    duration: 600, // 10 minutes
    severity: "medium",
    channels: ["slack"],
  },
  {
    metric: "throughput",
    threshold: 50, // 50 req/sec
    operator: "<",
    duration: 300, // 5 minutes
    severity: "medium",
    channels: ["slack"],
  },
];

const alertManager = {
  async checkAlerts(): Promise<void> {
    const metrics = await kpiCollector.collectMetrics();

    for (const alert of flashcardsAlerts) {
      const currentValue = metrics[alert.metric];
      const breached = this.checkThreshold(
        currentValue,
        alert.threshold,
        alert.operator
      );

      if (breached) {
        await this.triggerAlert(alert, currentValue);
      }
    }
  },

  async triggerAlert(alert: AlertConfig, currentValue: number): Promise<void> {
    const message = `🚨 ${alert.severity.toUpperCase()}: GET /api/v1/flashcards
    Metric: ${alert.metric}
    Current: ${currentValue}
    Threshold: ${alert.operator} ${alert.threshold}
    Duration: ${alert.duration}s`;

    for (const channel of alert.channels) {
      await this.sendNotification(channel, message, alert.severity);
    }
  },
};

// Schedule alert checks every minute
setInterval(() => alertManager.checkAlerts(), 60000);
```

## 7. Versioning & Deprecation Strategy

### API Versioning

```typescript
interface VersionConfig {
  version: string;
  status: "active" | "deprecated" | "sunset";
  deprecatedAt?: Date;
  sunsetAt?: Date;
  migrationGuide?: string;
}

const apiVersions: Record<string, VersionConfig> = {
  v1: {
    version: "1.0.0",
    status: "active",
  },
  v2: {
    version: "2.0.0",
    status: "active", // Future version
    migrationGuide: "/docs/migration/v1-to-v2",
  },
};

const versionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const version = req.params.version || "v1";
  const versionConfig = apiVersions[version];

  if (!versionConfig) {
    return res.status(404).json({
      error: {
        code: "VERSION_NOT_FOUND",
        message: `API version ${version} not found`,
        supportedVersions: Object.keys(apiVersions),
      },
    });
  }

  if (versionConfig.status === "deprecated") {
    res.setHeader("Sunset", versionConfig.sunsetAt?.toISOString());
    res.setHeader("Deprecation", versionConfig.deprecatedAt?.toISOString());
    res.setHeader("Link", `<${versionConfig.migrationGuide}>; rel="sunset"`);
  }

  req.apiVersion = versionConfig;
  next();
};
```

### Backward Compatibility

```typescript
// Ensure backward compatibility with field mappings
const mapResponseForVersion = (data: any, version: string): any => {
  switch (version) {
    case "v1":
      return data; // Current format
    case "v0": // Legacy support
      return {
        ...data,
        // Map new fields to old names for compatibility
        flashcards: data.data?.map((card: any) => ({
          ...card,
          created: card.createdAt, // Legacy field name
          modified: card.updatedAt, // Legacy field name
        })),
      };
    default:
      return data;
  }
};
```

## 8. Complete Error Handling

```typescript
class FlashcardsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = "FlashcardsError";
  }
}

const errorMapping = new Map([
  ["ValidationError", { status: 400, code: "VALIDATION_ERROR" }],
  ["UnauthorizedError", { status: 401, code: "UNAUTHORIZED" }],
  ["ForbiddenError", { status: 403, code: "FORBIDDEN" }],
  ["RateLimitError", { status: 429, code: "RATE_LIMIT_EXCEEDED" }],
  ["DatabaseError", { status: 500, code: "DATABASE_ERROR" }],
]);

const handleApiError = async (
  error: Error,
  res: Response,
  context: any
): Promise<void> => {
  const mapping = errorMapping.get(error.name) || {
    status: 500,
    code: "INTERNAL_ERROR",
  };

  // Log error with context
  await logError({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
    severity: mapping.status >= 500 ? "error" : "warning",
  });

  // Send structured error response
  res.status(mapping.status).json({
    error: {
      code: mapping.code,
      message: error.message,
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
};
```

## 9. Summary - 11-Point Checklist Compliance

✅ **1. URI Structure**: RESTful design with `/api/v1/flashcards`, proper versioning  
✅ **2. HTTP Semantics**: Correct GET method usage, proper status codes  
✅ **3. Security**: JWT auth, HTTPS enforcement, rate limiting, input validation, RBAC  
✅ **4. Testing**: Unit tests, integration tests, security tests (OWASP Top 10), load tests  
✅ **5. Error Handling**: Consistent format, proper HTTP codes, structured responses  
✅ **6. Pagination & Filtering**: Full pagination support with meta data, filtering by source  
✅ **7. Documentation**: Complete OpenAPI specification with examples  
✅ **8. Performance**: Redis caching, compression, database optimization, ETag support  
✅ **9. Access Control**: RBAC implementation, user quotas, permission checks  
✅ **10. Idempotency**: Stateless design, proper caching headers  
✅ **11. Versioning**: API versioning strategy, deprecation policy, backward compatibility

**Key Improvements:**

- Comprehensive OpenAPI documentation with examples
- Advanced security with RBAC and user quotas
- Multi-layered caching strategy with invalidation
- Extensive testing coverage including OWASP Top 10
- Performance monitoring with KPIs and alerting
- Database optimization with targeted indexes
- Proper versioning and migration strategies
