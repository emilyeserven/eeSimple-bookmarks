import type { ParseTag, ParseTemplate, SectionEntry, SectionEntryType } from "@eesimple/types";

import { PARSE_TAGS } from "@eesimple/types";

/** A token of a parsed template pattern: a `{{tag}}` capture or a literal in-item separator. */
export type PatternToken
  = | { kind: "tag";
    tag: ParseTag; }
    | { kind: "literal";
      text: string; };

/** Options carrying the owning `sections` property's type constraints. */
export interface ParseTemplateOptions {
  /** Types the property permits (`property.sectionsAllowedTypes`). */
  allowedTypes: SectionEntryType[];
  /** The property's default entry type (`property.sectionsDefaultType`). */
  defaultType: SectionEntryType;
}

/** The outcome of parsing a pasted block against a template. */
export interface ParseTemplateResult {
  /** Section rows to append (blank-name rows are dropped). */
  sections: SectionEntry[];
  /** Distinct author names captured by `{{person}}`, to match-or-create into the bookmark's People. */
  personNames: string[];
  /** Non-empty items found in the pasted text. */
  itemCount: number;
  /** Items that didn't match the full pattern and fell back to the template's `fallbackTag`. */
  fallbackCount: number;
}

/** The positional tags, in precedence order, that decide a section's `type` + `startValue`. */
const POSITIONAL_TAGS = ["page", "timestamp", "url"] as const;

const TAG_REGEX = new RegExp(`\\{\\{\\s*(${PARSE_TAGS.join("|")})\\s*\\}\\}`, "g");

/**
 * Split a pattern like `"{{person}} - {{name}}"` into an alternating list of `{{tag}}` captures and
 * the literal text between them. Unknown `{{…}}` are left as literal text (surfacing typos rather
 * than silently vanishing).
 */
export function tokenizePattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = [];
  let lastIndex = 0;
  TAG_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_REGEX.exec(pattern)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        kind: "literal",
        text: pattern.slice(lastIndex, match.index),
      });
    }
    tokens.push({
      kind: "tag",
      tag: match[1] as ParseTag,
    });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < pattern.length) {
    tokens.push({
      kind: "literal",
      text: pattern.slice(lastIndex),
    });
  }
  return tokens;
}

/**
 * Parse one item against the tokens. Returns the per-tag captures, or `null` when a required literal
 * separator is missing (an exception the caller handles via the fallback tag). Literal separators
 * must appear in order; a leading literal must be at the very start.
 */
function parseItem(item: string, tokens: PatternToken[]): Partial<Record<ParseTag, string>> | null {
  const captures: Partial<Record<ParseTag, string>> = {};
  let cursor = 0;
  let pendingTag: ParseTag | null = null;
  for (const token of tokens) {
    if (token.kind === "tag") {
      // Two tags with no literal between them is not a meaningful pattern; the earlier one captures
      // nothing.
      if (pendingTag !== null) captures[pendingTag] = "";
      pendingTag = token.tag;
      continue;
    }
    if (token.text === "") continue;
    const idx = item.indexOf(token.text, cursor);
    if (idx === -1) return null;
    if (pendingTag !== null) {
      captures[pendingTag] = item.slice(cursor, idx).trim();
      pendingTag = null;
    }
    else if (idx !== cursor) {
      // A literal with no preceding tag (leading, or after another literal) must sit exactly here.
      return null;
    }
    cursor = idx + token.text.length;
  }
  if (pendingTag !== null) captures[pendingTag] = item.slice(cursor).trim();
  return captures;
}

/** Which entry type a pattern's positional tags imply, constrained to what the property allows. */
function resolveEntryType(
  tokens: PatternToken[],
  opts: ParseTemplateOptions,
): SectionEntryType {
  const present = new Set(
    tokens.filter((t): t is { kind: "tag";
      tag: ParseTag; } => t.kind === "tag").map(t => t.tag),
  );
  const typeTag = POSITIONAL_TAGS.find(tag => present.has(tag) && opts.allowedTypes.includes(tag));
  return typeTag ?? opts.defaultType;
}

/** Build a section row from an item's captures, or `null` when there is nothing to show. */
function buildSection(
  captures: Partial<Record<ParseTag, string>>,
  entryType: SectionEntryType,
): SectionEntry | null {
  const name = (captures.name ?? "").trim();
  const positional = POSITIONAL_TAGS.find(tag => tag === entryType);
  const startValue = positional ? (captures[positional] ?? "").trim() : "";
  const url = (captures.url ?? "").trim() || undefined;
  if (name === "" && startValue === "" && url === undefined) return null;
  return {
    id: crypto.randomUUID(),
    name,
    type: entryType,
    startValue,
    endValue: undefined,
    url,
  };
}

/**
 * Parse a pasted block into section rows + author names using a {@link ParseTemplate}.
 *
 * Splits on the template's `delineator`, matches each item against the `{{tag}}` pattern, and maps
 * captures to their fixed destinations (`name` → section name, `person` → the returned
 * `personNames`, `page`/`timestamp`/`url` → the section's `startValue`+`type`, `ignore` → discarded).
 * Items that don't match the full pattern put their whole text into the template's `fallbackTag`.
 */
export function parseWithTemplate(
  text: string,
  template: ParseTemplate,
  opts: ParseTemplateOptions,
): ParseTemplateResult {
  const items = template.delineator
    ? text.split(template.delineator).map(s => s.trim()).filter(s => s !== "")
    : text.split(/\r?\n/).map(s => s.trim()).filter(s => s !== "");
  const tokens = tokenizePattern(template.pattern);
  const entryType = resolveEntryType(tokens, opts);

  const sections: SectionEntry[] = [];
  const personNames: string[] = [];
  const seenPeople = new Set<string>();
  let fallbackCount = 0;

  for (const item of items) {
    let captures = parseItem(item, tokens);
    if (captures === null) {
      fallbackCount += 1;
      captures = {
        [template.fallbackTag]: item,
      };
    }
    const personName = (captures.person ?? "").trim();
    if (personName !== "" && !seenPeople.has(personName.toLowerCase())) {
      seenPeople.add(personName.toLowerCase());
      personNames.push(personName);
    }
    const section = buildSection(captures, entryType);
    if (section !== null) sections.push(section);
  }

  return {
    sections,
    personNames,
    itemCount: items.length,
    fallbackCount,
  };
}
