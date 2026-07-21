/**
 * Pure helpers behind the Sections "AI import" dialog: build the prompt the user pipes into an AI
 * alongside photos of a book's table of contents, parse the JSON the AI returns, classify the
 * suggested tags against the existing tag list (reuse vs create), turn the user's review decisions
 * (reject / rename) into an ordered tag-creation plan, and wire the final `SectionEntry[]` (with
 * `tagIds`) that replaces the Sections editor value. No hooks, no I/O — everything here is
 * unit-tested directly; the dialog's controller hook is thin wiring over these.
 */

import type { SectionEntry, SectionEntryType, TagNode } from "@eesimple/types";

/** One section parsed from the AI's JSON (before it becomes a {@link SectionEntry}). */
export interface SectionsImportSection {
  name: string;
  startPage?: number;
  endPage?: number;
  tags: string[];
  /** Only ever present on top-level sections — the model is capped at depth 2. */
  children?: SectionsImportSection[];
}

/** A new tag the AI proposes, with an optional parent name (existing tag or another new tag). */
export interface SectionsImportNewTag {
  name: string;
  parent?: string;
}

export interface SectionsImportPayload {
  sections: SectionsImportSection[];
  newTags: SectionsImportNewTag[];
}

/** The outcome of parsing the pasted AI response, driving the review UI. */
export type SectionsImportParseState
  = | { kind: "empty" }
    | { kind: "error" }
    | { kind: "invalid" }
    | { kind: "ok";
      payload: SectionsImportPayload; };

/** One distinct suggested tag name, classified against the existing tag list for the review rows. */
export interface TagReviewItem {
  name: string;
  /** Set when the name case-insensitively matches an existing tag — "Reused" in the review. */
  existingTagId?: string;
  /** The AI's proposed parent name (from `newTags`), shown as the placement hint for a new tag. */
  proposedParentName?: string;
}

/** The user's review decisions over the {@link TagReviewItem} list, keyed by the original names. */
export interface TagReviewDecisions {
  rejected: Set<string>;
  renames: Record<string, string>;
}

/** One tag to create, in an order where a `new`-kind parent always precedes its child. */
export interface NewTagCreation {
  finalName: string;
  parent: { kind: "existing";
    id: string | null; } | { kind: "new";
      name: string; };
}

/** How a suggested tag name resolves after review, keyed by {@link normalizeTagKey} of the name. */
export type TagResolution
  = | { kind: "existing";
    id: string; }
    | { kind: "create";
      finalName: string; };

export interface NewTagPlan {
  creations: NewTagCreation[];
  /** Rejected names are simply absent — an unresolvable name never becomes a `tagIds` entry. */
  resolution: Record<string, TagResolution>;
}

/** The case-insensitive identity used to match/dedupe tag names throughout this module. */
export function normalizeTagKey(name: string): string {
  return name.trim().toLowerCase();
}

/** Render a tag subtree as the indented `- name` text list embedded in the prompt. */
export function renderTagSubtree(node: TagNode): string {
  function lines(n: TagNode, depth: number): string[] {
    return [`${"  ".repeat(depth)}- ${n.name}`, ...n.children.flatMap(child => lines(child, depth + 1))];
  }
  return lines(node, 0).join("\n");
}

const OUTPUT_EXAMPLE = `{
  "sections": [
    {
      "name": "Chapter 1: Getting Started",
      "startPage": 1,
      "endPage": 18,
      "tags": ["python"],
      "children": [
        { "name": "1.1 Installing Python", "startPage": 3, "tags": ["installation"] }
      ]
    },
    { "name": "Appendix", "tags": [] }
  ],
  "newTags": [
    { "name": "installation", "parent": "python" }
  ]
}`;

/**
 * Assemble the ready-to-paste prompt. `subtreeText` (from {@link renderTagSubtree}) and
 * `parentTagName` are set together when the user picked a parent tag — the prompt then embeds the
 * subtree as the reuse list and names the parent as the fallback home for new tags. The prompt text
 * is AI-facing, not UI, so it is deliberately not translated (the AI-autotag precedent).
 */
