import { z } from "zod";

/** Name (+ description + parent) schema for the Genres & Moods edit form (auto-save). */
export const genreMoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  parent: z.string(),
});
