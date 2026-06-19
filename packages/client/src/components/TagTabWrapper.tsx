import { createTabWrapper } from "./TabWrapper";

import { useTagBySlug } from "@/hooks/useTags";

/** Loads a tag by slug and renders a tab's title + description header above its content. */
export const TagTabWrapper = createTabWrapper(
  "tagSlug",
  useTagBySlug,
  result => result.tag,
  "Tag not found.",
);
