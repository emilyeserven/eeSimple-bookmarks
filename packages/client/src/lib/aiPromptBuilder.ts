/**
 * Pure helpers behind the AI Prompt Builder action page: assemble a ready-to-paste prompt that asks
 * an external AI a free-form QUESTION about a set of bookmarks. The read-only sibling of
 * `aiBulkEdit.ts` — it shares the target resolution (`aiBookmarkTargets.ts`) and the per-bookmark
 * context block (`aiBookmarkContext.ts`), but emits no output-shape rules, no vocabulary, and no
 * JSON instruction, because nothing is ever parsed back. No hooks, no I/O — unit-tested directly.
 */

import type { AiUpdatableField, AiUpdatableFieldKey } from "./bookmarkAiUpdate";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { buildBookmarkContextBlock } from "./aiBookmarkContext";
import { listAiBulkUpdatableFields, resolveCheckedProperties } from "./bookmarkAiUpdate";

/**
 * Field keys the context block always emits, so offering them as checkboxes would be a confusing
 * no-op: the title is the block's header line and the description always rides along.
 */
const ALWAYS_INCLUDED_KEYS: ReadonlySet<AiUpdatableFieldKey> = new Set(["title", "description"]);

/**
 * The checkable context fields: the bulk-edit field list minus the always-included ones, with every
 * `disabledReason` cleared — a calculated or sections-driven property can't be *written* by an AI
 * but reads back perfectly well as context, which is all this page does.
 */
export function listAiContextFields(properties: CustomProperty[]): AiUpdatableField[] {
  return listAiBulkUpdatableFields(properties)
    .filter(field => !ALWAYS_INCLUDED_KEYS.has(field.key))
    .map(({
      disabledReason: _ignored, ...field
    }) => field);
}

/** The built-in preamble, used when the operator has not saved one of their own. */
export const DEFAULT_AI_PROMPT_BUILDER_TEMPLATE
  = "You are helping me reason about a collection of bookmarks I have saved. "
    + "Below is my question, followed by the bookmarks it is about.";

/** The closing instruction, keeping the AI anchored to the supplied bookmarks. */
const ANSWER_INSTRUCTION
  = "Answer the question using only the bookmarks listed above. Refer to a bookmark by its title "
    + "(the bracketed value before it is its internal id — you can ignore it unless I ask for ids). "
    + "If the bookmarks do not contain enough information to answer, say so rather than guessing.";

export interface AiPromptBuilderArgs {
  /** The stored preamble; empty falls back to {@link DEFAULT_AI_PROMPT_BUILDER_TEMPLATE}. */
  template: string;
  /** The user's free-form question. Blank omits the question section entirely. */
  question: string;
  /** The targeted bookmarks, in selection order. */
  bookmarks: Bookmark[];
  /** Which optional fields ride along in each bookmark's context block (URL/description always do). */
  contextFields: AiUpdatableFieldKey[];
  /** Every custom property (the checked ones are resolved by id from here). */
  properties: CustomProperty[];
  /** Category id → name, to render each bookmark's category in its context block. */
  categories: { id: string;
    name: string; }[];
}

/**
 * Assemble the ready-to-paste question prompt: template → the question → one context block per
 * bookmark → the answer instruction. Deliberately not translated — the text is AI-facing, not UI
 * (the AI-autotag precedent).
 */
export function buildAiPromptBuilderPrompt(args: AiPromptBuilderArgs): string {
  const template = args.template.trim() || DEFAULT_AI_PROMPT_BUILDER_TEMPLATE;
  const question = args.question.trim();
  const checkedProperties = resolveCheckedProperties(args.contextFields, args.properties);
  const checkedSet = new Set(args.contextFields);
  const categoryNameById = new Map(args.categories.map(category => [category.id, category.name]));
  const blocks = args.bookmarks.map(bookmark =>
    buildBookmarkContextBlock(bookmark, checkedSet, checkedProperties, categoryNameById));
  return [
    template,
    question ? `Question:\n${question}` : null,
    blocks.length > 0 ? ["Bookmarks:", ...blocks].join("\n\n") : null,
    ANSWER_INSTRUCTION,
  ].filter((block): block is string => block !== null).join("\n\n");
}
