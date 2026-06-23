import { z } from "zod";

/** Ingest sources offered by the import form. */
export type IngestSource = "paste" | "url" | "upload";

/** True when rich-text HTML has no visible content (an empty TipTap doc serializes to `<p></p>`). */
function isEmptyRichTextHtml(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;|\u00a0/g, "").trim().length === 0;
}

/**
 * Validates the ingest form. The uploaded file lives in component state (not the form), so file
 * presence is gated on the submit button rather than here; this schema covers the paste/url fields.
 */
export const importFormSchema = z
  .object({
    source: z.enum(["paste", "url", "upload"]),
    pastedContent: z.string(),
    fetchUrl: z.string(),
    newsletterId: z.string().nullable(),
    categoryId: z.string(),
  })
  .superRefine((value, ctx) => {
    if (value.source === "paste" && isEmptyRichTextHtml(value.pastedContent)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pastedContent"],
        message: "Paste some content.",
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
