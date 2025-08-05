import { z } from "zod";
import type { FlashcardSource } from "../../../../common/types";

/**
 * Zod schema for flashcard query parameters validation
 */
export const FlashcardQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1;
    }, "Page must be a positive integer")
    .transform((val) => parseInt(val, 10)),

  perPage: z
    .string()
    .optional()
    .default("20")
    .refine((val) => {
      const num = parseInt(val, 10);
      return !isNaN(num) && num >= 1 && num <= 100;
    }, "Per page must be between 1 and 100")
    .transform((val) => parseInt(val, 10)),

  source: z
    .enum(["ai", "manual", "ai-edited"])
    .optional()
    .transform((val) => val as FlashcardSource | undefined),

  sort: z.enum(["createdAt", "updatedAt"]).optional().default("createdAt"),

  order: z.enum(["asc", "desc"]).optional().default("desc"),
});

/**
 * Type for validated query parameters
 */
export type ValidatedFlashcardQuery = z.infer<typeof FlashcardQuerySchema>;

/**
 * Validate and sanitize query parameters
 * @param query - Raw query parameters from request
 * @returns Validated and sanitized query parameters
 */
export function validateFlashcardQuery(
  query: Record<string, string | string[] | undefined>
): ValidatedFlashcardQuery {
  // Convert query parameters to string format expected by Zod
  const stringQuery: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      stringQuery[key] = value[0] || "";
    } else if (typeof value === "string") {
      stringQuery[key] = value;
    }
  }

  return FlashcardQuerySchema.parse(stringQuery);
}

// POST /flashcards validation
export const CreateManualFlashcardSchema = z.object({
  mode: z.literal("manual"),
  front: z
    .string()
    .min(1, "Front is required")
    .max(250, "Front must be at most 250 characters"),
  back: z
    .string()
    .min(1, "Back is required")
    .max(750, "Back must be at most 750 characters"),
  sourceTextId: z.string().uuid().optional(),
});

export const CreateAIFlashcardsSchema = z.object({
  mode: z.literal("ai"),
  textContent: z
    .string()
    .min(1, "Text content is required")
    .max(10000, "Text content must be at most 10000 characters"),
});

export const CreateFlashcardSchema = z.discriminatedUnion("mode", [
  CreateManualFlashcardSchema,
  CreateAIFlashcardsSchema,
]);
