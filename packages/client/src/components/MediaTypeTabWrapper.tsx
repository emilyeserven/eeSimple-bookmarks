import { createTabWrapper } from "./TabWrapper";

import { useMediaTypeBySlug } from "@/hooks/useMediaTypes";

/** Loads a media type by slug and renders a tab's title + description header above its content. */
export const MediaTypeTabWrapper = createTabWrapper(
  "mediaTypeSlug",
  useMediaTypeBySlug,
  result => result.mediaType,
  "Media type not found.",
);
