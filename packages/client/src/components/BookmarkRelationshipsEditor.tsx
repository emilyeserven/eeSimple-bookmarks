import type { ComboboxOption } from "./Combobox";
import type { BookmarkRelationship, UpdateBookmarkRelationshipEntry } from "@eesimple/types";

import { useEffect, useMemo, useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";

import { LabeledSection } from "@/components/LabeledSection";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUpdateBookmarkRelationships, useBookmarks } from "@/hooks/useBookmarks";
import { useCollectionAutoSave } from "@/hooks/useCollectionAutoSave";
import { useRelationshipTypes } from "@/hooks/useRelationshipTypes";
import { useBuiltInName } from "@/lib/builtInName";

interface BookmarkRelationshipsEditorProps {
  bookmarkId: string;
  initialRelationships: BookmarkRelationship[];
  /**
   * Unused since the editor moved to debounced auto-save (edit-tab standard — no Save/Cancel
   * buttons); kept so existing mount sites compile unchanged.
   */
  onDone?: () => void;
}

/** A single editable relationship row in the editor's working state. */
interface RelationshipDraft {
  /** Local key so React can track rows as they're added/removed. */
  key: string;
  bookmarkId: string;
  relationshipTypeId: string;
  label: string;
  /** For directional types, whether the selected bookmark is this bookmark's parent. */
  otherIsParent: boolean;
}

let draftCounter = 0;
function newDraft(): RelationshipDraft {
  draftCounter += 1;
  return {
    key: `draft-${draftCounter}`,
    bookmarkId: "",
    relationshipTypeId: "",
    label: "",
    otherIsParent: false,
  };
}

const LABEL_SUGGESTIONS_ID = "relationship-label-suggestions";

/**
 * Shape the complete draft rows for the replace-all PATCH. An incomplete draft row (no bookmark or
 * no type picked yet) is filtered out, so adding an empty row never fires a save.
 */
function relationshipsFromDrafts(
  drafts: RelationshipDraft[],
  directionalTypeIds: Set<string>,
): UpdateBookmarkRelationshipEntry[] {
  return drafts
    .filter(d => d.bookmarkId !== "" && d.relationshipTypeId !== "")
    .map((d) => {
      const directional = directionalTypeIds.has(d.relationshipTypeId);
      const label = d.label.trim();
      return {
        bookmarkId: d.bookmarkId,
        relationshipTypeId: d.relationshipTypeId,
        label: label.length > 0 ? label : null,
        ...(directional
          ? {
            direction: d.otherIsParent ? ("parent" as const) : ("child" as const),
          }
          : {}),
      };
    });
}

