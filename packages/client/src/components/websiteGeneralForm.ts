import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { z } from "zod";

import i18n from "@/i18n";
import { socialLinkSchema } from "@/lib/socialLinks";

export const websiteGeneralSchema = z.object({
  siteName: z.string().trim().min(1, i18n.t("Site name is required")),
  domain: z.string().trim().min(1, i18n.t("Domain is required")),
  description: z.string(),
  socialLinks: z.array(socialLinkSchema),
});

export const WEBSITE_LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  siteName: "Site name",
  domain: "Domain",
  description: "Description",
  categoryId: "Category",
  mediaTypeId: "Media type",
  tagIds: "Default tags",
  socialLinks: "Social media links",
  youtubeChannelIds: "YouTube channels",
  alternateNames: "Alternate names",
  redirectResolutionFailure: "Redirect resolution failure",
};

/** The autosave snapshot for a website's editable fields, with all nullable defaults applied. */
export function websiteAutoSaveInitial(website: Website): UpdateWebsiteInput {
  return {
    siteName: website.siteName,
    domain: website.domain,
    description: website.description ?? null,
    categoryId: website.category?.id ?? null,
    mediaTypeId: website.mediaTypeId ?? null,
    tagIds: website.tagIds ?? [],
    socialLinks: website.socialLinks,
    youtubeChannelIds: website.youtubeChannelIds ?? [],
    alternateNames: website.alternateNames,
    redirectResolutionFailure: website.redirectResolutionFailure ?? false,
  };
}
