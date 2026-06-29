import { z } from "zod";

/**
 * Shared name (+ parent) schema for tag forms. `parent` is always present in form state (defaulting
 * to the ROOT sentinel) even when the parent select is hidden, so one schema covers both the
 * name-only and parented cases. Used by both `TagForm` (create, submit) and `TagGeneralForm` (edit,
 * auto-save) so the two surfaces validate identically.
 */
export const tagSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  romanizedName: z.string(),
  parent: z.string(),
});
