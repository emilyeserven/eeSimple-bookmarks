import type { ApplyState, DirectEntity, EntityBucket, FillRow } from "./rowTypes";
import type { SocialLink } from "@eesimple/types";

import { isSummaryKind, resolveLanguageId } from "../../lib/taxonomy/taxonomyFill";
import { apiGet, jsonOrEmpty, sendJson } from "../api";
import { uploadImageFromUrl } from "../imageUpload";
import { session } from "../session";
import { entityLanguageDisplay, entityTargetTerms } from "./entityDisplay";
import { upsertSocialLink } from "./entityRows";

/*
 * The post-bookmark apply phases for taxonomy entities: linked-term PATCH buckets, primary-language
 * writes, and `taxonomyDirect` updates. All best-effort — a failure is counted, never thrown, so it
 * can't undo the bookmark PATCH that already landed.
 */

export interface PhaseResult {
  updated: number;
  failed: number;
}

async function patchEntity(path: string, id: string, patch: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await sendJson("PATCH", `${path}/${id}`, patch);
    return res.ok;
  }
  catch {
    return false;
  }
}

/** PATCH each accumulated linked-term bucket. */
export async function applyEntityPatches(entityPatches: Record<string, EntityBucket>): Promise<PhaseResult> {
  const result: PhaseResult = {
    updated: 0,
    failed: 0,
  };
  for (const bucket of Object.values(entityPatches)) {
    if (Object.keys(bucket.patch).length === 0) continue;
    if (await patchEntity(bucket.path, bucket.id, bucket.patch)) result.updated += 1;
    else result.failed += 1;
  }
  return result;
}

/**
 * Each checked language row: resolve the code to a Language ONCE, then merge the primary-level entry
 * into each targeted term's usages (the PUT is replace-all). Terms that already have one are skipped.
 */
export async function applyLanguageWrites(rows: readonly FillRow[]): Promise<PhaseResult> {
  const result: PhaseResult = {
    updated: 0,
    failed: 0,
  };
  for (const row of rows) {
    const e = row.entity;
    if (e?.mode !== "language") continue;
    const {
      id,
    } = await resolveLanguageId(session.serverUrl, e.extracted, e.languages);
    if (!id) {
      result.failed += 1;
      continue;
    }
    for (const term of entityTargetTerms(e)) {
      if (!entityLanguageDisplay(e, term).changed) continue;
      const entries = (term.languageUsages ?? []).map(u => ({
        languageId: u.languageId,
        usageLevelId: u.usageLevelId,
      }));
      if (!entries.some(en => en.languageId === id && en.usageLevelId === e.primaryLevelId)) {
        entries.push({
          languageId: id,
          usageLevelId: e.primaryLevelId,
        });
      }
      try {
        const res = await sendJson("PUT", `/api/language-usages/${e.ownerType}/${term.id}`, {
          entries,
        });
        if (res.ok) result.updated += 1;
        else result.failed += 1;
      }
      catch {
        result.failed += 1;
      }
    }
  }
  return result;
}

/** Match-mode associations that may mint a name-only stub when unmatched; the rest are match-only. */
const MATCH_CREATABLE = new Set<string>(["people", "groups", "locations", "tags"]);

interface EntityRecord {
  id?: string;
  socialLinks?: SocialLink[];
  [key: string]: unknown;
}

interface ResolvedEntity {
  id: string | null;
  created: boolean;
  record: EntityRecord | null;
}

const UNRESOLVED: ResolvedEntity = {
  id: null,
  created: false,
  record: null,
};

/** Find an entity by its name key (case-insensitive) in the association's list endpoint. */
async function findEntity(d: Extract<DirectEntity, { resolveMode: "match" }>): Promise<EntityRecord | null> {
  const nameKey = d.spec.nameKey;
  const lower = d.resolveName.toLowerCase();
  try {
    const res = await apiGet(d.spec.apiPath);
    if (!res.ok) return null;
    const all: unknown = await res.json();
    if (!Array.isArray(all)) return null;
    return (all as EntityRecord[]).find((o) => {
      const name = o[nameKey];
      return typeof name === "string" && name.toLowerCase() === lower;
    }) ?? null;
  }
  catch {
    return null;
  }
}

/** Match an existing entity by its scraped name, else create a name-only stub when allowed. */
async function resolveEntity(d: Extract<DirectEntity, { resolveMode: "match" }>): Promise<ResolvedEntity> {
  const match = await findEntity(d);
  if (match?.id) return {
    id: match.id,
    created: false,
    record: match,
  };
  if (!MATCH_CREATABLE.has(d.association)) return UNRESOLVED;
  try {
    const res = await sendJson("POST", d.spec.apiPath, {
      [d.spec.nameKey]: d.resolveName,
    });
    if (!res.ok) return UNRESOLVED;
    const created = await jsonOrEmpty<EntityRecord>(res);
    return created.id
      ? {
        id: created.id,
        created: true,
        record: created as EntityRecord,
      }
      : UNRESOLVED;
  }
  catch {
    return UNRESOLVED;
  }
}

/** The JSON PATCH body for a match-mode direct field; socialLink upserts into the current links. */
function buildDirectPatch(d: DirectEntity, record: EntityRecord | null): Record<string, unknown> {
  if (d.field === "image") return {};
  const bucket: EntityBucket = {
    path: d.spec.apiPath,
    id: "",
    patch: {},
    socialSeeded: false,
    relationSeeded: {},
  };
  switch (d.field) {
    case "socialLink":
      if (d.socialPlatform) upsertSocialLink(bucket, record?.socialLinks, d.socialPlatform, d.value);
      break;
    case "name":
      bucket.patch[d.spec.nameKey] = d.value;
      break;
    case "year":
      bucket.patch.year = d.coerced;
      break;
    case "description":
      bucket.patch.description = d.value;
      break;
  }
  return bucket.patch;
}

/** Resolve a direct row's entity id, recording created / failed stubs for the summary. */
async function directEntityId(d: DirectEntity, state: ApplyState): Promise<{ id: string | null;
  record: EntityRecord | null; }> {
  if (d.resolveMode === "url") return {
    id: d.termId,
    record: null,
  };
  const resolved = await resolveEntity(d);
  const summaryKind = isSummaryKind(d.association) ? d.association : null;
  if (summaryKind) {
    const entry = {
      kind: summaryKind,
      name: d.resolveName,
    };
    if (resolved.created) state.created.push(entry);
    else if (!resolved.id) state.failed.push(entry);
  }
  return resolved;
}

/** Apply each checked `taxonomyDirect` row: resolve the entity, then PATCH a field or upload an image. */
export async function applyDirectRows(rows: readonly FillRow[], state: ApplyState): Promise<PhaseResult> {
  const result: PhaseResult = {
    updated: 0,
    failed: 0,
  };
  for (const row of rows) {
    const d = row.directEntity;
    if (!d) continue;
    const {
      id, record,
    } = await directEntityId(d, state);
    if (!id) {
      result.failed += 1;
      continue;
    }
    let ok = false;
    if (d.field === "image") {
      for (const url of d.imageUrls) {
        if (await uploadImageFromUrl(url, `${d.spec.apiPath}/${id}/image`)) ok = true;
      }
    }
    else {
      ok = await patchEntity(d.spec.apiPath, id, buildDirectPatch(d, record));
    }
    if (ok) result.updated += 1;
    else result.failed += 1;
  }
  return result;
}
