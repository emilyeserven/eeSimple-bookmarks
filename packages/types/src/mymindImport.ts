/**
 * mymind import — the pure parsing/shaping half of "Import bookmarks from mymind" plus the wire
 * types of `POST /api/imports/mymind`.
 *
 * mymind's "Export" produces a folder holding the saved images/files plus a `cards.csv` with one row
 * per card: `id,type,title,url,content,note,tags,created`. Only the CSV is consumed — card images are
 * deliberately not imported. The client parses the CSV with {@link parseMymindCsv}, shapes it into
 * bookmark-sized {@link MymindImportCard}s with {@link buildMymindImportCards} (so the user sees an
 * accurate preview), then posts the cards in batches; the middleware resolves tags/media types and
 * creates the bookmarks.
 */

/** Per-card outcomes reported by `POST /api/imports/mymind`. */
export const MYMIND_IMPORT_OUTCOMES = ["created", "duplicate", "failed"] as const;
export type MymindImportOutcome = typeof MYMIND_IMPORT_OUTCOMES[number];

/** The columns mymind's `cards.csv` must carry for the file to be recognized. */
export const MYMIND_CSV_REQUIRED_COLUMNS = ["id", "type", "title", "url", "tags"] as const;

/** Max cards per import request; the client batches larger exports. */
export const MYMIND_IMPORT_MAX_BATCH = 50;

/** One raw `cards.csv` row (missing optional columns read as `""`). */
export interface MymindCsvRow {
  id: string;
  type: string;
  title: string;
  url: string;
  content: string;
  note: string;
  tags: string;
  created: string;
}

/** One bookmark-to-be: a mymind card, or several cards that share a URL merged together. */
export interface MymindImportCard {
  /** The mymind card ids folded into this bookmark (more than one when cards shared a URL). */
  mymindIds: string[];
  /** mymind's card type (`WebPage`, `Article`, `Image`, `Recipe`, …) — used to match a media type. */
  type: string;
  title: string;
  url: string | null;
  description: string | null;
  /** Raw tag names, de-duplicated case-insensitively; `prefix: value` tags are kept verbatim. */
  tags: string[];
  /** The earliest `created` timestamp (ISO 8601) of the merged cards, or `null` when absent. */
  createdAt: string | null;
}

export interface MymindImportOptions {
  /** Turn `prefix: value` tags (e.g. `des: Studio X`) into a nested `prefix › value` tag. */
  nestPrefixedTags: boolean;
  /** Run the autofill rules against each card, like a quick-added bookmark. */
  applyAutofill: boolean;
  /** Back-date each bookmark's "created" time to when it was saved in mymind. */
  keepCreatedDate: boolean;
  /** Assign an existing (non-hidden) media type whose name matches the mymind card type. */
  matchMediaTypes: boolean;
  /** Category for every imported bookmark; `null` = autofill's pick, else the Default category. */
  categoryId: string | null;
}

export interface MymindImportInput {
  cards: MymindImportCard[];
  options: MymindImportOptions;
}

export interface MymindImportCardResult {
  title: string;
  url: string | null;
  outcome: MymindImportOutcome;
  /** The created bookmark, or the existing one a duplicate URL matched. */
  bookmarkId: string | null;
  /** Failure reason when `outcome === "failed"`. */
  error: string | null;
}

export interface MymindImportResult {
  results: MymindImportCardResult[];
  /** How many tags this batch created (prefix parents included). */
  createdTagCount: number;
}

/**
 * Minimal RFC 4180 CSV parser: comma-separated, `"`-quoted fields with `""` escapes, quoted fields
 * may span lines, CRLF or LF row endings, and a leading UTF-8 BOM is ignored. Blank lines are
 * dropped.
 */
export function parseCsv(text: string): string[][] {
  const src = text.startsWith("﻿") ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const endRow = () => {
    row.push(field);
    field = "";
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch !== "\"") {
        field += ch;
      }
      else if (src[i + 1] === "\"") {
        field += "\"";
        i++;
      }
      else {
        inQuotes = false;
      }
      continue;
    }
    if (ch === "\"") inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    }
    else if (ch === "\n") endRow();
    else if (ch !== "\r") field += ch;
  }
  if (field !== "" || row.length > 0) endRow();
  return rows;
}