export function BookmarkRelationshipsEditor({
  bookmarkId,
  initialRelationships,
}: BookmarkRelationshipsEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: allBookmarks,
  } = useBookmarks();
  const {
    data: relationshipTypes,
  } = useRelationshipTypes();
  const builtInName = useBuiltInName();
  const updateRelationships = useUpdateBookmarkRelationships();

  const [drafts, setDrafts] = useState<RelationshipDraft[]>(() =>
    initialRelationships.map((rel, i) => ({
      key: `initial-${i}`,
      bookmarkId: rel.bookmark.id,
      relationshipTypeId: rel.relationshipTypeId,
      label: rel.label ?? "",
      otherIsParent: rel.directional && rel.role === "parent",
    })));

  const bookmarkOptions: ComboboxOption[] = (allBookmarks ?? [])
    .filter(b => b.id !== bookmarkId)
    .map(b => ({
      value: b.id,
      label: b.title,
      names: b.names,
    }));

  // Hidden types are kept out of the picker, but the directional Set below stays unfiltered so an
  // existing edge on a now-hidden type still resolves its parent/child direction.
  const typeOptions: ComboboxOption[] = (relationshipTypes ?? [])
    .filter(rt => !rt.hidden)
    .map(rt => ({
      value: rt.id,
      label: builtInName(rt),
      searchAlias: rt.builtIn ? rt.name : undefined,
    }));

  const directionalTypeIds = useMemo(
    () => new Set((relationshipTypes ?? []).filter(rt => rt.directional).map(rt => rt.id)),
    [relationshipTypes],
  );

  // Distinct labels already in use across all bookmarks — suggestions for the label combobox.
  const labelSuggestions = useMemo(() => {
    const set = new Set<string>();
    for (const b of allBookmarks ?? []) {
      for (const rel of b.relationships) {
        if (rel.label) set.add(rel.label);
      }
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [allBookmarks]);

  function patchDraft(key: string, patch: Partial<RelationshipDraft>) {
    setDrafts(prev => prev.map(d => (d.key === key
      ? {
        ...d,
        ...patch,
      }
      : d)));
  }

  function removeDraft(key: string) {
    setDrafts(prev => prev.filter(d => d.key !== key));
  }

  // Debounced whole-set auto-save (edit-tab standard — no Save button): whenever the *complete*
  // rows change from the last-saved set, replace the bookmark's relationships in one PATCH with a
  // single "Related bookmarks" toast. Incomplete draft rows stay local-only until filled in.
  const {
    queueSave,
  } = useCollectionAutoSave<UpdateBookmarkRelationshipEntry[]>({
    id: bookmarkId,
    label: "Related bookmarks",
    persist: (relationships, callbacks) => updateRelationships.mutate({
      id: bookmarkId,
      input: {
        relationships,
      },
    }, callbacks),
  });

  useEffect(() => {
    // Wait for the relationship types so directional flags resolve before the snapshot seeds —
    // otherwise the loaded `direction` values would register as a change and fire a spurious save.
    if (relationshipTypes === undefined) return;
    queueSave(relationshipsFromDrafts(drafts, directionalTypeIds));
  }, [drafts, directionalTypeIds, relationshipTypes, queueSave]);

  return (
    <div className="space-y-6">
      <LabeledSection
        title={t("Relationships")}
        description={t("Link this bookmark to others and classify how they relate. Directional types (e.g. Parent/child) ask which bookmark is the parent and power the Hierarchy view.")}
      >
        <datalist id={LABEL_SUGGESTIONS_ID}>
          {labelSuggestions.map(label => (
            <option
              key={label}
              value={label}
            />
          ))}
        </datalist>

        <div className="space-y-3">
          {drafts.map((draft) => {
            const directional = directionalTypeIds.has(draft.relationshipTypeId);
            return (
              <div
                key={draft.key}
                className="
                  grid grid-cols-1 gap-2 rounded-lg border p-3
                  sm:grid-cols-2
                "
              >
                <Combobox
                  options={bookmarkOptions}
                  value={draft.bookmarkId || undefined}
                  onValueChange={v => patchDraft(draft.key, {
                    bookmarkId: v ?? "",
                  })}
                  placeholder={t("Select a bookmark…")}
                  searchPlaceholder={t("Search bookmarks…")}
                  emptyText={t("No other bookmarks found.")}
                  aria-label={t("Related bookmark")}
                />
                <Combobox
                  options={typeOptions}
                  value={draft.relationshipTypeId || undefined}
                  onValueChange={v => patchDraft(draft.key, {
                    relationshipTypeId: v ?? "",
                  })}
                  placeholder={t("Relationship type…")}
                  searchPlaceholder={t("Search types…")}
                  emptyText={t("No relationship types.")}
                  aria-label={t("Relationship type")}
                />
                <Input
                  value={draft.label}
                  list={LABEL_SUGGESTIONS_ID}
                  placeholder={t("Optional label (e.g. sequel)")}
                  onChange={e => patchDraft(draft.key, {
                    label: e.target.value,
                  })}
                  aria-label={t("Relationship label")}
                />
                <div className="flex items-center justify-between gap-2">
                  {directional
                    ? (
                      <label
                        className="
                          flex items-center gap-2 text-sm text-muted-foreground
                        "
                      >
                        <Checkbox
                          checked={draft.otherIsParent}
                          onCheckedChange={checked => patchDraft(draft.key, {
                            otherIsParent: checked === true,
                          })}
                          aria-label={t("The selected bookmark is the parent")}
                        />
                        {t("Selected bookmark is the parent")}
                      </label>
                    )
                    : <span />}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDraft(draft.key)}
                    aria-label={t("Remove relationship")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="outline"
            onClick={() => setDrafts(prev => [...prev, newDraft()])}
          >
            <Plus className="size-4" />
            {t("Add relationship")}
          </Button>
        </div>
      </LabeledSection>
    </div>
  );
}
