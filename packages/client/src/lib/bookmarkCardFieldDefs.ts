import type { CustomProperty } from "@eesimple/types";

/**
 * The fixed (non-custom-property) fields a bookmark card can show, in display order. Custom
 * properties extend this list (keyed by id). Pure (no hooks) so it can be shared by the rendering
 * pipeline and the rule editor without an import cycle; the hook-backed helpers live in
 * `bookmarkCardFields.ts`, which re-exports this. Mirrors the middleware's `STANDARD_CARD_FIELD_KEYS`.
 */
export const STANDARD_CARD_FIELDS = [
  {
    key: "title",
    label: "Title",
  },
  {
    key: "description",
    label: "Description",
  },
  {
    key: "category",
    label: "Category",
  },
  {
    key: "website",
    label: "Website",
  },
  {
    key: "mediaType",
    label: "Media Type",
  },
  {
    key: "youtubeChannel",
    label: "YouTube Channel",
  },
  {
    key: "tags",
    label: "Tags",
  },
  {
    key: "locations",
    label: "Locations",
  },
  {
    key: "externalLink",
    label: "Open Link",
  },
  {
    key: "archiveLink",
    label: "Archive Link",
  },
  {
    key: "kavitaLink",
    label: "Kavita Link",
  },
  {
    key: "more",
    label: "More menu",
  },
] as const;

/** The card header field keys (title + action buttons); they default into the `card-single-top` zone. */
export const HEADER_CARD_FIELD_KEYS = ["title", "externalLink", "more"] as const;

/**
 * The custom properties eligible to appear on bookmark cards (and thus in the rule's field zones):
 * shown in listings, not a calculate property, and assigned to at least one category. Returned as
 * `{ key, label }` pairs keyed by property id, ready to merge after {@link STANDARD_CARD_FIELDS}.
 */
export function eligibleCustomCardFields(
  properties: CustomProperty[],
): { key: string;
  label: string; }[] {
  return properties
    .filter(property =>
      property.showInListings
      && property.type !== "calculate"
      && (property.allCategories || property.categoryIds.length > 0))
    .map(property => ({
      key: property.id,
      label: property.name,
    }));
}
