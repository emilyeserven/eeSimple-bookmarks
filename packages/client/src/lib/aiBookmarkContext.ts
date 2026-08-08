/**
 * The per-bookmark context block embedded in every multi-bookmark AI prompt (AI Bulk Edit's
 * field-update prompt, AI Prompt Builder's question prompt). One shared renderer so the two pages
 * describe a bookmark to the AI identically. Pure — unit-tested through its callers' prompt tests.
 */

import type { AiUpdatableFieldKey } from "./bookmarkAiUpdate";
import type { Bookmark, CustomProperty } from "@eesimple/types";

import { propertyCurrentDisplay } from "./bookmarkAiUpdate";

/** `- label: value` context line, omitted (null) when the value is empty. */
function contextLine(label: string, value: string | null | undefined): string | null {
  return value != null && value !== "" ? `- ${label}: ${value}` : null;
}

/**
 * One compact context block for one bookmark, headed by its bracketed id. URL and description always
 * ride along (cheap, high-signal); other standard fields appear only when checked; checked custom
 * properties show their current value.
 */
export function buildBookmarkContextBlock(
  bookmark: Bookmark,
  checked: ReadonlySet<AiUpdatableFieldKey>,
  checkedProperties: CustomProperty[],
  categoryNameById: Map<string, string>,
): string {
  const names = bookmark.names
    .map(name => `[${name.language.name}] ${name.value}`)
    .join("; ");
  const lines = [
    contextLine("URL", bookmark.url),
    contextLine("Description", bookmark.description),
    checked.has("category") ? contextLine("Category", categoryNameById.get(bookmark.categoryId)) : null,
    checked.has("mediaType") ? contextLine("Media type", bookmark.mediaType?.name) : null,
    checked.has("tags") ? contextLine("Tags", bookmark.tags.map(tag => tag.name).join(", ")) : null,
    checked.has("people") ? contextLine("People", bookmark.people.map(person => person.name).join(", ")) : null,
    checked.has("groups") ? contextLine("Groups", bookmark.groups.map(group => group.name).join(", ")) : null,
    checked.has("names") ? contextLine("Names", names) : null,
    checked.has("year") ? contextLine("Year", bookmark.year != null ? String(bookmark.year) : null) : null,
    checked.has("isbn") ? contextLine("ISBN", bookmark.isbn) : null,
    checked.has("priority") ? contextLine("Priority", String(bookmark.priority)) : null,
    ...checkedProperties.map(property =>
      contextLine(property.name, propertyCurrentDisplay(property, bookmark))),
  ].filter((line): line is string => line !== null);
  return [`[${bookmark.id}] ${bookmark.title}`, ...lines].join("\n");
}
