/**
 * Review + apply half of the bookmark "AI" tab (the pure sibling of `bookmarkAiUpdate.ts`): turn the
 * parsed proposals into per-field review rows (current vs proposed, changed/same/invalid, with
 * "will be created" markers for unmatched taxonomy names), and fold the kept rows into an apply plan
 * — the entity creations to run first, the `PATCH /api/bookmarks/:id` input, and the entity-names
 * replace-all set. Encodes the server semantics the PATCH relies on: relation id lists and per-type
 * value arrays are whole-set replacements, so sent arrays are seeded with the bookmark's existing
 * entries; relations are additive-only (union), and `names`/`title` go through the entity-names PUT.
 */

import type {
  AiProposalValue,
  AiSectionProposal,
  AiUpdatableFieldKey,
  AiUpdateProposal,
} from "./bookmarkAiUpdate";
import type {
  Bookmark,
  CustomProperty,
  MediaType,
  SectionEntry,
  SectionEntryType,
  UpdateBookmarkInput,
  UpdateEntityNameEntry,
} from "@eesimple/types";

import { AI_STANDARD_FIELD_LABELS, propertyIdFromAiFieldKey } from "./bookmarkAiUpdate";
import { sectionEntryTypeHint } from "./sectionEntryTypeHint";

/** The case-insensitive identity used to match names throughout this module. */
function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

/** An entity the apply step must create before the PATCH can reference it. */
export type AiUpdateCreationKind = "tag" | "person" | "group" | "category" | "mediaType";

export interface AiUpdateCreation {
  kind: AiUpdateCreationKind;
  name: string;
  /** The review row this creation came from — `buildBookmarkInput` looks the new id up by this key. */
  rowKey: string;
}

/** What including one review row contributes to the apply plan. */
export type AiUpdateRowApply
  = | { kind: "scalar";
    field: "title" | "description" | "isbn" | "year" | "priority";
    value: string | number; }
    | { kind: "singleRelation";
      field: "category" | "mediaType";
      existingId?: string; }
      | { kind: "addRelation";
        relation: "tags" | "people" | "groups";
        existingId?: string; }
        | { kind: "nameEntry";
          languageId: string;
          value: string; }
          | { kind: "propValue";
            property: CustomProperty;
            value: AiProposalValue; };

export interface AiUpdateReviewRow {
  /** Stable row identity for the kept/excluded checkbox set. */
  key: string;
  fieldKey: AiUpdatableFieldKey;
  /** Untranslated label — a standard-field label (UI translates) or the property's own name. */
  label: string;
  current: string;
  proposed: string;
  status: "changed" | "same" | "invalid";
  /** Short reason phrase for an invalid row (the UI wraps it in `t()`). */
  invalidReason?: string;
  /** Set when keeping this row creates a new entity ("will be created" marker). */
  creates?: AiUpdateCreationKind;
  /** Choice entries the AI proposed that matched no option (surfaced muted). */
  droppedOptions?: string[];
  /** What applying this row does; absent for `same`/`invalid` rows. */
  apply?: AiUpdateRowApply;
}

export interface AiUpdateReviewContext {
  bookmark: Bookmark;
  tags: { id: string;
    name: string; }[];
  categories: { id: string;
    name: string; }[];
  mediaTypes: Pick<MediaType, "id" | "name" | "slug" | "parentId">[];
  people: { id: string;
    name: string; }[];
  groups: { id: string;
    name: string; }[];
  languages: { id: string;
    name: string;
    isoCode: string | null; }[];
}

function row(partial: Omit<AiUpdateReviewRow, "key"> & { key?: string }): AiUpdateReviewRow {
  return {
    key: partial.key ?? partial.fieldKey,
    ...partial,
  };
}

function invalidRow(fieldKey: AiUpdatableFieldKey, label: string, reason: string, current = ""): AiUpdateReviewRow {
  return row({
    fieldKey,
    label,
    current,
    proposed: "",
    status: "invalid",
    invalidReason: reason,
  });
}

