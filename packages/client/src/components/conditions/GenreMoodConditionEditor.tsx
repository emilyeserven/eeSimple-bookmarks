import type { GenreMoodCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { TreeMultiCombobox } from "../TreeMultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useGenreMoodTree } from "@/hooks/useGenreMoods";
import { genreMoodNodesToOptions } from "@/lib/comboboxOptions";
import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "@/lib/conditionCascade";

interface GenreMoodConditionEditorProps {
  value: GenreMoodCondition;
  onChange: (next: GenreMoodCondition) => void;
}

/**
 * Controlled tree multi-select editor for a "Genres & Moods is one of …" condition. A selected
 * **parent** entry shows a "+ children" checkbox: checked = also match bookmarks carrying any
 * descendant genre/mood (cascade), unchecked = exact.
 */
export function GenreMoodConditionEditor({
  value, onChange,
}: GenreMoodConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: tree = [], isLoading,
  } = useGenreMoodTree();
  const create = useEntityCreateOption("genre-mood", genreMood =>
    onChange({
      ...value,
      genreMoodIds: [...value.genreMoodIds, genreMood.id],
    }));

  return (
    <div className="space-y-2">
      <TreeMultiCombobox
        aria-label={t("Genres & Moods")}
        placeholder={isLoading ? t("Loading…") : t("Any Genres & Moods")}
        searchPlaceholder={t("Search Genres & Moods…")}
        emptyText={t("No entries found.")}
        options={genreMoodNodesToOptions(tree)}
        values={value.genreMoodIds}
        onValuesChange={genreMoodIds =>
          onChange({
            ...value,
            genreMoodIds,
            cascadeGenreMoodIds: pruneCascadeIds(value.cascadeGenreMoodIds, genreMoodIds),
          })}
        cascadeValues={effectiveCascadeIds(value.genreMoodIds, value.cascadeGenreMoodIds, false)}
        onToggleCascade={id =>
          onChange({
            ...value,
            cascadeGenreMoodIds: toggleCascadeId(value.genreMoodIds, value.cascadeGenreMoodIds, id, false),
          })}
        createOption={create.createOption}
      />
      {create.modal}
      <p className="text-xs text-muted-foreground">
        {t("Check “+ children” on a parent entry to also match bookmarks with its child entries; leave it unchecked for an exact match.")}
      </p>
    </div>
  );
}
