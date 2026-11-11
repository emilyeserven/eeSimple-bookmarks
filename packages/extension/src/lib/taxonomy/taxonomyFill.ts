import type { ExtensionFillContext, ExtensionFillTaxonomyOption, TaxonomyEntityAssociation, TaxonomyEntityAssociationSpec, TaxonomyEntityRelationSpec } from "@eesimple/types";

import { TAXONOMY_ENTITY_SPECS } from "@eesimple/types";

/*
 * Taxonomy match-or-create resolvers + the created/failed summary helpers used by the popup's apply
 * step. `resolveTaxonomyId` is the load-bearing bit: it matches an extracted taxonomy name against the
 * fill-context option list (case-insensitive) or creates a name-only stub, and reports *why* via
 * `{ id, created }` so the apply flow can note created entities and surface genuine failures.
 *
 * The per-association registry is `TAXONOMY_ENTITY_SPECS` from `@eesimple/types`, imported directly —
 * the popup used to carry a hand-copied mirror of it.
 */

/** A bookmark taxonomy kind a `taxonomy` fill target writes (multi-valued, stub-creatable by name). */
export type BookmarkTaxonomyKind = "people" | "groups" | "locations" | "tags";

/** Which taxonomy kind maps to which bookmark PATCH id-array field. */
export const TAX_PATCH_KEY = {
  people: "personIds",
  groups: "groupIds",
  locations: "locationIds",
  tags: "tagIds",
} as const satisfies Record<BookmarkTaxonomyKind, string>;

/** Display noun of each association (for "no linked …" row notes). Exhaustive — a new association fails `tsc`. */
export const ENTITY_NOUN: Record<TaxonomyEntityAssociation, string> = {
  website: "website",
  category: "category",
  mediaType: "media type",
  youtubeChannel: "YouTube channel",
  newsletter: "newsletter",
  people: "person",
  groups: "group",
  tags: "tag",
  locations: "location",
};

/** The registry entry of an association (the spec type, so optional `image`/`relations` are visible). */
export function entitySpec(association: TaxonomyEntityAssociation): TaxonomyEntityAssociationSpec {
  return TAXONOMY_ENTITY_SPECS[association];
}

/** A kind that appears in the created/failed summary: a bookmark taxonomy, or a relation option list. */
export type SummaryKind = BookmarkTaxonomyKind | "websites" | "youtubeChannels";

/** Singular / plural nouns for the post-apply summary lines. */
export const TAX_NOUN: Record<SummaryKind, { one: string;
  many: string; }> = {
  people: {
    one: "person",
    many: "people",
  },
  groups: {
    one: "group",
    many: "groups",
  },
  locations: {
    one: "location",
    many: "locations",
  },
  tags: {
    one: "tag",
    many: "tags",
  },
  websites: {
    one: "website",
    many: "websites",
  },
  youtubeChannels: {
    one: "YouTube channel",
    many: "YouTube channels",
  },
};

/** Whether a string is a {@link SummaryKind} (an association that also has summary nouns). */
export function isSummaryKind(kind: string): kind is SummaryKind {
  return Object.hasOwn(TAX_NOUN, kind);
}

/** A resolver outcome: `id` is null only when the name truly couldn't be matched or created. */
export interface ResolveResult {
  id: string | null;
  created: boolean;
}

const NOT_RESOLVED: ResolveResult = {
  id: null,
  created: false,
};

function findByName(list: readonly ExtensionFillTaxonomyOption[], lower: string): ExtensionFillTaxonomyOption | undefined {
  return list.find(o => o.name.toLowerCase() === lower);
}

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

/** POST a name-only stub; the new id, or null on any failure. */
async function createStub(serverUrl: string, kind: string, name: string): Promise<string | null> {
  try {
    const res = await postJson(`${serverUrl}/api/${kind}`, {
      name,
    });
    if (!res.ok) return null;
    const created = await res.json() as { id?: string } | null;
    return created?.id ?? null;
  }
  catch {
    return null;
  }
}

/** Re-fetch the whole list and match by name (the duplicate-create race fallback). */
async function refetchMatch(serverUrl: string, kind: string, lower: string): Promise<ExtensionFillTaxonomyOption | null> {
  try {
    const res = await fetch(`${serverUrl}/api/${kind}`);
    if (!res.ok) return null;
    const all: unknown = await res.json();
    if (!Array.isArray(all)) return null;
    const match = (all as Partial<ExtensionFillTaxonomyOption>[])
      .find(o => typeof o?.name === "string" && o.name.toLowerCase() === lower);
    return match?.id && match.name
      ? {
        id: match.id,
        name: match.name,
      }
      : null;
  }
  catch {
    return null;
  }
}

/**
 * Resolve a taxonomy name to an id: match an existing option (case-insensitive), else create a
 * name-only stub. On a duplicate-create race (or any create failure), re-fetch the list and re-match
 * by name so the value still links. Newly found ids are pushed onto `optionList` for later rows.
 */
