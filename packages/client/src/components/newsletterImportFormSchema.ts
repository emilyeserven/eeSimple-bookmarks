import { z } from "zod";

/** Ingest sources offered by the newsletter import form. */
export type IngestSource = "paste" | "url" | "upload";

/**
 * Validates the ingest form. The uploaded file lives in component state (not the form), so file
 * presence is gated on the submit button rather than here; this schema covers the paste/url fields.
 */
export const newsletterImportSchema = z
  .object({
    source: z.enum(["paste", "url", "upload"]),
    pastedContent: z.string(),
    fetchUrl: z.string(),
    categoryId: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "paste" && value.pastedContent.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pastedContent"],
        message: "Paste some newsletter content.",
      });
    }
    if (value.source === "url") {
      try {
        const parsed = new URL(value.fetchUrl);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("scheme");
      }
      catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fetchUrl"],
          message: "Enter a valid http(s) URL.",
        });
      }
    }
  });
