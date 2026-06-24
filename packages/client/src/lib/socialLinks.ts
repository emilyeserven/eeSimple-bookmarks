import { SOCIAL_MEDIA_PLATFORM_LABELS, SOCIAL_MEDIA_PLATFORMS } from "@eesimple/types";
import { z } from "zod";

export { SOCIAL_MEDIA_PLATFORM_LABELS, SOCIAL_MEDIA_PLATFORMS };

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_MEDIA_PLATFORMS),
  url: z.string(),
});
