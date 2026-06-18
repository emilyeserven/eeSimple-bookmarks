import { createTabWrapper } from "./TabWrapper";

import { useCategoryBySlug } from "@/hooks/useCategories";

/** Loads a category by slug and renders a tab's title + description header above its content. */
export const CategoryEditTabWrapper = createTabWrapper(
  "categorySlug",
  useCategoryBySlug,
  result => result.category,
  "Category not found.",
);
