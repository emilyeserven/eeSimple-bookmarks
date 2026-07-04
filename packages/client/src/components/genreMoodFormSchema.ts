import { z } from "zod";

/** Name (+ parent) schema for the Genres & Moods edit form (auto-save). */
export const genreMoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  parent: z.string(),
});
