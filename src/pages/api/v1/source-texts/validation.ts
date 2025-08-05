import { z } from "zod";

export const CreateSourceTextSchema = z.object({
  textContent: z
    .string()
    .min(1, "Text content is required")
    .max(10000, "Text content must be at most 10000 characters"),
});