/** A changed-or-same scalar row comparing display strings. */
function scalarRow(
  fieldKey: AiUpdatableFieldKey,
  field: "title" | "description" | "isbn" | "year" | "priority",
  current: string,
  proposed: string,
  value: string | number,
): AiUpdateReviewRow {
  const changed = current.trim() !== proposed.trim();
  return row({
    fieldKey,
    label: AI_STANDARD_FIELD_LABELS[field],
    current,
    proposed,
    status: changed ? "changed" : "same",
    ...(changed && {
      apply: {
        kind: "scalar",
        field,
        value,
      },
    }),
  });
}

/** Rows for the `names` proposal: one per language entry, resolving the language by name/ISO code. */
function nameEntryRows(
  entries: AiNameEntry[],
  ctx: AiUpdateReviewContext,
): AiUpdateReviewRow[] {
  const byName = new Map(ctx.languages.map(lang => [nameKey(lang.name), lang]));
  const byIso = new Map(ctx.languages
    .flatMap(lang => lang.isoCode ? [[lang.isoCode.toLowerCase(), lang] as const] : []));
  return entries.map((entry) => {
    const language = byName.get(nameKey(entry.language)) ?? byIso.get(entry.language.toLowerCase());
    if (!language) {
      return invalidRow("names", AI_STANDARD_FIELD_LABELS.names, "Unknown language", entry.language);
    }
    const existing = ctx.bookmark.names.find(name => name.language.id === language.id);
    const changed = existing?.value.trim() !== entry.value.trim();
    return row({
      key: `names:${language.id}`,
      fieldKey: "names",
      label: `${AI_STANDARD_FIELD_LABELS.names} (${language.name})`,
      current: existing?.value ?? "",
      proposed: entry.value,
      status: changed ? "changed" : "same",
      ...(changed && {
        apply: {
          kind: "nameEntry",
          languageId: language.id,
          value: entry.value,
        },
      }),
    });
  });
}

/** The single category/mediaType row: matched → switch, unmatched → create-new. */
function singleRelationRow(
  field: "category" | "mediaType",
  name: string,
  ctx: AiUpdateReviewContext,
): AiUpdateReviewRow {
  const list = field === "category" ? ctx.categories : ctx.mediaTypes;
  const currentId = field === "category" ? ctx.bookmark.categoryId : ctx.bookmark.mediaType?.id ?? null;
  const currentName = field === "category"
    ? ctx.categories.find(category => category.id === currentId)?.name ?? ""
    : ctx.bookmark.mediaType?.name ?? "";
  const matched = list.find(entry => nameKey(entry.name) === nameKey(name));
  const changed = matched === undefined || matched.id !== currentId;
  return row({
    fieldKey: field,
    label: AI_STANDARD_FIELD_LABELS[field],
    current: currentName,
    proposed: matched?.name ?? name,
    status: changed ? "changed" : "same",
    ...(matched === undefined && {
      creates: field,
    }),
    ...(changed && {
      apply: {
        kind: "singleRelation",
        field,
        ...(matched !== undefined && {
          existingId: matched.id,
        }),
      },
    }),
  });
}

/** One row per proposed tag/person/group name: on-bookmark → same, known → add, unknown → create. */
function addRelationRows(
  relation: "tags" | "people" | "groups",
  names: string[],
  ctx: AiUpdateReviewContext,
): AiUpdateReviewRow[] {
  const creationKind: AiUpdateCreationKind = relation === "tags" ? "tag" : relation === "people" ? "person" : "group";
  const onBookmark = new Set(ctx.bookmark[relation].map(entry => nameKey(entry.name)));
  const list = relation === "tags" ? ctx.tags : relation === "people" ? ctx.people : ctx.groups;
  const byKey = new Map(list.map(entry => [nameKey(entry.name), entry]));
  return names.map((name) => {
    const matched = byKey.get(nameKey(name));
    const already = onBookmark.has(nameKey(name));
    return row({
      key: `${relation}:${nameKey(name)}`,
      fieldKey: relation,
      label: AI_STANDARD_FIELD_LABELS[relation],
      current: "",
      proposed: matched?.name ?? name,
      status: already ? "same" : "changed",
      ...(!already && matched === undefined && {
        creates: creationKind,
      }),
      ...(!already && {
        apply: {
          kind: "addRelation",
          relation,
          ...(matched !== undefined && {
            existingId: matched.id,
          }),
        },
      }),
    });
  });
}

