/**
 * URL-persisted state for the shared right-hand panel. `dOpen` flags the panel open; `dCT` (drawer
 * content type) selects which content the panel shows; `dCId` (drawer content id) is the target
 * item id, or the `new` sentinel to create one; `dMode` records whether an opened item is being
 * viewed or edited. These live on the root route as global search params (retained across
 * navigation), so the panel survives page changes and is deep-linkable.
 *
 * The panel has three nested states, each a superset of the previous:
 * - `{ dOpen }`                            → content-type tiles
 * - `{ dOpen, dCT }`                       → a searchable list of that type
 * - `{ dOpen, dCT, dCId, dMode, dTab }`    → a single item, viewed or edited, on the given tab
 *
 * `dTab` is the active tab key within a multi-tab entity (e.g. a website's `param-rules`); it is
 * optional and falls back to the entity's first tab.
 */
export type DrawerContentType
  = | "bookmark"
    | "tag"
    | "category"
    | "property"
    | "property-group"
    | "website"
    | "media-type"
    | "youtube-channel"
    | "newsletter"
    | "author"
    | "publisher"
    | "relationship-type"
    | "autofill"
    | "import-rule"
    | "notifications"
    | "filters"
    | "ai-summarization";

/** Whether an opened item is shown read-only (`view`) or in its editor (`edit`). */
export type DrawerMode = "view" | "edit";

/** Sentinel `dCId` value that opens an editor in "create" mode instead of editing an existing id. */
export const NEW_SENTINEL = "new";

/** Every content type the panel can browse, in tile/list display order. */
export const DRAWER_CONTENT_TYPES: DrawerContentType[] = [
  "bookmark",
  "tag",
  "category",
  "property",
  "property-group",
  "website",
  "media-type",
  "youtube-channel",
  "newsletter",
  "author",
  "publisher",
  "relationship-type",
  "autofill",
  "import-rule",
  "notifications",
  "filters",
  "ai-summarization",
];

export interface DrawerSearch {
  dOpen?: true;
  dCT?: DrawerContentType;
  dCId?: string;
  dMode?: DrawerMode;
  dTab?: string;
}

function isContentType(value: unknown): value is DrawerContentType {
  return typeof value === "string" && (DRAWER_CONTENT_TYPES as string[]).includes(value);
}

/**
 * Narrow an unknown search record into a `DrawerSearch`. The params only matter as a nested chain,
 * so anything past the first missing link is dropped: no `dCT` ⇒ no `dCId`/`dMode`; not open ⇒ `{}`.
 * Having a content type implies the panel is open, so a deep link with only `dCT` still opens.
 */
export function validateDrawerSearch(search: Record<string, unknown>): DrawerSearch {
  const dCT = isContentType(search.dCT) ? search.dCT : undefined;
  const dCId = typeof search.dCId === "string" && search.dCId.length > 0 ? search.dCId : undefined;
  const dMode = search.dMode === "view" || search.dMode === "edit" ? search.dMode : undefined;
  const dTab = typeof search.dTab === "string" && search.dTab.length > 0 ? search.dTab : undefined;

  // The panel is open when explicitly flagged, or whenever it carries content to show.
  const open = search.dOpen === true || search.dOpen === "true" || Boolean(dCT);
  if (!open) return {};

  if (!dCT) return {
    dOpen: true,
  };
  if (!dCId) {
    return {
      dOpen: true,
      dCT,
    };
  }
  return {
    dOpen: true,
    dCT,
    dCId,
    dMode: dMode ?? "view",
    dTab,
  };
}
