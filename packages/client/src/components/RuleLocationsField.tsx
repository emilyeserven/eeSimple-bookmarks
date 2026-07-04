import type { LocationNode } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { LocationPickerWithCreate } from "./LocationPickerWithCreate";

import { Label } from "@/components/ui/label";

interface RuleLocationsFieldProps {
  locationTree: LocationNode[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** "Apply locations" labelled location picker for the autofill rule prefill section. */
export function RuleLocationsField({
  locationTree, selectedIds, onToggle,
}: RuleLocationsFieldProps) {
  const {
    t,
  } = useTranslation();

  return (
    <div className="space-y-1">
      <Label>{t("Apply locations")}</Label>
      <LocationPickerWithCreate
        tree={locationTree}
        selectedIds={selectedIds}
        onToggle={onToggle}
      />
    </div>
  );
}
