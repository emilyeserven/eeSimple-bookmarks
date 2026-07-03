import type { GenreMoodCondition } from "@eesimple/types";

import { MultiCombobox } from "../MultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useGenreMoodTree } from "@/hooks/useGenreMoods";
import { genreMoodTreeComboboxOptions } from "@/lib/comboboxOptions";

interface GenreMoodConditionEditorProps {
  value: GenreMoodCondition;
  onChange: (next: GenreMoodCondition) => void;
}

/** Controlled multi-select editor for a "Genres & Moods is one of …" condition. */
export function GenreMoodConditionEditor({
  value, onChange,
}: GenreMoodConditionEditorProps) {
  const {
    data: tree = [], isLoading,
  } = useGenreMoodTree();
  const create = useEntityCreateOption("genre-mood", genreMood =>
    onChange({
      ...value,
      genreMoodIds: [...value.genreMoodIds, genreMood.id],
    }));

  return (
    <>
      <MultiCombobox
        aria-label="Genres & Moods"
        placeholder={isLoading ? "Loading…" : "Any Genres & Moods"}
        searchPlaceholder="Search Genres & Moods…"
        emptyText="No entries found."
        options={genreMoodTreeComboboxOptions(tree)}
        values={value.genreMoodIds}
        onValuesChange={genreMoodIds =>
          onChange({
            ...value,
            genreMoodIds,
          })}
        createOption={create.createOption}
      />
      {create.modal}
    </>
  );
}
