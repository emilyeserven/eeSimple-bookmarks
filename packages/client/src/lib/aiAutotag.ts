import type { AiAutotagApplyItem } from "@eesimple/types";

/** Build the JSON output-format instruction appended to the generated autotag prompt. */
export function buildAutotagFormatInstruction(): string {
  const lines = [
    "Respond with ONLY a JSON array — no prose and no code fences.",
    "Each element must be an object: { \"id\": \"<the id shown in brackets>\", \"tags\": [\"tag1\", \"tag2\"] }.",
    "Use each bookmark's id exactly as it appears in brackets.",
    "For \"tags\", suggest a few short, relevant topic tags for each bookmark.",
  ];
  return `Output format:\n${lines.join(" ")}`;
}

/**
 * Assemble the ready-to-paste prompt: the reusable template, the untagged bookmarks (each line carries
 * the bookmark id in brackets so the AI can echo it back), an optional list of existing tags to reuse,
 * and the JSON output-format instruction. Pass `existingTagNames = null` to omit the existing-tags block.
 */
export function buildAutotagPrompt(
  template: string,
  items: { id: string;
    url: string | null;
    title: string; }[],
  existingTagNames: string[] | null,
): string {
  const linkLines = items
    .map(item => `- [${item.id}] ${item.title}${item.url ? `: ${item.url}` : ""}`)
    .join("\n");
  const linksSection = items.length > 0
    ? `Bookmarks to tag (each line is "- [id] title: url"):\n${linkLines}`
    : "Bookmarks to tag:\n(No untagged bookmarks found)";
  const existingSection = existingTagNames && existingTagNames.length > 0
    ? `Existing tags — reuse these where relevant instead of inventing new ones:\n${existingTagNames.join(", ")}`
    : null;
  const sections = [template, linksSection, existingSection, buildAutotagFormatInstruction()].filter(Boolean);
  return sections.join("\n\n");
}

/**
 * Parse the pasted AI response into apply items. Accepts either a bare JSON array or a `{ items: [] }`
 * wrapper; returns null when the shape is not an array of `{ id, tags }` objects. Non-string tags are
 * filtered out; an object missing `tags` is treated as an empty tag list.
 */
export function normalizeAutotagItems(parsed: unknown): AiAutotagApplyItem[] | null {
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown })?.items)
      ? (parsed as { items: unknown[] }).items
      : null;
  if (!arr) return null;

  const items: AiAutotagApplyItem[] = [];
  for (const raw of arr) {
    if (typeof raw !== "object" || raw === null) return null;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id !== "string") return null;
    const tags = Array.isArray(obj.tags)
      ? obj.tags.filter((tag): tag is string => typeof tag === "string")
      : [];
    items.push({
      id: obj.id,
      tags,
    });
  }
  return items;
}

/** The outcome of parsing the pasted apply text, driving the review UI. */
export type AutotagParseState
  = | { kind: "empty" }
    | { kind: "error" }
    | { kind: "invalid" }
    | { kind: "ok";
      items: AiAutotagApplyItem[]; };

/** Parse the pasted apply text into a review state: empty, unparseable JSON, wrong shape, or ok. */
export function parseAutotagText(text: string): AutotagParseState {
  const trimmed = text.trim();
  if (!trimmed) return {
    kind: "empty",
  };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  }
  catch {
    return {
      kind: "error",
    };
  }
  const items = normalizeAutotagItems(parsed);
  if (!items) return {
    kind: "invalid",
  };
  return {
    kind: "ok",
    items,
  };
}

/** Human-readable summary of an apply result for the success toast. */
export function describeAutotagResult(result: { updated: number;
  tagsCreated: number;
  notFound: string[]; }): string {
  const parts = [`Tagged ${result.updated} bookmark${result.updated === 1 ? "" : "s"}`];
  if (result.tagsCreated > 0) {
    parts.push(`created ${result.tagsCreated} tag${result.tagsCreated === 1 ? "" : "s"}`);
  }
  if (result.notFound.length > 0) {
    parts.push(`${result.notFound.length} id${result.notFound.length === 1 ? "" : "s"} not found`);
  }
  return parts.join(", ");
}
