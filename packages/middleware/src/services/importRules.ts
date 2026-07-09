import { asc, eq, ne } from "drizzle-orm";
import type {
  BulkDeleteResult,
  ConditionInput,
  ConditionTree,
  CreateImportRuleInput,
  ImportRule,
  ImportRuleAction,
  UpdateImportRuleInput,
} from "@eesimple/types";
import { emptyConditionTree, evaluateConditions } from "@eesimple/types";
import { db } from "@/db";
import { bulkDeleteEntities } from "@/services/bulkDelete";
import { importRules, type ImportRuleRow } from "@/db/schema";
import { slugify } from "@/utils/slug";

/** Pick a slug unique within existing import rule slugs. Falls back to "rule" for empty names. */
function uniqueImportRuleSlug(name: string, taken: Set<string>): string {
  const base = slugify(name) || "rule";
  if (!taken.has(base)) return base;
  for (let n = 2; ; n += 1) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/** Fetch the set of all existing import rule slugs, optionally excluding one rule. */
async function takenImportRuleSlugs(excludeId?: string): Promise<Set<string>> {
  const rows = await db
    .select({
      slug: importRules.slug,
    })
    .from(importRules)
    .where(excludeId ? ne(importRules.id, excludeId) : undefined);
  return new Set(rows.map(r => r.slug).filter((s): s is string => s !== null));
}

/** Map a DB row to the shared `ImportRule` wire type. */
function toImportRule(row: ImportRuleRow): ImportRule {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    conditions: row.conditions ?? emptyConditionTree(),
    action: row.action as ImportRuleAction,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
  };
}

export async function listImportRules(): Promise<ImportRule[]> {
  const rows = await db
    .select()
    .from(importRules)
    .orderBy(asc(importRules.sortOrder), asc(importRules.createdAt));
  return rows.map(toImportRule);
}

export async function getImportRule(id: string): Promise<ImportRule | null> {
  const [row] = await db.select().from(importRules).where(eq(importRules.id, id));
  return row ? toImportRule(row) : null;
}

export async function getImportRuleBySlug(slug: string): Promise<ImportRule | null> {
  const [row] = await db.select().from(importRules).where(eq(importRules.slug, slug));
  return row ? toImportRule(row) : null;
}

export async function createImportRule(input: CreateImportRuleInput): Promise<ImportRule> {
  const taken = await takenImportRuleSlugs();
  const slug = uniqueImportRuleSlug(input.name, taken);
  const [row] = await db
    .insert(importRules)
    .values({
      name: input.name,
      slug,
      description: input.description ?? null,
      conditions: input.conditions,
      action: input.action,
      sortOrder: input.sortOrder ?? 0,
    })
    .returning();
  return toImportRule(row!);
}

export async function updateImportRule(id: string, input: UpdateImportRuleInput): Promise<ImportRule | null> {
  const [existing] = await db.select().from(importRules).where(eq(importRules.id, id));
  if (!existing) return null;

  const patch: Partial<typeof importRules.$inferInsert> = {};
  if (input.name !== undefined) {
    patch.name = input.name;
    const taken = await takenImportRuleSlugs(id);
    patch.slug = uniqueImportRuleSlug(input.name, taken);
  }
  if (input.description !== undefined) patch.description = input.description ?? null;
  if (input.conditions !== undefined) patch.conditions = input.conditions;
  if (input.action !== undefined) patch.action = input.action;
  if (input.sortOrder !== undefined) patch.sortOrder = input.sortOrder;

  if (Object.keys(patch).length > 0) {
    await db.update(importRules).set(patch).where(eq(importRules.id, id));
  }

  return getImportRule(id);
}

export async function deleteImportRule(id: string): Promise<boolean> {
  const rows = await db.delete(importRules).where(eq(importRules.id, id)).returning({
    id: importRules.id,
  });
  return rows.length > 0;
}

/** Delete many import rules, reporting per-item outcomes. */
export function bulkDeleteImportRules(ids: string[]): Promise<BulkDeleteResult[]> {
  return bulkDeleteEntities(ids, deleteImportRule);
}

/**
 * Evaluate the ordered import rules against a candidate URL/title and return the first matching
 * rule's action, or `null` when no rule matches. Rules are sorted by `sortOrder ASC`, so lower
 * numbers fire first.
 */
export async function applyImportRules(
  item: { url: string;
    title: string | null; },
): Promise<ImportRuleAction | null> {
  const rules = await listImportRules();
  if (rules.length === 0) return null;

  // Build a minimal ConditionInput: at ingest time we only have URL + title. All other fields are
  // empty/null so conditions that reference category/tags/properties/etc. never match — use only
  // URL match and Website conditions in import rules.
  const conditionInput: ConditionInput = {
    url: item.url,
    title: item.title ?? "",
    categoryId: "",
    tagIds: new Set<string>(),
    locationIds: new Set<string>(),
    youtubeChannelId: null,
    mediaTypeId: null,
    relationshipTypeIds: new Set<string>(),
    languageUsages: [],
    numberValues: new Map<string, number>(),
    booleanValues: new Map<string, boolean>(),
    dateTimeValues: new Map<string, string>(),
    fileValues: new Set<string>(),
    choicesValues: new Map<string, string[]>(),
    sectionsValues: new Map(),
    textValues: new Map<string, string>(),
  };

  for (const rule of rules) {
    const conditions: ConditionTree = rule.conditions ?? emptyConditionTree();
    if (evaluateConditions(conditions, conditionInput)) {
      return rule.action;
    }
  }
  return null;
}