/** The bookmark's current display string for a property row, per value kind. */
function propertyCurrent(property: CustomProperty, bookmark: Bookmark): string {
  switch (property.type) {
    case "number":
    case "ratingScale": {
      const entry = bookmark.numberValues.find(v => v.propertyId === property.id);
      if (!entry) return "";
      return entry.valueEnd != null ? `${entry.value}–${entry.valueEnd}` : String(entry.value);
    }
    case "boolean": {
      const entry = bookmark.booleanValues.find(v => v.propertyId === property.id);
      return entry ? String(entry.value) : "";
    }
    case "datetime": return bookmark.dateTimeValues.find(v => v.propertyId === property.id)?.value ?? "";
    case "choices": {
      const entry = bookmark.choicesValues.find(v => v.propertyId === property.id);
      if (!entry) return "";
      const labels = new Map(property.choicesItems.map(item => [item.value, item.label]));
      return entry.values.map(v => labels.get(v) ?? v).join(", ");
    }
    case "itemInItems": {
      const entry = bookmark.progressValues.find(v => v.propertyId === property.id);
      return entry ? `${entry.current} of ${entry.total}` : "";
    }
    case "sections": {
      const entry = bookmark.sectionsValues.find(v => v.propertyId === property.id);
      return entry && entry.sections.length > 0 ? `${entry.sections.length} sections` : "";
    }
    case "text": return bookmark.textValues.find(v => v.propertyId === property.id)?.value ?? "";
    default: return "";
  }
}

/** The proposed display string for a property value. */
function propertyProposed(property: CustomProperty, value: AiProposalValue): string {
  switch (value.kind) {
    case "propNumber":
      return value.valueEnd != null ? `${value.value}–${value.valueEnd}` : String(value.value);
    case "propBoolean": return String(value.value);
    case "propDateTime": return value.value;
    case "propChoices": {
      const labels = new Map(property.choicesItems.map(item => [item.value, item.label]));
      return value.values.map(v => labels.get(v) ?? v).join(", ");
    }
    case "propProgress": return `${value.current} of ${value.total}`;
    case "propSections": return `${value.sections.length} sections`;
    case "propText": return value.text;
    default: return "";
  }
}

/** The review row for one custom property's accepted proposal. */
function propertyRow(
  fieldKey: AiUpdatableFieldKey,
  property: CustomProperty,
  value: AiProposalValue,
  bookmark: Bookmark,
): AiUpdateReviewRow {
  const current = propertyCurrent(property, bookmark);
  const proposed = propertyProposed(property, value);
  // Sections compare as "N sections" summaries, which can match while the content differs — a
  // sections proposal is always treated as a change (it replaces the value wholesale).
  const changed = value.kind === "propSections" || current.trim() !== proposed.trim();
  const dropped = value.kind === "propChoices" && value.dropped.length > 0 ? value.dropped : undefined;
  return row({
    fieldKey,
    label: property.name,
    current,
    proposed,
    status: changed ? "changed" : "same",
    ...(dropped && {
      droppedOptions: dropped,
    }),
    ...(changed && {
      apply: {
        kind: "propValue",
        property,
        value,
      },
    }),
  });
}

