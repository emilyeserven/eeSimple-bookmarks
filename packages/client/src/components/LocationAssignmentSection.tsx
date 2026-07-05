import type { LocationAssignmentOwnerType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "./LabeledSection";
import { LocationPicker } from "./LocationPicker";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useOwnerLocations, useSetOwnerLocations } from "../hooks/useLocationAssignments";
import { useLocationTree } from "../hooks/useLocations";
import { notifyError, notifySuccess } from "../lib/notifications";

interface LocationAssignmentSectionProps {
  /** Which kind of owner these Locations attach to (`movie`, `book`, …). */
  ownerType: LocationAssignmentOwnerType;
  /** The owner entity's id. */
  ownerId: string;
  title?: string;
  description?: string;
}

/**
 * Reusable "Locations" attach picker, auto-saving on change. Dropped into a media taxonomy entity's
 * edit surface to attach Location terms to that owner.
 */
export function LocationAssignmentSection({
  ownerType,
  ownerId,
  title: titleProp,
  description: descriptionProp,
}: LocationAssignmentSectionProps) {
  const {
    t,
  } = useTranslation();
  const title = titleProp ?? t("Locations");
  const description = descriptionProp ?? t("Locations associated with this item.");
  const {
    data: tree = [],
  } = useLocationTree();
  const {
    data: assigned = [],
  } = useOwnerLocations(ownerType, ownerId);
  const setAssignments = useSetOwnerLocations(ownerType, ownerId);
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

  const create = useEntityCreateOption("location", created => save([...values, created.id]));

  return (
    <LabeledSection
      title={title}
      description={description}
    >
      <LocationPicker
        tree={tree}
        selectedIds={values}
        onToggle={(id) => {
          save(values.includes(id) ? values.filter(value => value !== id) : [...values, id]);
        }}
        createOption={create.createOption}
      />
      {create.modal}
    </LabeledSection>
  );
}
