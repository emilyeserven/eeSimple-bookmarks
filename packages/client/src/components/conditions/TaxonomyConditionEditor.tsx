import type { Taxonomy, TaxonomyCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "../TreeMultiCombobox";

import { useTaxonomyTermTree } from "@/hooks/useTaxonomies";
import { namedTreeNodesToOptions } from "@/lib/comboboxOptions";
import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "@/lib/conditionCascade";

interface TaxonomyConditionEditorProps {
  /** The taxonomy this leaf filters on — scopes the term choices and names the control. */
  taxonomy: Taxonomy;
  value: TaxonomyCondition;
  onChange: (next: TaxonomyCondition) => void;
}

/**
 * Controlled tree multi-select editor for a "<taxonomy> is one of …" condition — the generic
 * per-user-taxonomy counterpart to `GenreMoodConditionEditor`. A selected **parent** term shows a
 * "+ children" checkbox: checked = also match bookmarks carrying any descendant term (cascade),
 * unchecked = exact. The legacy-cascade default is `false` (exact), matching how the evaluator's
 * `cascadeCandidates` treats a `taxonomy` leaf with no `cascadeTermIds`.
 *
 * Unlike the other entity condition editors there is no inline-create option: a term belongs to one
 * specific taxonomy and is created on that taxonomy's own page, so offering creation from inside a
 * filter builder would be a surprising place to mint vocabulary.
 */
export function TaxonomyConditionEditor({
  taxonomy, value, onChange,
}: TaxonomyConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [], isLoading,
  } = useTaxonomyTermTree(taxonomy.id);

  return (
    <div className="space-y-2">
      <TreeMultiCombobox
        aria-label={taxonomy.name}
        placeholder={isLoading
          ? t("Loading…")
          : t("Any {{name}}", {
            name: taxonomy.name.toLowerCase(),
          })}
        searchPlaceholder={t("Search {{name}}…", {
          name: taxonomy.name.toLowerCase(),
        })}
        emptyText={t("No entries found.")}
        options={namedTreeNodesToOptions(tree)}
        values={value.termIds}
        onValuesChange={termIds =>
          onChange({
            ...value,
            termIds,
            cascadeTermIds: pruneCascadeIds(value.cascadeTermIds, termIds),
          })}
        cascadeValues={effectiveCascadeIds(value.termIds, value.cascadeTermIds, false)}
        onToggleCascade={id =>
          onChange({
            ...value,
            cascadeTermIds: toggleCascadeId(value.termIds, value.cascadeTermIds, id, false),
          })}
      />
      <p className="text-xs text-muted-foreground">
        {t("Check “+ children” on a parent entry to also match bookmarks with its child entries; leave it unchecked for an exact match.")}
      </p>
    </div>
  );
}