/**
 * Parse a mymind `cards.csv` export into rows. Returns `null` when the header doesn't carry the
 * {@link MYMIND_CSV_REQUIRED_COLUMNS} (i.e. it isn't a mymind export).
 */
export function parseMymindCsv(text: string): MymindCsvRow[] | null {
  const [header, ...body] = parseCsv(text);
  if (!header) return null;
  const columns = header.map(name => name.trim().toLowerCase());
  if (!MYMIND_CSV_REQUIRED_COLUMNS.every(name => columns.includes(name))) return null;
  const col = (cells: string[], name: keyof MymindCsvRow) => {
    const index = columns.indexOf(name);
    return index === -1 ? "" : (cells[index] ?? "");
  };
  return body.map(cells => ({
    id: col(cells, "id"),
    type: col(cells, "type"),
    title: col(cells, "title"),
    url: col(cells, "url"),
    content: col(cells, "content"),
    note: col(cells, "note"),
    tags: col(cells, "tags"),
    created: col(cells, "created"),
  }));
}

/** Split mymind's comma-joined tag cell into trimmed, non-empty names, de-duplicated case-insensitively. */
export function splitMymindTags(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,\n]/)) {
    const name = part.trim().replace(/\s+/g, " ");
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/**
 * A `prefix: value` namespaced tag (e.g. `des: Socially Savvy Studio`, `font: Nunito`) split into its
 * parts, or `null` for a plain tag. The prefix must be one short word followed by `": "`, so URLs
 * (`https://…`) and ordinary phrases containing a colon mid-sentence aren't split.
 */
export function splitPrefixedTag(tag: string): { parent: string;
  child: string; } | null {
  const [, parent, child] = /^([^\s:]{1,24}):\s+(\S.*)$/u.exec(tag.trim()) ?? [];
  if (!parent || !child) return null;
  return {
    parent,
    child: child.trim(),
  };
}

const TITLE_MAX = 120;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** The URL's host + path, used as a title of last resort. */
function urlLabel(url: string): string | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname === "/" ? "" : parsed.pathname;
    return `${parsed.hostname.replace(/^www\./, "")}${path}`;
  }
  catch {
    return null;
  }
}

/**
 * A display title for one card: its own title, else the first line of its content (notes and
 * highlights are untitled), else the URL's host/path, else `Untitled <type>`.
 */
export function mymindCardTitle(row: MymindCsvRow): string {
  const title = row.title.trim();
  if (title) return truncate(title, TITLE_MAX);
  const firstLine = row.content.split("\n").map(line => line.trim()).find(Boolean);
  if (firstLine) return truncate(firstLine.replace(/^["“]|["”]$/g, ""), TITLE_MAX);
  const fromUrl = row.url.trim() ? urlLabel(row.url.trim()) : null;
  if (fromUrl) return truncate(fromUrl, TITLE_MAX);
  return `Untitled ${row.type.trim() || "card"}`;
}

/** Card types that describe the saved page itself — preferred as a merged group's title source. */
const PAGE_TYPES = new Set(["webpage", "article", "recipe", "book", "product", "repository", "podcast", "youtubevideo", "video", "post", "redditpost"]);

