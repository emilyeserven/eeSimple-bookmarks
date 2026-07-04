/**
 * Low-level, keyless Wikidata Action-API client shared by the Locations geocoder
 * (`wikidataGeocoding.ts`) and the media-taxonomy title resolver (`wikidataTitle.ts`). Only the
 * request plumbing + claim/label/sitelink readers live here; the domain-specific assembly (geocode
 * candidates, movie/show native names) stays in the callers.
 *
 * Every call degrades gracefully — any transport/parse failure resolves to an empty/`null` result
 * rather than throwing — and the endpoint is overridable (`WIKIDATA_ENDPOINT`) so lookups can stay
 * on a self-hosted Wikibase mirror.
 */

const DEFAULT_ENDPOINT = "https://www.wikidata.org";
const WIKIDATA_TIMEOUT_MS = 10000;
const USER_AGENT = "eeSimple-bookmarks/1.0 (media + location taxonomy metadata)";

/** The Wikidata base URL in use (a self-hosted Wikibase when `WIKIDATA_ENDPOINT` is set). */
export function wikidataEndpoint(): string {
  return (process.env.WIKIDATA_ENDPOINT ?? DEFAULT_ENDPOINT).replace(/\/+$/, "");
}

// --- Wikidata Action API response shapes (only the fields we read) -------------------------------

interface SearchResult {
  id?: unknown;
  title?: unknown;
}

export interface WikidataSnakValue {
  id?: unknown;
  latitude?: unknown;
  longitude?: unknown;
  /** Monolingual-text snaks (e.g. P1705 native label) carry `{ text, language }`. */
  text?: unknown;
  language?: unknown;
}

export interface WikidataClaim {
  mainsnak?: {
    datavalue?: { value?: unknown };
  };
}

export interface WikidataEntity {
  labels?: Record<string, { value?: unknown } | undefined>;
  claims?: Record<string, WikidataClaim[] | undefined>;
  sitelinks?: Record<string, { title?: unknown;
    url?: unknown; } | undefined>;
}

// --- Small fetch + claim helpers -----------------------------------------------------------------

/** A trimmed non-empty string, else `null`. */
export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Fetch + parse JSON with a timeout and a descriptive User-Agent; `null` on any failure. */
export async function fetchJson(url: URL): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WIKIDATA_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
      },
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  }
  catch {
    return null;
  }
  finally {
    clearTimeout(timer);
  }
}

// Character-class ranges for the CJK / non-Latin scripts these two detectors key off. Defined once so
// the two functions below share the ones they have in common (kana). These are the legacy ranges used
// to pick the Wikidata query language — kept verbatim so behaviour is unchanged. For classifying an
// entity's own name, use the precise `\p{Script=…}` classifier in `utils/scriptDetection.ts` instead.
const KANA = "぀-ヿ"; // hiragana + katakana (U+3040–U+30FF)
const CJK_IDEOGRAPHS_EXTENDED = "㐀-鿿豈-﫿"; // CJK Unified (incl. Ext A) + Compatibility Ideographs
const HAN_BASIC = "一-鿿"; // CJK Unified Ideographs (U+4E00–U+9FFF)
const HANGUL = "가-힣"; // hangul syllables

/** Detect whether a query is in Japanese (CJK / kana) so we ask Wikidata in the right language. */
function detectLanguage(query: string): string {
  return new RegExp(`[${KANA}${CJK_IDEOGRAPHS_EXTENDED}]`).test(query) ? "ja" : "en";
}

/** The `value` of an entity's first claim for a property, or `null`. */
export function firstClaimValue(entity: WikidataEntity, property: string): unknown {
  return entity.claims?.[property]?.[0]?.mainsnak?.datavalue?.value ?? null;
}

/** The entity ids (`Q…`) referenced by an entity's claims for a property (e.g. P131, P150, P364). */
export function claimEntityIds(entity: WikidataEntity, property: string): string[] {
  const claims = entity.claims?.[property] ?? [];
  const ids: string[] = [];
  for (const claim of claims) {
    const value = claim.mainsnak?.datavalue?.value as WikidataSnakValue | undefined;
    const id = asString(value?.id);
    if (id !== null) ids.push(id);
  }
  return ids;
}

// --- API calls -----------------------------------------------------------------------------------

/** Search Wikidata for items matching a free-text query, returning up to `limit` entity ids. */
export async function searchEntities(query: string, limit: number): Promise<string[]> {
  const language = detectLanguage(query);
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", query);
  url.searchParams.set("language", language);
  url.searchParams.set("uselang", language);
  url.searchParams.set("type", "item");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const results = (body as { search?: unknown })?.search;
  if (!Array.isArray(results)) return [];
  return results
    .map(r => asString((r as SearchResult).id))
    .filter((id): id is string => id !== null);
}

/**
 * Find the single Wikidata item carrying an external-ID statement (e.g. `P345` IMDb ID = `tt0123`),
 * via the `haswbstatement:` search keyword. Returns the item's QID (its main-namespace page title),
 * or `null` when none matches.
 */
export async function findEntityByStatement(property: string, value: string): Promise<string | null> {
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", `haswbstatement:${property}=${value}`);
  url.searchParams.set("srlimit", "1");
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const search = (body as { query?: { search?: unknown } })?.query?.search;
  if (!Array.isArray(search)) return null;
  return asString((search[0] as SearchResult | undefined)?.title);
}

