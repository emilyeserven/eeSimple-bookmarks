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

/** A writable scalar field of a taxonomy term. `socialLink` pairs with a `socialPlatform` on the target. */
export const TAXONOMY_ENTITY_FIELDS = ["name", "description", "year", "socialLink"] as const;
export type TaxonomyEntityFieldKey = typeof TAXONOMY_ENTITY_FIELDS[number];

/** Human labels for the writable scalar fields (wrapped in `t()` at UI sites; used verbatim in the popup). */
export const TAXONOMY_ENTITY_FIELD_LABELS: Record<TaxonomyEntityFieldKey, string> = {
  name: "Name",
  description: "Description",
  year: "Year",
  socialLink: "Social link",
};

/**
 * A relation a linked term can hold to a **related** taxonomy — the extracted value(s) are name(s)
 * resolved (match-or-create) to id(s) and **unioned** into the owner term's id-array via its PATCH
 * route (e.g. a linked Person's `groupIds`). These back the `relation:<key>` write-keys below.
 */
export const TAXONOMY_ENTITY_RELATION_KEYS = ["groups", "websites", "youtubeChannels"] as const;
export type TaxonomyEntityRelationKey = typeof TAXONOMY_ENTITY_RELATION_KEYS[number];

/** Human labels for the relation write-keys (wrapped in `t()` at UI sites; used verbatim in the popup). */
export const TAXONOMY_ENTITY_RELATION_LABELS: Record<TaxonomyEntityRelationKey, string> = {
  groups: "Groups",
  websites: "Websites",
  youtubeChannels: "YouTube channels",
};

/**
 * The write-selector carried on a `taxonomyEntity` target's `field`: a scalar field, a relation
 * (`relation:<key>`), or the language write (`"language"`). The `relation:` prefix avoids collision
 * with scalar keys, so every consumer can cheaply branch on `field.startsWith("relation:")` /
 * `field === "language"`.
 */
export type TaxonomyEntityWriteKey
  = | TaxonomyEntityFieldKey
    | `relation:${TaxonomyEntityRelationKey}`
    | "language";

/** All legal write-keys — the enum source for the middleware body schema (kept in lockstep). */
export const TAXONOMY_ENTITY_WRITE_KEYS: TaxonomyEntityWriteKey[] = [
  ...TAXONOMY_ENTITY_FIELDS,
  ...TAXONOMY_ENTITY_RELATION_KEYS.map(key => `relation:${key}` as const),
  "language",
];

/**
 * Static description of one relation an association's term can hold. `matchOnly` marks a related
 * taxonomy whose create route needs more than a name (Websites need a `domain`, YouTube channels a
 * `channelUrl`) — so the popup matches an existing option only and never mints a stub for it.
 */
export interface TaxonomyEntityRelationSpec {
  key: TaxonomyEntityRelationKey;
  /** Shown in the editor field picker + popup rows. */
  label: string;
  /** REST segment for match(-or-create): `groups` / `websites` / `youtube-channels`. */
  resolveKind: string;
  /** Name key when matching/creating — websites resolve by `siteName`, everything else `name`. */
  resolveNameKey: "name" | "siteName";
  /** Owner PATCH body key that carries the id-array (unioned with the term's current ids). */
  patchKey: "groupIds" | "websiteIds" | "youtubeChannelIds";
  /** `ExtensionFillContext.relationOptions` key for the compact option list. */
  optionKey: TaxonomyEntityRelationKey;
  /** True when the related taxonomy can't be stub-created by name (match existing only). */
  matchOnly: boolean;
}

/** A language-usage owner type — the associations that can carry a linked-term primary-language write. */
export type TaxonomyEntityLanguageOwnerType = "website" | "youtubeChannel" | "person";

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
  /** Which writable scalar fields this entity's update route accepts. */
  fields: TaxonomyEntityFieldKey[];
  /** Relations this association's PATCH route accepts (id-array union). Omitted = none. */
  relations?: TaxonomyEntityRelationSpec[];
  /** Set when this association is a `language_usages` owner — the owner type for the PUT. Omitted = not. */
  languageOwnerType?: TaxonomyEntityLanguageOwnerType;
}

/** The Groups relation — creatable by name (reuses the publisher stub-create path). */
const GROUPS_RELATION: TaxonomyEntityRelationSpec = {
  key: "groups",
  label: TAXONOMY_ENTITY_RELATION_LABELS.groups,
  resolveKind: "groups",
  resolveNameKey: "name",
  patchKey: "groupIds",
  optionKey: "groups",
  matchOnly: false,
};

/** The Websites relation — match-only (create needs a `domain`, not just a name). */
const WEBSITES_RELATION: TaxonomyEntityRelationSpec = {
  key: "websites",
  label: TAXONOMY_ENTITY_RELATION_LABELS.websites,
  resolveKind: "websites",
  resolveNameKey: "siteName",
  patchKey: "websiteIds",
  optionKey: "websites",
  matchOnly: true,
};

/** The YouTube-channels relation — match-only (create needs a `channelUrl`, not just a name). */
const YOUTUBE_CHANNELS_RELATION: TaxonomyEntityRelationSpec = {
  key: "youtubeChannels",
  label: TAXONOMY_ENTITY_RELATION_LABELS.youtubeChannels,
  resolveKind: "youtube-channels",
  resolveNameKey: "name",
  patchKey: "youtubeChannelIds",
  optionKey: "youtubeChannels",
  matchOnly: true,
};

/**
 * The registry. Exhaustive via `satisfies Record<TaxonomyEntityAssociation, …>` — a missing
 * association fails `tsc`. `website`/`category`/`mediaType`/`youtubeChannel`/`newsletter`/`group` are
 * single-valued links; `people`/`groups`/`tags`/`locations` are multi-valued. `relations` /
 * `languageOwnerType` mark the associations that additionally accept a relation write (people/groups)
 * or a linked-term primary-language write (website/youtubeChannel/people).
 */
export const TAXONOMY_ENTITY_SPECS = {
  website: {
    label: "Website",
    apiPath: "/api/websites",
    single: true,
    nameKey: "siteName",
    fields: ["name", "description", "socialLink"],
    languageOwnerType: "website",
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
    languageOwnerType: "youtubeChannel",
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
    // People's PATCH accepts groupIds/websiteIds/youtubeChannelIds; person is a language_usage owner.
    relations: [GROUPS_RELATION, WEBSITES_RELATION, YOUTUBE_CHANNELS_RELATION],
    languageOwnerType: "person",
  },
  groups: {
    label: "Groups (creators)",
    apiPath: "/api/groups",
    single: false,
    nameKey: "name",
    fields: ["name", "description", "year", "socialLink"],
    // Groups' PATCH accepts websiteIds/youtubeChannelIds only — the person↔group edge is person-owned,
    // so there is no `groups` relation here. Group is not a language_usage owner.
    relations: [WEBSITES_RELATION, YOUTUBE_CHANNELS_RELATION],
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
  /**
   * Current relation id-arrays, populated only for people/groups terms referenced by a `relation:<key>`
   * target — so the popup unions extracted ids with the term's existing links instead of overwriting.
   */
  groupIds?: string[];
  websiteIds?: string[];
  youtubeChannelIds?: string[];
  /**
   * Current language usages, populated only for website/youtubeChannel/people terms referenced by a
   * `language` target — so the popup merges the primary-language entry without wiping the term's other
   * language rows (the PUT is replace-all).
   */
  languageUsages?: { languageId: string;
    usageLevelId: string; }[];
}
