import { z } from "zod";

export const FlashcardIdParamSchema = z.object({
  id: z.string().refine(
    (id) => {
      // Akceptuj UUID lub mock ID (mock-{timestamp}-{random})
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const mockIdRegex = /^mock-\d+-[a-z0-9]+$/;
      return uuidRegex.test(id) || mockIdRegex.test(id);
    },
    {
      message:
        "Invalid ID format. Must be UUID or mock ID (mock-{timestamp}-{random})",
    }
  ),
});

// PATCH /flashcards/:id validation
export const UpdateFlashcardSchema = z
  .object({
    front: z
      .string()
      .min(1, "Front cannot be empty")
      .max(250, "Front must be at most 250 characters")
      .optional(),
    back: z
      .string()
      .min(1, "Back cannot be empty")
      .max(750, "Back must be at most 750 characters")
      .optional(),
  })
  .refine((data) => data.front !== undefined || data.back !== undefined, {
    message: "At least one field (front or back) must be provided",
  });