/**
 * Hydrate a batch of entity ids. `props` defaults to `labels|claims`; pass `languages: null` to fetch
 * labels in every language (the geocoder keeps the historical `ja|en` default when `languages` is
 * omitted).
 */
export async function getEntities(
  ids: string[],
  opts: { props?: string;
    languages?: string | null; } = {},
): Promise<Map<string, WikidataEntity>> {
  const map = new Map<string, WikidataEntity>();
  if (ids.length === 0) return map;
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", ids.join("|"));
  url.searchParams.set("props", opts.props ?? "labels|claims");
  const languages = opts.languages === undefined ? "ja|en" : opts.languages;
  if (languages) url.searchParams.set("languages", languages);
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const entities = (body as { entities?: Record<string, unknown> })?.entities;
  if (entities === undefined || entities === null) return map;
  for (const [id, entity] of Object.entries(entities)) {
    if (entity !== null && typeof entity === "object") map.set(id, entity as WikidataEntity);
  }
  return map;
}

/** Fetch a Wikidata item's sitelinks (`{ enwiki: { title, url }, jawiki: {…}, … }`), or `null`. */
export async function fetchSitelinks(qid: string): Promise<Record<string, { title: string;
  url: string; }> | null> {
  const url = new URL(`${wikidataEndpoint()}/w/api.php`);
  url.searchParams.set("action", "wbgetentities");
  url.searchParams.set("ids", qid);
  url.searchParams.set("props", "sitelinks/urls");
  url.searchParams.set("format", "json");
  const body = await fetchJson(url);
  const entities = (body as { entities?: Record<string, unknown> })?.entities;
  const entity = entities?.[qid] as { sitelinks?: Record<string, { title?: unknown;
    url?: unknown; }>; } | undefined;
  return entity?.sitelinks ? cleanSitelinks(entity.sitelinks) : null;
}

/** Keep only sitelink entries whose title + url are both non-empty strings. */
export function cleanSitelinks(
  raw: Record<string, { title?: unknown;
    url?: unknown; } | undefined>,
): Record<string, { title: string;
  url: string; }> {
  const sitelinks: Record<string, { title: string;
    url: string; }> = {};
  for (const [site, value] of Object.entries(raw)) {
    const title = asString(value?.title);
    const siteUrl = asString(value?.url);
    if (title !== null && siteUrl !== null) sitelinks[site] = {
      title,
      url: siteUrl,
    };
  }
  return sitelinks;
}

// --- Local-language detection --------------------------------------------------------------------

/**
 * Best-effort ISO 3166-1 alpha-2 country → primary Wikipedia language code, used as the "local"
 * language guess when a title carries no distinguishing non-Latin script (e.g. a French or German
 * place). Not exhaustive — an unmapped country with a Latin-script title simply gets no local link.
 */
export const COUNTRY_LANGUAGE_FALLBACK: Record<string, string> = {
  JP: "ja",
  KR: "ko",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  RU: "ru",
  UA: "uk",
  SA: "ar",
  EG: "ar",
  IL: "he",
  IN: "hi",
  TH: "th",
  GR: "el",
  FR: "fr",
  DE: "de",
  AT: "de",
  ES: "es",
  IT: "it",
  PT: "pt",
  BR: "pt",
  NL: "nl",
  BE: "nl",
  PL: "pl",
  SE: "sv",
  NO: "no",
  DK: "da",
  FI: "fi",
  CZ: "cs",
  SK: "sk",
  HU: "hu",
  RO: "ro",
  TR: "tr",
  VN: "vi",
  ID: "id",
  MY: "ms",
};

/**
 * Unicode-script → Wikipedia language code guess for an unambiguously non-Latin title. `countryCode`
 * disambiguates bare CJK ideographs (Han characters with no kana/hangul alongside them): a title
 * written only in hanja/kanji is otherwise indistinguishable from Chinese by script alone, so the
 * country breaks the tie when it maps to ja/ko/zh, falling back to Chinese when unknown.
 */
export function detectWikipediaLanguage(text: string, countryCode: string | null): string | null {
  if (new RegExp(`[${KANA}]`).test(text)) return "ja"; // hiragana / katakana
  if (new RegExp(`[${HANGUL}]`).test(text)) return "ko"; // hangul
  if (new RegExp(`[${HAN_BASIC}]`).test(text)) {
    const byCountry = countryCode ? COUNTRY_LANGUAGE_FALLBACK[countryCode.toUpperCase()] : undefined;
    return byCountry === "ja" || byCountry === "ko" || byCountry === "zh" ? byCountry : "zh";
  }
  if (/[Ѐ-ӿ]/.test(text)) return "ru"; // cyrillic
  if (/[؀-ۿ]/.test(text)) return "ar"; // arabic
  if (/[฀-๿]/.test(text)) return "th"; // thai
  if (/[ऀ-ॿ]/.test(text)) return "hi"; // devanagari
  if (/[Ͱ-Ͽ]/.test(text)) return "el"; // greek
  if (/[֐-׿]/.test(text)) return "he"; // hebrew
  return null;
}