export function buildSectionsImportPrompt({
  bookmarkTitle, parentTagName, subtreeText,
}: {
  bookmarkTitle: string | null;
  parentTagName: string | null;
  subtreeText: string | null;
}): string {
  const task = bookmarkTitle
    ? `Photos of the table of contents of "${bookmarkTitle}" follow. Transcribe the table of contents into JSON.`
    : "Photos of a book's table of contents follow. Transcribe the table of contents into JSON.";
  const structure = [
    "Structure rules:",
    "- Each top-level entry of the table of contents becomes an object in \"sections\", in reading order.",
    "- Nested entries (sub-chapters) go in their parent's \"children\" array. Use at most one level of nesting; fold anything deeper into its nearest sub-chapter.",
    "- Copy entry names verbatim, including any numbering (e.g. \"1.2 Types\").",
    "- Include \"startPage\" whenever a page number is printed for the entry. Include \"endPage\" only when an explicit page range is printed — end pages are derived automatically otherwise.",
  ].join("\n");
  const tagging = parentTagName && subtreeText
    ? [
      "Tagging rules:",
      "- Suggest up to 3 short topical \"tags\" per section describing what it covers. Leaving \"tags\" empty is fine.",
      "- Reuse tag names from this existing list, exactly as written, whenever one fits:",
      subtreeText,
      `- Only when no existing tag fits, invent one: add it to "newTags" with a "parent" chosen from the list above (or "${parentTagName}" as the fallback), list parent tags before their children, and reference it from the sections' "tags". Prefer reusing existing tags over inventing new ones.`,
    ].join("\n")
    : [
      "Tagging rules:",
      "- Optionally suggest up to 3 short topical \"tags\" per section describing what it covers. Leaving \"tags\" empty is fine.",
      "- List every tag name you use once in \"newTags\"; a tag may name another \"newTags\" entry as its \"parent\" (parents listed before children).",
    ].join("\n");
  const output = `Respond with ONLY a JSON object — no prose and no code fences. Use exactly this shape:\n${OUTPUT_EXAMPLE}`;
  return [task, structure, tagging, output].join("\n\n");
}

/** Coerce a page value (number or numeric string) to a positive integer, else undefined. */
function toPage(value: unknown): number | undefined {
  const num = typeof value === "number"
    ? value
    : typeof value === "string" && value.trim() !== ""
      ? Number(value)
      : Number.NaN;
  if (!Number.isFinite(num)) return undefined;
  const page = Math.trunc(num);
  return page > 0 ? page : undefined;
}

/** Keep only non-empty string tag names, trimmed, deduped case-insensitively within the entry. */
function normalizeTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name || seen.has(normalizeTagKey(name))) continue;
    seen.add(normalizeTagKey(name));
    tags.push(name);
  }
  return tags;
}

/** Normalize one raw section object; children beyond depth 2 are silently dropped. */
function normalizeSection(raw: unknown, allowChildren: boolean): SectionsImportSection | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.name !== "string" || obj.name.trim() === "") return null;
  const section: SectionsImportSection = {
    name: obj.name.trim(),
    tags: normalizeTags(obj.tags),
  };
  const startPage = toPage(obj.startPage);
  if (startPage !== undefined) section.startPage = startPage;
  const endPage = toPage(obj.endPage);
  if (endPage !== undefined) section.endPage = endPage;
  if (allowChildren && Array.isArray(obj.children) && obj.children.length > 0) {
    const children: SectionsImportSection[] = [];
    for (const child of obj.children) {
      const normalized = normalizeSection(child, false);
      if (!normalized) return null;
      children.push(normalized);
    }
    section.children = children;
  }
  return section;
}

/** Normalize the parsed JSON into a payload; null = wrong shape ("invalid" parse state). */
export function normalizeSectionsImportPayload(parsed: unknown): SectionsImportPayload | null {
  const root = Array.isArray(parsed)
    ? {
      sections: parsed,
    }
    : typeof parsed === "object" && parsed !== null
      ? parsed as Record<string, unknown>
      : null;
  if (!root || !Array.isArray(root.sections)) return null;
  const sections: SectionsImportSection[] = [];
  for (const raw of root.sections) {
    const section = normalizeSection(raw, true);
    if (!section) return null;
    sections.push(section);
  }
  const newTags: SectionsImportNewTag[] = [];
  if (Array.isArray(root.newTags)) {
    for (const raw of root.newTags) {
      if (typeof raw !== "object" || raw === null) continue;
      const obj = raw as Record<string, unknown>;
      if (typeof obj.name !== "string" || obj.name.trim() === "") continue;
      newTags.push({
        name: obj.name.trim(),
        ...(typeof obj.parent === "string" && obj.parent.trim() !== "" && {
          parent: obj.parent.trim(),
        }),
      });
    }
  }
  return {
    sections,
    newTags,
  };
}