/** The review rows for one accepted proposal (relations fan out to one row per name). */
function rowsForProposal(
  proposal: Extract<AiUpdateProposal, { ok: true }>,
  ctx: AiUpdateReviewContext,
  propertyById: Map<string, CustomProperty>,
): AiUpdateReviewRow[] {
  const {
    fieldKey, value,
  } = proposal;
  const {
    bookmark,
  } = ctx;
  switch (value.kind) {
    case "text": {
      const field = fieldKey as "title" | "description" | "isbn";
      const current = field === "title" ? bookmark.title : (bookmark[field] ?? "");
      return [scalarRow(fieldKey, field, current, value.text, value.text)];
    }
    case "number": {
      const field = fieldKey as "year" | "priority";
      const current = field === "year" ? bookmark.year : bookmark.priority;
      return [scalarRow(fieldKey, field, current != null ? String(current) : "", String(value.value), value.value)];
    }
    case "names": return nameEntryRows(value.entries, ctx);
    case "name": return [singleRelationRow(fieldKey as "category" | "mediaType", value.name, ctx)];
    case "nameList": return addRelationRows(fieldKey as "tags" | "people" | "groups", value.names, ctx);
    default: {
      const propertyId = propertyIdFromAiFieldKey(fieldKey);
      const property = propertyId ? propertyById.get(propertyId) : undefined;
      if (!property) return [];
      return [propertyRow(fieldKey, property, value, bookmark)];
    }
  }
}

/**
 * Build the review rows for the parsed proposals: `changed` rows are kept by default (uncheckable),
 * `same` rows render muted with no checkbox, `invalid` rows carry their reason. Unmatched taxonomy
 * names become per-name rows flagged `creates`.
 */
export function buildAiUpdateReview(
  proposals: AiUpdateProposal[],
  properties: CustomProperty[],
  ctx: AiUpdateReviewContext,
): AiUpdateReviewRow[] {
  const propertyById = new Map(properties.map(property => [property.id, property]));
  return proposals.flatMap((proposal) => {
    if (!proposal.ok) {
      const propertyId = propertyIdFromAiFieldKey(proposal.fieldKey);
      const label = propertyId
        ? propertyById.get(propertyId)?.name ?? propertyId
        : AI_STANDARD_FIELD_LABELS[proposal.fieldKey as keyof typeof AI_STANDARD_FIELD_LABELS];
      return [invalidRow(proposal.fieldKey, label, proposal.reason)];
    }
    return rowsForProposal(proposal, ctx, propertyById);
  });
}

// ---------------------------------------------------------------------------------------------------
// Apply plan
// ---------------------------------------------------------------------------------------------------

export interface AiUpdateApplyPlan {
  /** Entities to create (sequentially) before the PATCH; ids are keyed back by `rowKey`. */
  creations: AiUpdateCreation[];
  /** Whether anything at all would be applied. */
  hasChanges: boolean;
  /** Distinct fields being applied (drives the success toast). */
  fieldCount: number;
  /**
   * The `PATCH /api/bookmarks/:id` input for the kept rows, or `null` when nothing PATCHable was
   * kept. Relation id lists are unions over the bookmark's existing ids (additive-only), and each
   * per-type value array is seeded with the bookmark's existing entries — the PATCH replaces those
   * arrays wholesale, so an unseeded array would wipe the other properties' values of that type.
   */
  buildBookmarkInput: (createdIds: Map<string, string>) => UpdateBookmarkInput | null;
  /**
   * The replace-all entity-names set for kept name rows (with a kept title change mirrored into the
   * primary row), or `null` when names are untouched. Applied via `PUT /api/entity-names/bookmark/:id`
   * — `updateBookmark` ignores `names`, and the PUT also syncs the primary value into `title`.
   */
  namesEntries: UpdateEntityNameEntry[] | null;
}

interface AppliedRow {
  row: AiUpdateReviewRow;
  apply: AiUpdateRowApply;
}

/** The union of the bookmark's existing relation ids and the kept rows' resolved/created ids. */
function relationUnion(
  existing: string[],
  rows: AppliedRow[],
  createdIds: Map<string, string>,
): string[] {
  const ids = new Set(existing);
  for (const {
    row: reviewRow, apply,
  } of rows) {
    if (apply.kind !== "addRelation") continue;
    const id = apply.existingId ?? createdIds.get(reviewRow.key);
    if (id) ids.add(id);
  }
  return [...ids];
}

