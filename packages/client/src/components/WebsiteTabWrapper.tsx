import { createTabWrapper } from "./TabWrapper";

import { useWebsiteBySlug } from "@/hooks/useWebsites";

/** Loads a website by slug and renders a tab's title + description header above its content. */
export const WebsiteTabWrapper = createTabWrapper(
  "websiteSlug",
  useWebsiteBySlug,
  result => result.website,
  "Website not found.",
);
