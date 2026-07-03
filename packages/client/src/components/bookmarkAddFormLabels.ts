import type { BookmarkAddFormStandardField } from "@eesimple/types";

/**
 * Human-readable labels for the standard Add Bookmark form fields, keyed by their
 * {@link BookmarkAddFormStandardField} identifier. Exhaustive so a new tuple entry fails `tsc` here.
 * Shared between the field registry and the Settings → Display → Add Bookmark Form placement page.
 */
export const STANDARD_FIELD_LABELS: Record<BookmarkAddFormStandardField, string> = {
  title: "Name",
  romanizedTitle: "Romanized name",
  categoryId: "Category",
  mediaTypeId: "Media Type",
  languageId: "Language",
  groupId: "Group",
  descriptionTags: "Description & Tags",
  personIds: "People",
  image: "Image",
};
