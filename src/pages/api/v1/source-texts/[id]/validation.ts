import { z } from "zod";

export const SourceTextIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid UUID format" }),
});
