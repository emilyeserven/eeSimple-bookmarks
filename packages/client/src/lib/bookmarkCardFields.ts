import { useUiStore } from "../stores/uiStore";

/**
 * The fixed (non-custom-property) fields a bookmark card can show, in display order. The Card
 * Options popover lists these alongside the page's custom properties; their keys are stored in
 * `uiStore.hiddenCardFields` when toggled off.
 */
export const STANDARD_CARD_FIELDS = [
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
] as const;

/**
 * The set of card field keys hidden for a listing page. Empty when `pageKey` is absent (e.g. the
 * homepage or right-panel cards, which never hide fields).
 */
export function useHiddenCardFields(pageKey?: string): Set<string> {
  const hidden = useUiStore(state => (pageKey ? state.hiddenCardFields[pageKey] : undefined));
  return new Set(hidden ?? []);
}
