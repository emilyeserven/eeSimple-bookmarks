/**
 * Registry backing the extension-fill `taxonomyEntity` target — a rule that writes an extracted
 * value into a fixed field of a taxonomy term the bookmark is **linked to** (not the bookmark
 * itself). This is the single source of truth shared by the fill-context service, the rule editor,
 * and the popup, so the four-place lockstep for this target kind stays data-driven.
 *
 * Field applicability mirrors what each entity's PATCH route actually accepts over the wire — do not
 * list a field the route rejects (e.g. `year` is on `UpdatePersonInput` but the people route body
 * omits it, so People expose only name/description/socialLink here).
 */

import type { SocialLink } from "./socialMedia.js";

/** A bookmark-linked taxonomy whose term(s) a `taxonomyEntity` rule can update. */
export const TAXONOMY_ENTITY_ASSOCIATIONS = [
  "website",
  "category",
  "mediaType",
  "youtubeChannel",
  "newsletter",
  "group",
  "people",
  "groups",
  "tags",
  "locations",
] as const;
export type TaxonomyEntityAssociation = typeof TAXONOMY_ENTITY_ASSOCIATIONS[number];

/** A writable field of a taxonomy term. `socialLink` pairs with a `socialPlatform` on the target. */
export const TAXONOMY_ENTITY_FIELDS = ["name", "description", "year", "socialLink"] as const;
export type TaxonomyEntityFieldKey = typeof TAXONOMY_ENTITY_FIELDS[number];

/** Human labels for the writable fields (wrapped in `t()` at UI sites; used verbatim in the popup). */
export const TAXONOMY_ENTITY_FIELD_LABELS: Record<TaxonomyEntityFieldKey, string> = {
  name: "Name",
  description: "Description",
  year: "Year",
  socialLink: "Social link",
};

/** Static description of one association: its label, REST path, cardinality, and writable fields. */
export interface TaxonomyEntityAssociationSpec {
  /** Shown in the editor picker + popup rows. */
  label: string;
  /** REST base path for the PATCH that writes the field (e.g. `/api/websites`). */
  apiPath: string;
  /** True when the bookmark links at most one term (auto-target); false = multi (pick in popup). */
  single: boolean;
  /** PATCH key for the `name` field — websites use `siteName`, everything else `name`. */
  nameKey: "name" | "siteName";
  /** Which writable fields this entity's update route accepts. */
  fields: TaxonomyEntityFieldKey[];
}

/**
 * The registry. Exhaustive via `satisfies Record<TaxonomyEntityAssociation, …>` — a missing
 * association fails `tsc`. `website`/`category`/`mediaType`/`youtubeChannel`/`newsletter`/`group` are
 * single-valued links; `people`/`groups`/`tags`/`locations` are multi-valued.
 */
export const TAXONOMY_ENTITY_SPECS = {
  website: {
    label: "Website",
    apiPath: "/api/websites",
    single: true,
    nameKey: "siteName",
    fields: ["name", "description", "socialLink"],
  },
  category: {
    label: "Category",
    apiPath: "/api/categories",
    single: true,
    nameKey: "name",
    fields: ["name", "description"],
  },
  mediaType: {
    label: "Media type",
    apiPath: "/api/media-types",
    single: true,
    nameKey: "name",
    fields: ["name", "description"],
  },
  youtubeChannel: {
    label: "YouTube channel",
    apiPath: "/api/youtube-channels",
    single: true,
    nameKey: "name",
    fields: ["name", "description"],
  },
  newsletter: {
    label: "Newsletter",
    apiPath: "/api/newsletters",
    single: true,
    nameKey: "name",
    fields: ["name", "description"],
  },
  group: {
    label: "Publisher (Group)",
    apiPath: "/api/groups",
    single: true,
    nameKey: "name",
    fields: ["name", "description", "year", "socialLink"],
  },
  people: {
    label: "People",
    apiPath: "/api/people",
    single: false,
    nameKey: "name",
    // People's update route accepts name/description/socialLinks but not year (unlike Groups).
    fields: ["name", "description", "socialLink"],
  },
  groups: {
    label: "Groups (creators)",
    apiPath: "/api/groups",
    single: false,
    nameKey: "name",
    fields: ["name", "description", "year", "socialLink"],
  },
  tags: {
    label: "Tags",
    apiPath: "/api/tags",
    single: false,
    nameKey: "name",
    fields: ["name", "description"],
  },
  locations: {
    label: "Locations",
    apiPath: "/api/locations",
    single: false,
    nameKey: "name",
    fields: ["name", "description"],
  },
} satisfies Record<TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec>;

/**
 * One linked term with the current values of its writable fields, sent by
 * `GET /api/extension/fill-context` under `associatedTerms` so the popup can show current → extracted
 * and upsert a social link without wiping the term's other platforms. Fields the entity lacks are
 * simply absent.
 */
export interface TaxonomyEntityTermRef {
  id: string;
  name: string;
  description?: string | null;
  socialLinks?: SocialLink[];
  year?: number | null;
}
