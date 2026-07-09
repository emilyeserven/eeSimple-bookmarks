import type { LocationCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LocationPickerWithCreate } from "../LocationPickerWithCreate";

import { useLocationTree } from "@/hooks/useLocations";
import { effectiveCascadeIds, pruneCascadeIds, toggleCascadeId } from "@/lib/conditionCascade";

interface LocationConditionEditorProps {
  value: LocationCondition;
  onChange: (next: LocationCondition) => void;
}

/**
 * Controlled editor for a "located in …" condition. A selected **parent** location shows a
 * "+ children" checkbox: checked = also match bookmarks in any descendant location (cascade),
 * unchecked = exact.
 */
export function LocationConditionEditor({
  value, onChange,
}: LocationConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: locationTree = [],
  } = useLocationTree();

  return (
    <div className="space-y-2">
      <LocationPickerWithCreate
        tree={locationTree}
        selectedIds={value.locationIds}
        onToggle={(id) => {
          const next = value.locationIds.includes(id)
            ? value.locationIds.filter(locationId => locationId !== id)
            : [...value.locationIds, id];
          onChange({
            ...value,
            locationIds: next,
            cascadeLocationIds: pruneCascadeIds(value.cascadeLocationIds, next),
          });
        }}
        cascadeValues={effectiveCascadeIds(value.locationIds, value.cascadeLocationIds, true)}
        onToggleCascade={id =>
          onChange({
            ...value,
            cascadeLocationIds: toggleCascadeId(value.locationIds, value.cascadeLocationIds, id, true),
          })}
      />
      <p className="text-xs text-muted-foreground">
        {t("Check “+ children” on a parent location to also match bookmarks in its child locations; leave it unchecked for an exact match.")}
      </p>
    </div>
  );
}