/** Wire the AI's proposed sections into `SectionEntry[]`, typing entries from the media-type hint. */
export function wireAiSections(
  sections: AiSectionProposal[],
  property: CustomProperty,
  ctx: Pick<AiUpdateReviewContext, "bookmark" | "mediaTypes">,
  makeId: () => string,
): SectionEntry[] {
  const allowed = property.sectionsAllowedTypes ?? ["name", "url", "page", "timestamp"];
  const hint = sectionEntryTypeHint(ctx.bookmark.mediaType?.id ?? null, ctx.mediaTypes);
  const valueType: SectionEntryType = hint && allowed.includes(hint) ? hint : allowed[0] ?? "name";
  const nameType: SectionEntryType = allowed.includes("name") ? "name" : valueType;
  function toEntry(section: AiSectionProposal, allowChildren: boolean): SectionEntry {
    return {
      id: makeId(),
      name: section.name,
      type: section.startValue ? valueType : nameType,
      startValue: section.startValue ?? "",
      ...(section.endValue && {
        endValue: section.endValue,
      }),
      ...(allowChildren && section.children && section.children.length > 0 && {
        children: section.children.map(child => toEntry(child, false)),
      }),
    };
  }
  return sections.map(section => toEntry(section, property.sectionsTiered === true));
}

/** Merge one kept property proposal into the (seeded) patch value arrays. */
function applyPropValue(
  patch: UpdateBookmarkInput,
  property: CustomProperty,
  value: AiProposalValue,
  ctx: AiUpdateReviewContext,
  makeId: () => string,
): void {
  const {
    bookmark,
  } = ctx;
  const replace = <T extends { propertyId: string }>(entries: T[], entry: T): T[] =>
    [...entries.filter(existing => existing.propertyId !== property.id), entry];
  switch (value.kind) {
    case "propNumber":
      patch.numberValues = replace(patch.numberValues ?? bookmark.numberValues, {
        propertyId: property.id,
        value: value.value,
        valueEnd: value.valueEnd ?? null,
      });
      break;
    case "propBoolean":
      patch.booleanValues = replace(patch.booleanValues ?? bookmark.booleanValues, {
        propertyId: property.id,
        value: value.value,
      });
      break;
    case "propDateTime":
      patch.dateTimeValues = replace(patch.dateTimeValues ?? bookmark.dateTimeValues, {
        propertyId: property.id,
        value: value.value,
      });
      break;
    case "propChoices":
      patch.choicesValues = replace(patch.choicesValues ?? bookmark.choicesValues, {
        propertyId: property.id,
        values: value.values,
      });
      break;
    case "propProgress": {
      const existing = bookmark.progressValues.find(entry => entry.propertyId === property.id);
      patch.progressValues = replace(patch.progressValues ?? bookmark.progressValues, {
        propertyId: property.id,
        current: value.current,
        total: value.total,
        // The AI speaks only to the numbers; keep the bookmark's display overrides.
        textOverride: existing?.textOverride ?? null,
        autoSpace: existing?.autoSpace ?? null,
      });
      break;
    }
    case "propSections": {
      const existing = bookmark.sectionsValues.find(entry => entry.propertyId === property.id);
      patch.sectionsValues = replace(patch.sectionsValues ?? bookmark.sectionsValues, {
        propertyId: property.id,
        exhaustive: existing?.exhaustive ?? true,
        sections: wireAiSections(value.sections, property, ctx, makeId),
      });
      break;
    }
    case "propText":
      patch.textValues = replace(patch.textValues ?? bookmark.textValues, {
        propertyId: property.id,
        value: value.text,
      });
      break;
    default:
      break;
  }
}

/**
 * Fold the kept review rows into the apply plan. `excludedKeys` holds the row keys the user
 * unchecked (the reparent convention — everything changed is kept unless unchecked); `makeId` is
 * injected for deterministic section-entry ids (production passes `randomId`).
 */
