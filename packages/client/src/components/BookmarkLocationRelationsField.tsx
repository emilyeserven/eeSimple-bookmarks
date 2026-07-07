import type { LocationNode } from "@eesimple/types";

import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useLocationRelations } from "../hooks/useLocationRelations";
import { flattenTree } from "../lib/tagTree";

import { Label } from "@/components/ui/label";

interface BookmarkLocationRelationsFieldProps {
  /** The bookmark's currently-selected location ids (one relation row is shown per id). */
  locationIds: string[];
  /** Full location tree, used to resolve each selected location's name. */
  locationTree: LocationNode[];
  /** Current `locationId → relationId | null` map. */
  value: Record<string, string | null>;
  /** Called with the next map whenever a per-location relation changes. */
  onChange: (next: Record<string, string | null>) => void;
}

/**
 * Per-location "how does this bookmark relate to it?" editor. For each assigned location it shows a
 * Location Relation combobox (with inline create), writing a `locationId → relationId | null` map.
 * Renders nothing when the bookmark has no locations.
 */
export function BookmarkLocationRelationsField({
  locationIds,
  locationTree,
  value,
  onChange,
}: BookmarkLocationRelationsFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: relations = [],
  } = useLocationRelations();

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const flat of flattenTree(locationTree)) map.set(flat.node.id, flat.node.name);
    return map;
  }, [locationTree]);

  const options = useMemo(
    () => relations.map(relation => ({
      value: relation.id,
      label: relation.name,
    })),
    [relations],
  );

  function setRelation(locationId: string, relationId: string | undefined) {
    onChange({
      ...value,
      [locationId]: relationId ?? null,
    });
  }

  if (locationIds.length === 0) return null;

  return (
    <div className="space-y-2">
      <Label>{t("Location relations")}</Label>
      <p className="text-xs text-muted-foreground">
        {t("How does this bookmark relate to each of its locations?")}
      </p>
      <div className="space-y-2">
        {locationIds.map(locationId => (
          <LocationRelationRow
            key={locationId}
            locationName={nameById.get(locationId) ?? locationId}
            options={options}
            value={value[locationId] ?? undefined}
            onValueChange={relationId => setRelation(locationId, relationId)}
          />
        ))}
      </div>
    </div>
  );
}

function LocationRelationRow({
  locationName,
  options,
  value,
  onValueChange,
}: {
  locationName: string;
  options: { value: string;
    label: string; }[];
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
}) {
  const {
    t,
  } = useTranslation();
  const relationCreate = useEntityCreateOption("location-relation", (relation) => {
    onValueChange(relation.id);
  });

  return (
    <div className="flex items-center gap-2">
      <span className="min-w-0 flex-1 truncate text-sm">{locationName}</span>
      <div className="w-56 shrink-0">
        <Combobox
          options={options}
          value={value}
          onValueChange={onValueChange}
          placeholder={t("No relation")}
          searchPlaceholder={t("Search relations…")}
          emptyText={t("No relations found.")}
          createOption={relationCreate.createOption}
        />
      </div>
      {relationCreate.modal}
    </div>
  );
}
