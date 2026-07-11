import type { AiSummaryApplyItem } from "@eesimple/types";

/** Build the JSON output-format instruction appended to the generated summarization prompt. */
export function buildFormatInstruction(suggestTags: boolean): string {
  const tagsField = suggestTags ? ", \"tags\": [\"tag1\", \"tag2\"]" : "";
  const lines = [
    "Respond with ONLY a JSON array — no prose and no code fences.",
    `Each element must be an object: { "id": "<the id shown in brackets>", "summary": "<your summary>"${tagsField} }.`,
    "Use each bookmark's id exactly as it appears in brackets.",
  ];
  if (suggestTags) {
    lines.push("For \"tags\", suggest a few short, relevant topic tags for each bookmark.");
  }
  return `Output format:\n${lines.join(" ")}`;
}

/**
 * Assemble the ready-to-paste prompt: the reusable template, the queued bookmarks (each line carries
 * the bookmark id in brackets so the AI can echo it back), and the JSON output-format instruction.
 */
export function buildGeneratedPrompt(
  template: string,
  items: { id: string;
    url: string | null;
    title: string; }[],
  suggestTags: boolean,
): string {
  const linkLines = items
    .map(item => `- [${item.id}] ${item.title}${item.url ? `: ${item.url}` : ""}`)
    .join("\n");
  const linksSection = items.length > 0
    ? `Bookmarks to summarize (each line is "- [id] title: url"):\n${linkLines}`
    : "Bookmarks to summarize:\n(No bookmarks currently in the AI Summary Queue)";
  const sections = [template, linksSection, buildFormatInstruction(suggestTags)].filter(Boolean);
  return sections.join("\n\n");
}

/**
 * Parse the pasted AI response into apply items. Accepts either a bare JSON array or a `{ items: [] }`
 * wrapper; returns null when the shape is not an array of `{ id, summary }` objects.
 */
export function normalizeApplyItems(parsed: unknown): AiSummaryApplyItem[] | null {
  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { items?: unknown })?.items)
      ? (parsed as { items: unknown[] }).items
      : null;
  if (!arr) return null;

  const items: AiSummaryApplyItem[] = [];
  for (const raw of arr) {
    if (typeof raw !== "object" || raw === null) return null;
    const obj = raw as Record<string, unknown>;
    if (typeof obj.id !== "string" || typeof obj.summary !== "string") return null;
    const tags = Array.isArray(obj.tags)
      ? obj.tags.filter((tag): tag is string => typeof tag === "string")
      : undefined;
    items.push(tags
      ? {
        id: obj.id,
        summary: obj.summary,
        tags,
      }
      : {
        id: obj.id,
        summary: obj.summary,
      });
  }
  return items;
}

/** Human-readable summary of an apply result for the success toast. */
export function describeApplyResult(result: { updated: number;
  tagsCreated: number;
  notFound: string[]; }): string {
  const parts = [`Updated ${result.updated} bookmark${result.updated === 1 ? "" : "s"}`];
  if (result.tagsCreated > 0) {
    parts.push(`created ${result.tagsCreated} tag${result.tagsCreated === 1 ? "" : "s"}`);
  }
  if (result.notFound.length > 0) {
    parts.push(`${result.notFound.length} id${result.notFound.length === 1 ? "" : "s"} not found`);
  }
  return parts.join(", ");
}