/** Strip a wrapping markdown code fence (```json … ```), a common AI-response drift. */
function stripCodeFence(text: string): string {
  const fenced = /^```[a-z]*\s*\n([\s\S]*?)\n?```$/i.exec(text);
  return fenced ? fenced[1] : text;
}

/** Parse the pasted AI response into a review state: empty, unparseable JSON, wrong shape, or ok. */
export function parseSectionsImportText(text: string): SectionsImportParseState {
  const trimmed = text.trim();
  if (!trimmed) return {
    kind: "empty",
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(stripCodeFence(trimmed));
  }
  catch {
    return {
      kind: "error",
    };
  }
  const payload = normalizeSectionsImportPayload(parsed);
  if (!payload) return {
    kind: "invalid",
  };
  return {
    kind: "ok",
    payload,
  };
}

/**
 * Collect the distinct suggested tag names (sections first, then `newTags`-only names, in first-seen
 * order) and classify each against the FULL existing tag list — not just the embedded subtree — so a
 * name the AI thought was new still reuses an existing tag instead of creating a sibling duplicate.
 */
export function classifySuggestedTags(
  payload: SectionsImportPayload,
  allTags: { id: string;
    name: string; }[],
): TagReviewItem[] {
  const existingByKey = new Map(allTags.map(tag => [normalizeTagKey(tag.name), tag.id]));
  const parentByKey = new Map(payload.newTags
    .filter(tag => tag.parent !== undefined)
    .map(tag => [normalizeTagKey(tag.name), tag.parent as string]));
  const seen = new Set<string>();
  const items: TagReviewItem[] = [];
  function add(name: string): void {
    const key = normalizeTagKey(name);
    if (seen.has(key)) return;
    seen.add(key);
    const existingTagId = existingByKey.get(key);
    const proposedParentName = parentByKey.get(key);
    items.push({
      name,
      ...(existingTagId !== undefined && {
        existingTagId,
      }),
      ...(existingTagId === undefined && proposedParentName !== undefined && {
        proposedParentName,
      }),
    });
  }
  for (const section of payload.sections) {
    section.tags.forEach(add);
    section.children?.forEach(child => child.tags.forEach(add));
  }
  payload.newTags.forEach(tag => add(tag.name));
  return items;
}

/**
 * Turn the review decisions into a creation plan plus a per-name resolution map. A rename that
 * collides (case-insensitively) with an existing tag collapses to reusing it; two names renamed to
 * the same thing collapse into one creation. Creations are ordered so a `new`-kind parent always
 * precedes its child (an unresolvable/cyclic parent falls back to `fallbackParentId`).
 */
export function resolveNewTagPlan(
  review: TagReviewItem[],
  decisions: TagReviewDecisions,
  allTags: { id: string;
    name: string; }[],
  fallbackParentId: string | null,
): NewTagPlan {
  const existingByKey = new Map(allTags.map(tag => [normalizeTagKey(tag.name), tag.id]));
  const resolution: Record<string, TagResolution> = {};
  const creationByKey = new Map<string, NewTagCreation>();
  const candidates = review.filter(item => !decisions.rejected.has(item.name));

  for (const item of candidates) {
    if (item.existingTagId !== undefined) {
      resolution[normalizeTagKey(item.name)] = {
        kind: "existing",
        id: item.existingTagId,
      };
    }
  }
  // First pass: decide each new name's final identity (rename → collapse-to-existing or create).
  for (const item of candidates) {
    if (item.existingTagId !== undefined) continue;
    const finalName = decisions.renames[item.name]?.trim() || item.name;
    const finalKey = normalizeTagKey(finalName);
    const existingId = existingByKey.get(finalKey);
    if (existingId !== undefined) {
      resolution[normalizeTagKey(item.name)] = {
        kind: "existing",
        id: existingId,
      };
      continue;
    }
    const creation = creationByKey.get(finalKey) ?? {
      finalName,
      parent: {
        kind: "existing",
        id: fallbackParentId,
      },
    };
    creationByKey.set(finalKey, creation);
    resolution[normalizeTagKey(item.name)] = {
      kind: "create",
      finalName: creation.finalName,
    };
  }
  // Second pass: resolve each creation's parent now that every planned name is known.
  resolveCreationParents(candidates, resolution, creationByKey, existingByKey);
  return {
    creations: orderCreationsParentsFirst(creationByKey, fallbackParentId),
    resolution,
  };
}