export function buildAiUpdateApplyPlan(
  rows: AiUpdateReviewRow[],
  excludedKeys: ReadonlySet<string>,
  ctx: AiUpdateReviewContext,
  makeId: () => string,
): AiUpdateApplyPlan {
  const kept: AppliedRow[] = rows.flatMap((reviewRow) => {
    if (reviewRow.status !== "changed" || excludedKeys.has(reviewRow.key) || !reviewRow.apply) return [];
    return [{
      row: reviewRow,
      apply: reviewRow.apply,
    }];
  });
  const creations: AiUpdateCreation[] = kept.flatMap(({
    row: reviewRow,
  }) => reviewRow.creates
    ? [{
      kind: reviewRow.creates,
      name: reviewRow.proposed,
      rowKey: reviewRow.key,
    }]
    : []);
  const {
    bookmark,
  } = ctx;

  const titleRow = kept.find(({
    apply,
  }) => apply.kind === "scalar" && apply.field === "title");
  const nameRows = kept.filter(({
    apply,
  }) => apply.kind === "nameEntry");

  // The replace-all entity-names set: existing rows merged by language, kept proposals overriding,
  // and a kept title change mirrored into the primary row (title IS the primary name).
  let namesEntries: UpdateEntityNameEntry[] | null = null;
  const hasPrimaryRow = bookmark.names.some(name => name.isPrimary);
  if (nameRows.length > 0 || (titleRow && hasPrimaryRow)) {
    const entries: UpdateEntityNameEntry[] = bookmark.names.map(name => ({
      languageId: name.language.id,
      value: name.value,
      isPrimary: name.isPrimary,
    }));
    for (const {
      apply,
    } of nameRows) {
      if (apply.kind !== "nameEntry") continue;
      const existing = entries.find(entry => entry.languageId === apply.languageId);
      if (existing) existing.value = apply.value;
      else entries.push({
        languageId: apply.languageId,
        value: apply.value,
      });
    }
    if (titleRow && titleRow.apply.kind === "scalar") {
      const primary = entries.find(entry => entry.isPrimary);
      if (primary) primary.value = String(titleRow.apply.value);
    }
    namesEntries = entries;
  }

  function buildBookmarkInput(createdIds: Map<string, string>): UpdateBookmarkInput | null {
    const patch: UpdateBookmarkInput = {};
    for (const {
      row: reviewRow, apply,
    } of kept) {
      if (apply.kind === "scalar") {
        if (apply.field === "title") patch.title = String(apply.value);
        else if (apply.field === "description") patch.description = String(apply.value);
        else if (apply.field === "isbn") patch.isbn = String(apply.value);
        else if (apply.field === "year") patch.year = Number(apply.value);
        else patch.priority = Number(apply.value);
      }
      else if (apply.kind === "singleRelation") {
        const id = apply.existingId ?? createdIds.get(reviewRow.key);
        if (id) {
          if (apply.field === "category") patch.categoryId = id;
          else patch.mediaTypeId = id;
        }
      }
      else if (apply.kind === "propValue") {
        applyPropValue(patch, apply.property, apply.value, ctx, makeId);
      }
    }
    const rowsFor = (relation: "tags" | "people" | "groups"): AppliedRow[] =>
      kept.filter(({
        apply,
      }) => apply.kind === "addRelation" && apply.relation === relation);
    const tagRows = rowsFor("tags");
    if (tagRows.length > 0) {
      patch.tagIds = relationUnion(bookmark.tags.map(tag => tag.id), tagRows, createdIds);
    }
    const peopleRows = rowsFor("people");
    if (peopleRows.length > 0) {
      patch.personIds = relationUnion(bookmark.people.map(person => person.id), peopleRows, createdIds);
    }
    const groupRows = rowsFor("groups");
    if (groupRows.length > 0) {
      patch.groupIds = relationUnion(bookmark.groups.map(group => group.id), groupRows, createdIds);
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }

  return {
    creations,
    hasChanges: kept.length > 0,
    fieldCount: new Set(kept.map(({
      row: reviewRow,
    }) => reviewRow.fieldKey)).size,
    buildBookmarkInput,
    namesEntries,
  };
}
