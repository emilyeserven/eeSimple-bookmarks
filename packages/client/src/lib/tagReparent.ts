import type { TagReparentPlanInput, TagReparentResult } from "@eesimple/types";

/** One subtree tag offered to the reparent prompt — its id, indented display path, and depth. */
export interface ReparentTagLine {
  id: string;
  /** The tag's name, prefixed with its ancestor path for context (e.g. "Frontend / React"). */
  path: string;
}

/** Build the JSON output-format instruction appended to the generated reparent prompt. */
export function buildReparentFormatInstruction(): string {
  const lines = [
    "Respond with ONLY a JSON object — no prose and no code fences.",
    "Shape: { \"newTags\": [{ \"tempId\": \"new-1\", \"name\": \"Group name\", \"parentId\": \"<an existing id in brackets, or null for the top level>\" }], \"moves\": [{ \"id\": \"<the id shown in brackets>\", \"parentId\": \"<an existing id, a tempId from newTags, or null for the top level>\" }] }.",
    "Use each tag's id exactly as it appears in brackets.",
    "In \"newTags\", propose grouping tags to create; a newTag's parentId must be an existing id or null (a new tag cannot nest under another new tag).",
    "In \"moves\", list only the existing tags whose parent should change; omit tags that already sit correctly.",
  ];
  return `Output format:\n${lines.join(" ")}`;
}

/**
 * Assemble the ready-to-paste reparent prompt: the reusable template, the parent context (its id +
 * name in brackets), the current subtree (each line carries the tag id in brackets so the AI can echo
 * it back), an optional free-text note of subtags/goals the user wants, and the JSON output-format
 * instruction. Pass `notes = ""` to omit the goals block.
 */
export function buildReparentPrompt(
  template: string,
  parent: { id: string;
    name: string; },
  subtree: ReparentTagLine[],
  notes: string,
): string {
  const contextSection = `Reorganizing the tags under [${parent.id}] ${parent.name}.`;
  const subtreeLines = subtree.map(line => `- [${line.id}] ${line.path}`).join("\n");
  const subtreeSection = subtree.length > 0
    ? `Current subtags (each line is "- [id] path"):\n${subtreeLines}`
    : "Current subtags:\n(No subtags yet)";
  const trimmedNotes = notes.trim();
  const notesSection = trimmedNotes
    ? `Subtags I want / goals for the reorganization:\n${trimmedNotes}`
    : null;
  const sections = [template, contextSection, subtreeSection, notesSection, buildReparentFormatInstruction()]
    .filter(Boolean);
  return sections.join("\n\n");
}

/**
 * Parse the pasted AI response into a reparent plan. Accepts a JSON object with `newTags` and/or
 * `moves` arrays; returns null when the shape is not an object of `{ newTags?, moves? }` with valid
 * entries. Missing arrays are treated as empty; entries with the wrong field types are rejected.
 */
export function normalizeReparentPlan(parsed: unknown): TagReparentPlanInput | null {
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null;
  const obj = parsed as Record<string, unknown>;

  const newTagsRaw = obj.newTags === undefined ? [] : obj.newTags;
  const movesRaw = obj.moves === undefined ? [] : obj.moves;
  if (!Array.isArray(newTagsRaw) || !Array.isArray(movesRaw)) return null;

  const newTags: TagReparentPlanInput["newTags"] = [];
  for (const raw of newTagsRaw) {
    if (typeof raw !== "object" || raw === null) return null;
    const entry = raw as Record<string, unknown>;
    if (typeof entry.tempId !== "string" || typeof entry.name !== "string") return null;
    if (!(typeof entry.parentId === "string" || entry.parentId === null)) return null;
    newTags.push({
      tempId: entry.tempId,
      name: entry.name,
      parentId: entry.parentId,
    });
  }

  const moves: TagReparentPlanInput["moves"] = [];
  for (const raw of movesRaw) {
    if (typeof raw !== "object" || raw === null) return null;
    const entry = raw as Record<string, unknown>;
    if (typeof entry.id !== "string") return null;
    if (!(typeof entry.parentId === "string" || entry.parentId === null)) return null;
    moves.push({
      id: entry.id,
      parentId: entry.parentId,
    });
  }

  return {
    newTags,
    moves,
  };
}

/** The outcome of parsing the pasted apply text, driving the review UI. */
export type ReparentParseState
  = | { kind: "empty" }
    | { kind: "error" }
    | { kind: "invalid" }
    | { kind: "ok";
      plan: TagReparentPlanInput; };

/** Parse the pasted apply text into a review state: empty, unparseable JSON, wrong shape, or ok. */
export function parseReparentText(text: string): ReparentParseState {
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
  const plan = normalizeReparentPlan(parsed);
  if (!plan) return {
    kind: "invalid",
  };
  return {
    kind: "ok",
    plan,
  };
}

/** Human-readable summary of an apply result for the success toast. */
export function describeReparentResult(result: TagReparentResult): string {
  const parts = [`Moved ${result.moved} tag${result.moved === 1 ? "" : "s"}`];
  if (result.created > 0) {
    parts.push(`created ${result.created} tag${result.created === 1 ? "" : "s"}`);
  }
  if (result.notFound.length > 0) {
    parts.push(`${result.notFound.length} skipped`);
  }
  return parts.join(", ");
}
