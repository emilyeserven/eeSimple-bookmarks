import type { GenreMoodOwnerType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useOwnerGenreMoods, useSetOwnerGenreMoods } from "../hooks/useGenreMoodAssignments";
import { useGenreMoodTree } from "../hooks/useGenreMoods";
import { genreMoodTreeComboboxOptions } from "../lib/comboboxOptions";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Label } from "@/components/ui/label";

interface GenreMoodAssignmentSectionProps {
  /** Which kind of owner these entries attach to (`bookmark`, `category`, `website`, …). */
  ownerType: GenreMoodOwnerType;
  /** The owner entity's id. */
  ownerId: string;
  /** An entry id to exclude from the picker (e.g. the entry being edited, so it can't self-attach). */
  excludeId?: string;
  title?: string;
  description?: string;
  /**
   * Render as a plain stacked Label-then-combobox block (matching the bookmark edit form's other
   * fields) instead of the default two-column `LabeledSection` layout, and drop the default
   * description text. An explicit `description` still renders even when `stacked` is set.
   */
  stacked?: boolean;
}

/**
 * Reusable "Genres & Moods" attach picker, auto-saving on change. Dropped into any taxonomy entity's
 * edit surface (and the bookmark form) to attach Genres & Moods entries to that owner.
 */
export function GenreMoodAssignmentSection({
  ownerType,
  ownerId,
  excludeId,
  title: titleProp,
  description: descriptionProp,
  stacked,
}: GenreMoodAssignmentSectionProps) {
  const {
    t,
  } = useTranslation();
  const title = titleProp ?? t("Genres & Moods");
  const description = descriptionProp ?? (stacked ? undefined : t("Genres & Moods associated with this item."));
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
      onSuccess: () => notifySuccess(t("{{title}} saved", {
        title,
      })),
      onError: () => notifyError(t("Couldn't save {{title}}", {
        title: title.toLowerCase(),
      })),
    });
  };

  const create = useEntityCreateOption("genre-mood", created => save([...values, created.id]));
  const options = genreMoodTreeComboboxOptions(
    tree,
    excludeId ? new Set([excludeId]) : undefined,
  );

  const body = (
    <>
      <MultiCombobox
        aria-label={title}
        placeholder={t("Add Genres & Moods…")}
        searchPlaceholder={t("Search Genres & Moods…")}
        emptyText={t("No entries found.")}
        options={options}
        values={values}
        onValuesChange={save}
        createOption={create.createOption}
      />
      {create.modal}
    </>
  );

  if (stacked) {
    return (
      <div className="space-y-1">
        <Label>{title}</Label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
        {body}
      </div>
    );
  }

  return (
    <LabeledSection
      title={title}
      description={description}
    >
      {body}
    </LabeledSection>
  );
}
