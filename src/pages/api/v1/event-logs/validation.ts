import { z } from "zod";
import type { EventSeverity, EventType } from "./types";

/**
 * Zod schema for event log query parameters validation
 */
export const EventLogQuerySchema = z.object({
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

  eventType: z
    .enum([
      "aiCardCreated",
      "aiEditedCardCreated",
      "manualCardCreated",
      "aiCardReviewed",
      "cardEdited",
      "cardDeleted",
    ])
    .optional()
    .transform((val) => val as EventType | undefined),

  severity: z
    .enum(["info", "warning", "error", "critical"])
    .optional()
    .transform((val) => val as EventSeverity | undefined),

  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * Type for validated query parameters
 */
export type ValidatedEventLogQuery = z.infer<typeof EventLogQuerySchema>;

/**
 * Validate and sanitize query parameters
 * @param query - Raw query parameters from request
 * @returns Validated and sanitized query parameters
 */
export function validateEventLogQuery(
  query: Record<string, string | string[] | undefined>
): ValidatedEventLogQuery {
  // Convert query parameters to string format expected by Zod
  const stringQuery: Record<string, string> = {};

  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      stringQuery[key] = value[0] || "";
    } else if (typeof value === "string") {
      stringQuery[key] = value;
    }
  }

  return EventLogQuerySchema.parse(stringQuery);
}
