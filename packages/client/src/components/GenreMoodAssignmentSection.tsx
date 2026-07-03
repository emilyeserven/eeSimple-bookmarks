import type { GenreMoodOwnerType } from "@eesimple/types";

import { LabeledSection } from "./LabeledSection";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useOwnerGenreMoods, useSetOwnerGenreMoods } from "../hooks/useGenreMoodAssignments";
import { useGenreMoodTree } from "../hooks/useGenreMoods";
import { genreMoodTreeComboboxOptions } from "../lib/comboboxOptions";
import { notifyError, notifySuccess } from "../lib/notifications";

interface GenreMoodAssignmentSectionProps {
  /** Which kind of owner these entries attach to (`bookmark`, `category`, `website`, …). */
  ownerType: GenreMoodOwnerType;
  /** The owner entity's id. */
  ownerId: string;
  /** An entry id to exclude from the picker (e.g. the entry being edited, so it can't self-attach). */
  excludeId?: string;
  title?: string;
  description?: string;
}

/**
 * Reusable "Genres & Moods" attach picker, auto-saving on change. Dropped into any taxonomy entity's
 * edit surface (and the bookmark form) to attach Genres & Moods entries to that owner.
 */
export function GenreMoodAssignmentSection({
  ownerType,
  ownerId,
  excludeId,
  title = "Genres & Moods",
  description = "Genres & Moods associated with this item.",
}: GenreMoodAssignmentSectionProps) {
  const {
    data: tree = [],
  } = useGenreMoodTree();
  const {
    data: assigned = [],
  } = useOwnerGenreMoods(ownerType, ownerId);
  const setAssignments = useSetOwnerGenreMoods(ownerType, ownerId);
  const values = assigned.map(entry => entry.id);

  const save = (next: string[]) => {
    setAssignments.mutate(next, {
      onSuccess: () => notifySuccess(`${title} saved`),
      onError: () => notifyError(`Couldn't save ${title.toLowerCase()}`),
    });
  };

  const create = useEntityCreateOption("genre-mood", created => save([...values, created.id]));
  const options = genreMoodTreeComboboxOptions(
    tree,
    excludeId ? new Set([excludeId]) : undefined,
  );

  return (
    <LabeledSection
      title={title}
      description={description}
    >
      <MultiCombobox
        aria-label={title}
        placeholder="Add Genres & Moods…"
        searchPlaceholder="Search Genres & Moods…"
        emptyText="No entries found."
        options={options}
        values={values}
        onValuesChange={save}
        createOption={create.createOption}
      />
      {create.modal}
    </LabeledSection>
  );
}
