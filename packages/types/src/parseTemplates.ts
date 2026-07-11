/**
 * Parse Templates — reusable, user-defined rules for turning a block of pasted text into
 * {@link SectionEntry} rows in the bookmark Sections editor.
 *
 * A template declares a **delineator** (the item separator, e.g. `" / "`) and a **pattern** built
 * from `{{tags}}` (e.g. `"{{person}} - {{name}}"`) whose literal text between tags acts as the
 * in-item separators. Each `{{tag}}` maps to a fixed destination (see {@link PARSE_TAGS}). Items
 * that don't match the full pattern are handled by {@link ParseTemplate.fallbackTag}.
 */

/**
 * The fixed vocabulary of `{{tags}}` a template pattern may use. Each maps to a fixed destination:
 * - `name` → the section's `name`
 * - `person` → match-or-created into the bookmark's People (not stored on the section)
 * - `page` / `timestamp` / `url` → the section's `startValue` + `type` (`url` also sets `url`)
 * - `ignore` → captured then discarded
 *
 * Single source of truth for the vocabulary — the Fastify enum and client validation derive from it.
 */
export const PARSE_TAGS = ["name", "person", "page", "timestamp", "url", "ignore"] as const;
export type ParseTag = typeof PARSE_TAGS[number];

/** A saved, reusable parse rule for the Sections editor's paste-to-parse feature. */
export interface ParseTemplate {
  id: string;
  name: string;
  description: string | null;
  /** The item separator, e.g. `" / "`. */
  delineator: string;
  /** The capture pattern, e.g. `"{{person}} - {{name}}"`. */
  pattern: string;
  /** Where an item that doesn't match the full pattern puts its whole text (default `"name"`). */
  fallbackTag: ParseTag;
  createdAt: string;
}

/** Payload for creating a parse template. */
export interface CreateParseTemplateInput {
  name: string;
  description?: string | null;
  delineator: string;
  pattern: string;
  fallbackTag?: ParseTag;
}

/** Payload for partially updating a parse template. */
export type UpdateParseTemplateInput = Partial<CreateParseTemplateInput>;
