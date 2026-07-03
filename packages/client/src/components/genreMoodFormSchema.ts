import { z } from "zod";

/** Name (+ optional romanized + parent) schema for the Genres & Moods edit form (auto-save). */
export const genreMoodSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  parent: z.string(),
});
