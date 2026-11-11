import type { PhaseResult } from "./entityApply";
import type { ApplyState, BookmarkPatch, FillRow } from "./rowTypes";
import type { Bookmark } from "@eesimple/types";

import { hasOriginsAccess, hostPatterns, requestOriginsAccess } from "../../lib/hostAccess";
import { summarizeCreated, summarizeFailed, TAX_PATCH_KEY } from "../../lib/taxonomy/taxonomyFill";
import { sendJson } from "../api";
import { uploadImageFromUrl } from "../imageUpload";
import { applyDirectRows, applyEntityPatches, applyLanguageWrites } from "./entityApply";
import { plural } from "./format";

/*
 * Apply the checked review rows, in phases: the bookmark PATCH (fields, taxonomies, property values),
 * then — best-effort, never undoing the PATCH — linked-term PATCHes, language writes, direct entity
 * updates, and image uploads.
 */

function newApplyState(): ApplyState {
  return {
    tax: {},
    taxHydrated: {},
    values: {},
    entityPatches: {},
    languageWrites: [],
    created: [],
    failed: [],
  };
}

/** Every remote image URL a set of rows will download (data: URIs need no host access). */
function imageUrlsOf(rows: readonly FillRow[]): string[] {
  return rows.flatMap(row => [...(row.image?.urls ?? []), ...(row.directEntity?.field === "image" ? row.directEntity.imageUrls : [])]);
}

/** Whether every image host the rows could download from is already granted (checked ahead of Apply). */
export function hasImageHostAccess(rows: readonly FillRow[]): Promise<boolean> {
  return hasOriginsAccess(hostPatterns(imageUrlsOf(rows)));
}

/**
 * Ask for access to the hosts the checked image rows download from. The extension no longer holds
 * blanket host access, so this must run synchronously inside the Apply click (a user gesture) —
 * before any `await`. A denial just makes those uploads fail and get counted.
 */
export function requestImageHostAccess(rows: readonly FillRow[]): Promise<boolean> {
  const origins = hostPatterns(imageUrlsOf(rows));
  return origins.length ? requestOriginsAccess(origins) : Promise.resolve(true);
}

/** Fold the accumulators into the bookmark PATCH body. */
function finishPatch(patch: BookmarkPatch, state: ApplyState): void {
  for (const [kind, ids] of Object.entries(state.tax) as [keyof typeof TAX_PATCH_KEY, Set<string>][]) {
    // Skip a kind whose current links weren't hydrated: the delete-then-relink PATCH would wipe links
    // we couldn't see.
    if (state.taxHydrated[kind]) patch[TAX_PATCH_KEY[kind]] = Array.from(ids);
  }
  for (const [key, map] of Object.entries(state.values) as [string, Map<string, unknown>][]) {
    patch[key] = Array.from(map.values());
  }
}

interface ImageResult {
  uploaded: number;
  failed: number;
}

/** Upload each image row's URL(s) to the bookmark; `setMain` applies to the first success only. */
async function applyImageRows(rows: readonly FillRow[], bookmarkId: string | undefined): Promise<ImageResult> {
  const result: ImageResult = {
    uploaded: 0,
    failed: 0,
  };
  if (!bookmarkId) return result;
  for (const row of rows) {
    if (!row.image) continue;
    let firstOfRow = true;
    for (const url of row.image.urls) {
      const main = row.image.setMain && firstOfRow ? "?main=true" : "";
      if (await uploadImageFromUrl(url, `/api/bookmarks/${bookmarkId}/images${main}`)) {
        result.uploaded += 1;
        firstOfRow = false;
      }
      else {
        result.failed += 1;
      }
    }
  }
  return result;
}

interface ApplySummaryInput {
  fieldCount: number;
  state: ApplyState;
  entity: PhaseResult;
  language: PhaseResult;
  direct: PhaseResult;
  imagesFailed: number;
}

/** The applied-screen message. */
export function summarizeApply(input: ApplySummaryInput): string {
  const {
    fieldCount, state, entity, language, direct, imagesFailed,
  } = input;
  const parts: string[] = [];
  if (fieldCount > 0) parts.push(`Updated ${plural(fieldCount, "field")}.`);
  // Created / failed taxonomy names are best-effort, but must never be silently swallowed.
  if (state.created.length > 0) parts.push(summarizeCreated(state.created));
  if (state.failed.length > 0) parts.push(summarizeFailed(state.failed));
  if (entity.updated > 0) parts.push(`Updated ${plural(entity.updated, "linked item")}.`);
  if (entity.failed > 0) parts.push(`${plural(entity.failed, "linked item")} couldn't be updated.`);
  if (language.updated > 0) parts.push(`Set language on ${plural(language.updated, "linked item")}.`);
  if (language.failed > 0) parts.push(`${plural(language.failed, "language")} couldn't be set.`);
  if (direct.updated > 0) parts.push(`Updated ${plural(direct.updated, "taxonomy entity", "taxonomy entities")}.`);
  if (direct.failed > 0) parts.push(`${plural(direct.failed, "taxonomy entity", "taxonomy entities")} couldn't be updated.`);
  if (imagesFailed > 0) parts.push(`${plural(imagesFailed, "image")} couldn't be saved.`);
  return parts.join(" ") || "No changes applied.";
}

/**
 * Apply the checked rows and return the summary message. Throws only when the bookmark PATCH itself
 * fails (the caller then lets the user retry).
 */
export async function applyChanges(rows: readonly FillRow[], bookmark: Bookmark | undefined): Promise<string> {
  const checked = rows.filter(row => row.checkbox?.checked);
  const imageRows = checked.filter(row => row.image);
  const entityRows = checked.filter(row => row.entity);
  const directRows = checked.filter(row => row.directEntity);
  const patchRows = checked.filter(row => !row.image && !row.entity && !row.directEntity);

  const state = newApplyState();
  const patch: BookmarkPatch = {};
  for (const row of [...patchRows, ...entityRows]) await row.apply(patch, state);
  finishPatch(patch, state);

  // Only PATCH the bookmark when there is one (taxonomy mode has none) and something changed.
  if (bookmark && Object.keys(patch).length > 0) {
    const res = await sendJson("PATCH", `/api/bookmarks/${bookmark.id}`, patch);
    if (!res.ok) throw new Error(`status ${res.status}`);
    // Keep the in-memory description current so the applied screen's editor prefills the new value.
    if (typeof patch.description === "string") bookmark.description = patch.description;
  }

  const entity = await applyEntityPatches(state.entityPatches);
  const language = await applyLanguageWrites(state.languageWrites);
  const direct = await applyDirectRows(directRows, state);
  const images = await applyImageRows(imageRows, bookmark?.id);
  return summarizeApply({
    fieldCount: patchRows.length + images.uploaded,
    state,
    entity,
    language,
    direct,
    imagesFailed: images.failed,
  });
}
