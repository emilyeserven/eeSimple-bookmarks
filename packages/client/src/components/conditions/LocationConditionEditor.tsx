import type { LocationCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LocationPickerWithCreate } from "../LocationPickerWithCreate";

import { useLocationTree } from "@/hooks/useLocations";

interface LocationConditionEditorProps {
  value: LocationCondition;
  onChange: (next: LocationCondition) => void;
}

/** Controlled editor for a "located in …" condition. Selecting a parent matches its descendants. */
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
          });
        }}
      />
      <p className="text-xs text-muted-foreground">
        {t("Selecting a parent location also matches bookmarks in its child locations.")}
      </p>
    </div>
  );
}
