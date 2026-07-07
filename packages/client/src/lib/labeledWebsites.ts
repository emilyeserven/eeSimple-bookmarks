import { z } from "zod";

/** zod schema for a single {@link import("@eesimple/types").LabeledWebsite} row. */
export const labeledWebsiteSchema = z.object({
  label: z.string(),
  url: z.string(),
  websiteId: z.string().nullable(),
});