function earliest(dates: string[]): string | null {
  const valid = dates
    .map(date => date.trim())
    .filter(date => date && !Number.isNaN(Date.parse(date)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return valid[0] ?? null;
}

/** Merge one URL's cards (or a single URL-less card) into one bookmark-to-be. */
function mergeGroup(first: MymindCsvRow, rest: MymindCsvRow[]): MymindImportCard {
  const group = [first, ...rest];
  const lead = group.find(row => PAGE_TYPES.has(row.type.trim().toLowerCase()) && row.title.trim())
    ?? group.find(row => row.title.trim())
    ?? first;
  const title = mymindCardTitle(lead);

  const blocks: string[] = [];
  const addBlock = (text: string) => {
    const trimmed = text.trim();
    if (trimmed && !blocks.includes(trimmed)) blocks.push(trimmed);
  };
  for (const row of [lead, ...group.filter(row => row !== lead)]) {
    addBlock(row.content);
    addBlock(row.note);
  }
  // Other cards saved from the same page (typically image clippings) keep their titles as a list.
  const otherTitles = [...new Set(group
    .filter(row => row !== lead)
    .map(row => row.title.trim())
    .filter(other => other && other !== title))];
  if (otherTitles.length > 0) {
    blocks.push(["Also saved from this page:", ...otherTitles.map(other => `- ${other}`)].join("\n"));
  }

  return {
    mymindIds: group.map(row => row.id),
    type: lead.type.trim(),
    title,
    url: lead.url.trim() || null,
    description: blocks.length > 0 ? blocks.join("\n\n") : null,
    tags: splitMymindTags(group.map(row => row.tags).join(",")),
    createdAt: earliest(group.map(row => row.created)),
  };
}

export interface MymindImportPlan {
  cards: MymindImportCard[];
  /** URL-less cards left out because `includeUrlless` was off. */
  skippedUrlless: number;
  /** Cards folded into another card that shares their URL (bookmark URLs are unique). */
  mergedCount: number;
}

/**
 * Shape parsed rows into bookmark-sized cards. Cards sharing a URL are merged into one (bookmark
 * URLs are unique): tags are unioned, notes/content concatenated, and the extra cards' titles
 * listed in the description. URL-less cards (images, notes, highlights) become link-less bookmarks
 * when `includeUrlless`, otherwise they're counted in `skippedUrlless`. Output keeps CSV order.
 */
export function buildMymindImportCards(
  rows: MymindCsvRow[],
  options: { includeUrlless: boolean },
): MymindImportPlan {
  const groups: [MymindCsvRow, ...MymindCsvRow[]][] = [];
  const byUrl = new Map<string, MymindCsvRow[]>();
  let skippedUrlless = 0;
  for (const row of rows) {
    const url = row.url.trim();
    if (!url) {
      if (options.includeUrlless) groups.push([row]);
      else skippedUrlless++;
      continue;
    }
    const existing = byUrl.get(url);
    if (existing) {
      existing.push(row);
      continue;
    }
    const group: [MymindCsvRow, ...MymindCsvRow[]] = [row];
    byUrl.set(url, group);
    groups.push(group);
  }
  const cards = groups.map(([first, ...rest]) => mergeGroup(first, rest));
  const kept = cards.reduce((sum, card) => sum + card.mymindIds.length, 0);
  return {
    cards,
    skippedUrlless,
    mergedCount: kept - cards.length,
  };
}

/** Aliases from mymind card types to likely media-type names (checked after the type's own name). */
const MEDIA_TYPE_ALIASES: Record<string, string[]> = {
  youtubevideo: ["Video"],
  post: ["Social Media Post"],
  redditpost: ["Post", "Social Media Post"],
  webpage: ["Web Page", "Website", "Website/App"],
  repository: ["Code"],
};

/**
 * Candidate media-type names for a mymind card type, most specific first: the type itself, its
 * spaced form (`WebPage` → `Web Page`), then known aliases (`YouTubeVideo` → `Video`). Matched
 * case-insensitively by the server against existing media types — never used to create one.
 */
export function mymindTypeMediaTypeCandidates(type: string): string[] {
  const trimmed = type.trim();
  if (!trimmed) return [];
  const spaced = trimmed.replace(/([a-z])([A-Z])/g, "$1 $2");
  return [...new Set([trimmed, spaced, ...(MEDIA_TYPE_ALIASES[trimmed.toLowerCase()] ?? [])])];
}

export interface MymindTagStats {
  /** Distinct tag names across all cards (case-insensitive). */
  tagCount: number;
  /** `prefix: value` namespaces with how many distinct values each holds, largest first. */
  prefixGroups: { prefix: string;
    valueCount: number; }[];
}

/** Tag statistics for the import preview (how many tags, which `prefix:` groups would nest). */
export function mymindTagStats(cards: MymindImportCard[]): MymindTagStats {
  const names = new Set<string>();
  const prefixValues = new Map<string, { prefix: string;
    values: Set<string>; }>();
  for (const name of cards.flatMap(card => card.tags)) {
    names.add(name.toLowerCase());
    const split = splitPrefixedTag(name);
    if (!split) continue;
    const key = split.parent.toLowerCase();
    const group = prefixValues.get(key) ?? {
      prefix: split.parent,
      values: new Set<string>(),
    };
    group.values.add(split.child.toLowerCase());
    prefixValues.set(key, group);
  }
  return {
    tagCount: names.size,
    prefixGroups: [...prefixValues.values()]
      .map(group => ({
        prefix: group.prefix,
        valueCount: group.values.size,
      }))
      .sort((a, b) => b.valueCount - a.valueCount || a.prefix.localeCompare(b.prefix)),
  };
}