/**
 * Resolve each planned creation's parent, mutating the {@link NewTagCreation} entries in place. A
 * parent name resolves through the same rename/reject decisions (its `resolution` entry) first, then
 * falls back to an existing tag.
 */
function resolveCreationParents(
  candidates: TagReviewItem[],
  resolution: Record<string, TagResolution>,
  creationByKey: Map<string, NewTagCreation>,
  existingByKey: Map<string, string>,
): void {
  for (const item of candidates) {
    if (item.existingTagId !== undefined || item.proposedParentName === undefined) continue;
    const resolved = resolution[normalizeTagKey(item.name)];
    if (resolved?.kind !== "create") continue;
    const creation = creationByKey.get(normalizeTagKey(resolved.finalName));
    if (!creation) continue;
    const parentResolved = resolution[normalizeTagKey(item.proposedParentName)];
    if (parentResolved?.kind === "existing") {
      creation.parent = {
        kind: "existing",
        id: parentResolved.id,
      };
    }
    else if (parentResolved?.kind === "create" && normalizeTagKey(parentResolved.finalName) !== normalizeTagKey(creation.finalName)) {
      creation.parent = {
        kind: "new",
        name: parentResolved.finalName,
      };
    }
    else {
      const existingParentId = existingByKey.get(normalizeTagKey(item.proposedParentName));
      if (existingParentId !== undefined) {
        creation.parent = {
          kind: "existing",
          id: existingParentId,
        };
      }
    }
  }
}

/**
 * Order creations parents-first (a parent must be emitted before its children). A cycle re-parents
 * its first member to `fallbackParentId` and breaks.
 */
function orderCreationsParentsFirst(
  creationByKey: Map<string, NewTagCreation>,
  fallbackParentId: string | null,
): NewTagCreation[] {
  const ordered: NewTagCreation[] = [];
  const emitted = new Set<string>();
  let remaining = [...creationByKey.values()];
  while (remaining.length > 0) {
    const ready = remaining.filter(c => c.parent.kind !== "new" || emitted.has(normalizeTagKey(c.parent.name)));
    if (ready.length === 0) {
      remaining[0] = {
        ...remaining[0],
        parent: {
          kind: "existing",
          id: fallbackParentId,
        },
      };
      continue;
    }
    for (const creation of ready) {
      ordered.push(creation);
      emitted.add(normalizeTagKey(creation.finalName));
    }
    remaining = remaining.filter(c => !ready.includes(c));
  }
  return ordered;
}

/** Derive a page-typed entry's end page: explicit wins, else next sibling's start − 1 (clamped). */
function deriveEndPage(section: SectionsImportSection, siblings: SectionsImportSection[], index: number): number | undefined {
  if (section.startPage === undefined) return undefined;
  if (section.endPage !== undefined) return Math.max(section.startPage, section.endPage);
  const next = siblings.slice(index + 1).find(s => s.startPage !== undefined);
  if (next?.startPage === undefined) return undefined;
  return Math.max(section.startPage, next.startPage - 1);
}

/**
 * Build the final {@link SectionEntry} list that replaces the editor value. `resolveTagId` maps a
 * suggested tag name to a real tag id (rejected/unmatched names return undefined and are simply
 * dropped). When the property doesn't allow `page` entries, sections fall back to `name`-only rows.
 * `makeId` is injected for deterministic tests; production passes `randomId`.
 */
export function wireSectionsToEntries(
  sections: SectionsImportSection[],
  resolveTagId: (name: string) => string | undefined,
  allowedTypes: SectionEntryType[],
  makeId: () => string,
): SectionEntry[] {
  const pageAllowed = allowedTypes.includes("page");
  function toEntry(section: SectionsImportSection, siblings: SectionsImportSection[], index: number): SectionEntry {
    const paged = pageAllowed && section.startPage !== undefined;
    const endPage = paged ? deriveEndPage(section, siblings, index) : undefined;
    const tagIds = [...new Set(section.tags
      .map(resolveTagId)
      .filter((id): id is string => id !== undefined))];
    return {
      id: makeId(),
      name: section.name,
      type: paged ? "page" : "name",
      startValue: paged ? String(section.startPage) : "",
      ...(endPage !== undefined && {
        endValue: String(endPage),
      }),
      ...(tagIds.length > 0 && {
        tagIds,
      }),
      ...(section.children && section.children.length > 0 && {
        children: section.children.map((child, childIndex) =>
          toEntry(child, section.children as SectionsImportSection[], childIndex)),
      }),
    };
  }
  return sections.map((section, index) => toEntry(section, sections, index));
}