export async function resolveTaxonomyId(
  serverUrl: string,
  kind: string,
  name: string,
  optionList: ExtensionFillTaxonomyOption[],
): Promise<ResolveResult> {
  const lower = name.toLowerCase();
  const hit = findByName(optionList, lower);
  if (hit) return {
    id: hit.id,
    created: false,
  };
  const createdId = await createStub(serverUrl, kind, name);
  if (createdId) {
    optionList.push({
      id: createdId,
      name,
    });
    return {
      id: createdId,
      created: true,
    };
  }
  const match = await refetchMatch(serverUrl, kind, lower);
  if (!match) return NOT_RESOLVED;
  optionList.push(match);
  return {
    id: match.id,
    created: false,
  };
}

/**
 * Resolve an extracted name to a *related* taxonomy id for a `relation:<key>` target. A `matchOnly`
 * relation (websites/youtube-channels — their create routes need a domain/channelUrl) never POSTs and
 * returns `{ id: null }` on a miss so the caller surfaces it.
 */
export async function resolveRelationId(
  serverUrl: string,
  relSpec: Pick<TaxonomyEntityRelationSpec, "resolveKind" | "matchOnly">,
  name: string,
  optionList: ExtensionFillTaxonomyOption[],
): Promise<ResolveResult> {
  const hit = findByName(optionList, name.toLowerCase());
  if (hit) return {
    id: hit.id,
    created: false,
  };
  if (relSpec.matchOnly) return NOT_RESOLVED;
  return resolveTaxonomyId(serverUrl, relSpec.resolveKind, name, optionList);
}

// A minimal duplicate of the middleware's `normalizeLanguageCode` (utils/languageCodes.ts): reduce a
// BCP-47 tag or 3-letter code to an ISO-639-1 primary subtag. Covers only the primary subtag + common
// bibliographic 3→2 codes; the server's `isoCode` uniqueness on match-or-create catches the long tail.
const ALT_CODE_TO_ISO1: Record<string, string> = {
  eng: "en",
  jpn: "ja",
  kor: "ko",
  fra: "fr",
  fre: "fr",
  deu: "de",
  ger: "de",
  spa: "es",
  zho: "zh",
  chi: "zh",
  por: "pt",
  rus: "ru",
  ita: "it",
  nld: "nl",
  dut: "nl",
  ara: "ar",
};

export function normalizeLanguageCode(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const primary = String(raw).trim().toLowerCase().replace(/_/g, "-").split("-")[0];
  if (!primary || primary.length < 2) return null;
  return ALT_CODE_TO_ISO1[primary] ?? primary;
}

export type LanguageOption = NonNullable<ExtensionFillContext["languages"]>[number];

/**
 * Resolve an extracted page-language code to a Language id: normalize, match by `isoCode`, else create
 * a Language (name falls back to the code).
 */
export async function resolveLanguageId(
  serverUrl: string,
  rawCode: string,
  languages: LanguageOption[],
): Promise<ResolveResult> {
  const code = normalizeLanguageCode(rawCode);
  if (!code) return NOT_RESOLVED;
  const hit = languages.find(l => l.isoCode === code);
  if (hit) return {
    id: hit.id,
    created: false,
  };
  try {
    const res = await postJson(`${serverUrl}/api/languages`, {
      name: code,
      isoCode: code,
    });
    if (res.ok) {
      const created = await res.json() as { id?: string;
        name?: string; } | null;
      if (created?.id) {
        languages.push({
          id: created.id,
          name: created.name || code,
          isoCode: code,
        });
        return {
          id: created.id,
          created: true,
        };
      }
    }
  }
  catch {
    // give up — surfaced as a failure by the caller
  }
  return NOT_RESOLVED;
}

/** One created / failed taxonomy name, for the post-apply summary. */
export interface SummaryEntry {
  kind: SummaryKind;
  name: string;
}

/** Group entries by kind (first-seen order) and render each group, joined with a space. */
function summarizeByKind(entries: readonly SummaryEntry[], render: (kind: SummaryKind, names: string[]) => string): string {
  const byKind = new Map<SummaryKind, string[]>();
  for (const entry of entries) {
    const names = byKind.get(entry.kind) ?? [];
    names.push(entry.name);
    byKind.set(entry.kind, names);
  }
  return [...byKind].map(([kind, names]) => render(kind, names)).join(" ");
}

function noun(kind: SummaryKind, count: number): string {
  return count === 1 ? TAX_NOUN[kind].one : TAX_NOUN[kind].many;
}

/** "Created 2 new people: X, Y." — the post-apply confirmation for freshly-minted stubs. */
export function summarizeCreated(created: readonly SummaryEntry[]): string {
  return summarizeByKind(created, (kind, names) =>
    `Created ${names.length} new ${noun(kind, names.length)}: ${names.join(", ")}.`);
}

/** "Couldn't create 1 group: Z." — surfaced when a name failed to match or create. */
export function summarizeFailed(failed: readonly SummaryEntry[]): string {
  return summarizeByKind(failed, (kind, names) =>
    `Couldn't create ${names.length} ${noun(kind, names.length)}: ${names.join(", ")}.`);
}
