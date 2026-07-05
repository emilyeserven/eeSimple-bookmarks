/**
 * Resolve a media-taxonomy title (Movie / TV Show / Episode / Album / Track) to its Wikidata
 * item, and from there its native-script name, romanized (English) name, and Wikipedia article links.
 * Powers the "Autofetch from Plex" action: a Plex item's external IDs (IMDb / TMDb / TVDB / MusicBrainz)
 * pin the exact Wikidata item precisely, falling back to a plain title search when no ID matches — the
 * media sibling of the Locations `resolveWikipediaLinks` convenience autofill.
 *
 * Following the Locations convention, the returned `name` is the native-script label (e.g. 기생충) and
 * `englishName` is the English label (e.g. Parasite). Best-effort: any failure or no match resolves
 * to `null` (the caller leaves the existing fields untouched).
 */

import {
  asString,
  cleanSitelinks,
  claimEntityIds,
  detectWikipediaLanguage,
  findEntityByStatement,
  firstClaimValue,
  getEntities,
  searchEntities,
  type WikidataEntity,
  type WikidataSnakValue,
} from "@/services/wikidata";

/** An external-ID statement to match a Wikidata item on (e.g. `{ property: "P345", value: "tt6751668" }`). */
export interface WikidataExternalId {
  /** The Wikidata property id (`P345` IMDb, `P4947` TMDb film, `P434` MusicBrainz artist, …). */
  property: string;
  value: string;
}

export interface TitleWikidataResolution {
  /** The resolved Wikidata QID. */
  wikidataId: string;
  /** Native-script name (Wikidata's original-language / native label), or `null` when none is found. */
  name: string | null;
  /** English label, when it differs from `name`; else `null`. */
  englishName: string | null;
  wikipediaLinkEn: string | null;
  wikipediaLinkLocal: string | null;
}

/** Read the native label + its language code from P1705 (native label) or P364 (original language). */
async function resolveNative(entity: WikidataEntity): Promise<{ text: string | null;
  language: string | null; }> {
  const nativeLabel = firstClaimValue(entity, "P1705") as WikidataSnakValue | null;
  if (nativeLabel !== null && typeof nativeLabel === "object") {
    const text = asString(nativeLabel.text);
    const language = asString(nativeLabel.language);
    if (text !== null) return {
      text,
      language,
    };
  }

  // Fall back to the item's original language (P364): resolve that language item's Wikimedia code
  // (P424) or ISO 639-1 (P218), then read the item's label in that language.
  const languageId = claimEntityIds(entity, "P364")[0];
  if (languageId === undefined) return {
    text: null,
    language: null,
  };
  const languageEntity = (await getEntities([languageId], {
    props: "claims",
    languages: "en",
  })).get(languageId);
  const code = languageEntity
    ? asString(firstClaimValue(languageEntity, "P424")) ?? asString(firstClaimValue(languageEntity, "P218"))
    : null;
  if (code === null) return {
    text: null,
    language: null,
  };
  return {
    text: asString(entity.labels?.[code]?.value),
    language: code,
  };
}

/**
 * Resolve the Wikidata QID for a title: a stored `wikidataId` wins, else the first external ID that
 * pins an item via `haswbstatement`, else a title search. Returns `null` when nothing matches.
 */
async function resolveWikidataQid(input: {
  name: string;
  wikidataId?: string | null;
  externalIds?: WikidataExternalId[];
}): Promise<string | null> {
  const stored = asString(input.wikidataId);
  if (stored !== null) return stored;

  for (const {
    property, value,
  } of input.externalIds ?? []) {
    if (!value) continue;
    const hit = await findEntityByStatement(property, value);
    if (hit !== null) return hit;
  }

  const trimmed = input.name.trim();
  if (trimmed !== "") return (await searchEntities(trimmed, 1))[0] ?? null;
  return null;
}

/**
 * Resolve a title to its Wikidata metadata. Tries a stored `wikidataId`, then each external ID via
 * `haswbstatement`, then a title search. Returns `null` when no item can be found.
 */
export async function resolveTitleWikidata(input: {
  name: string;
  wikidataId?: string | null;
  externalIds?: WikidataExternalId[];
}): Promise<TitleWikidataResolution | null> {
  const qid = await resolveWikidataQid(input);
  if (qid === null) return null;

  const entity = (await getEntities([qid], {
    props: "labels|claims|sitelinks/urls",
    languages: null,
  })).get(qid);
  if (entity === undefined) {
    return {
      wikidataId: qid,
      name: null,
      englishName: null,
      wikipediaLinkEn: null,
      wikipediaLinkLocal: null,
    };
  }

  const english = asString(entity.labels?.en?.value);
  const native = await resolveNative(entity);
  const name = native.text ?? english;
  const englishName = english !== null && english !== name ? english : null;

  const sitelinks = cleanSitelinks(entity.sitelinks ?? {});
  const wikipediaLinkEn = sitelinks.enwiki?.url ?? null;
  const localLanguage = native.language ?? (name ? detectWikipediaLanguage(name, null) : null);
  const wikipediaLinkLocal = localLanguage && localLanguage !== "en"
    ? (sitelinks[`${localLanguage}wiki`]?.url ?? null)
    : null;

  return {
    wikidataId: qid,
    name: name ?? null,
    englishName,
    wikipediaLinkEn,
    wikipediaLinkLocal,
  };
}
