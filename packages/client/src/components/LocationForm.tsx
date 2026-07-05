import type { DraftEntityName } from "./entityNames/draftEntityName";
import type { Location } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AddTagModal } from "./AddTagModal";
import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { Combobox } from "./Combobox";
import { entriesFromDrafts } from "./entityNames/draftEntityName";
import { EntityNamesEditor } from "./entityNames/EntityNamesEditor";
import { LocationAncestorChainEditor } from "./LocationAncestorChainEditor";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { ROOT, useLocationForm } from "./useLocationForm";
import { useCreateEntityNames } from "../hooks/useEntityNames";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LocationFormProps {
  /** Called with the created leaf location so the opener can navigate to it. */
  onCreated?: (location: Location) => void;
}

/**
 * Submit-driven create form for a location. Supports a "Look up location" geocoder search that
 * prefills the fields, an existing-parent picker, and an ancestor-chain editor (immediate-parent-first
 * up to the root). On submit: an existing parent → `useCreateLocation` with `parentId`; otherwise any
 * entered ancestors → `useCreateLocationChain`; otherwise a plain root `useCreateLocation`.
 *
 * The Place Type and Tag pickers here intentionally use the manual `useState` + `Add*Modal` pattern
 * rather than `useEntityCreateOption` — `AddLocationModal` wraps this component, and
 * `useEntityCreateOption`'s registry imports `AddLocationModal` for the `"location"` entry, so this
 * form calling the hook would create an import cycle (`AddLocationModal` → `LocationForm` →
 * `useEntityCreateOption` → `AddLocationModal`).
 */
export function LocationForm({
  onCreated,
}: LocationFormProps) {
  const {
    t,
  } = useTranslation();
  const [nameDrafts, setNameDrafts] = useState<DraftEntityName[]>([]);
  const createNames = useCreateEntityNames();
  const {
    name, setName,
    latitude, setLatitude,
    longitude, setLongitude,
    mapUrl, setMapUrl,
    plusCode, setPlusCode,
    placeType, setPlaceType,
    countryCode, setCountryCode,
    wikidataId,
    usesWikidataCoordinates, setUsesWikidataCoordinates,
    parentId, setParentId,
    alternateNames, setAlternateNames,
    tagIds, setTagIds,
    ancestors, setAncestors,
    isPending,
    error,
    locationOptions,
    parentOptions,
    placeTypeOptions,
    tagOptions,
    hasExistingParent,
    handleSubmit,
    applyCandidate,
  } = useLocationForm((location) => {
    const entries = entriesFromDrafts(nameDrafts);
    if (entries.length > 0) {
      createNames.mutate({
        ownerType: "location",
        ownerId: location.id,
        entries,
      });
    }
    onCreated?.(location);
  });

  const [addPlaceTypeOpen, setAddPlaceTypeOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <LocationLookupBox onSelect={applyCandidate} />

      <div className="space-y-1">
        <Label htmlFor="location-name">{t("Name")}</Label>
        <Input
          id="location-name"
          placeholder={t("Location name")}
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesEditor
          value={nameDrafts}
          onChange={setNameDrafts}
        />
      </div>

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <div className="space-y-1">
          <Label htmlFor="location-latitude">{t("Latitude")}</Label>
          <Input
            id="location-latitude"
            type="number"
            value={latitude}
            onChange={event => setLatitude(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-longitude">{t("Longitude")}</Label>
          <Input
            id="location-longitude"
            type="number"
            value={longitude}
            onChange={event => setLongitude(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location-map-url">{t("Map URL")}</Label>
        <Input
          id="location-map-url"
          placeholder="https://maps.google.com/…"
          value={mapUrl}
          onChange={event => setMapUrl(event.target.value)}
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox
          id="location-uses-wikidata-coordinates"
          checked={usesWikidataCoordinates}
          onCheckedChange={value => setUsesWikidataCoordinates(value === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="location-uses-wikidata-coordinates">{t("Uses Wikidata for coordinates")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Auto-checked when a Wikidata search result is picked above")}
            {wikidataId ? ` (${wikidataId})` : ""}
            {t(
              ". When checked, future coordinate/area refreshes query Wikidata only — Nominatim is skipped.",
            )}
          </p>
        </div>
      </div>

      <div
        className="
          grid gap-3
          sm:grid-cols-3
        "
      >
        <div className="space-y-1">
          <Label htmlFor="location-plus-code">{t("Plus code")}</Label>
          <Input
            id="location-plus-code"
            value={plusCode}
            onChange={event => setPlusCode(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-place-type">{t("Place type")}</Label>
          <Combobox
            id="location-place-type"
            aria-label={t("Place type")}
            options={placeTypeOptions}
            value={placeType || undefined}
            onValueChange={value => setPlaceType(value ?? "")}
            placeholder={t("Select a place type…")}
            searchPlaceholder={t("Search place types…")}
            emptyText={t("No place types found.")}
            createOption={{
              label: t("Create place type"),
              onSelect: () => setAddPlaceTypeOpen(true),
            }}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-country">{t("Country code")}</Label>
          <Input
            id="location-country"
            placeholder="e.g. JP"
            value={countryCode}
            onChange={event => setCountryCode(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location-parent">{t("Existing parent")}</Label>
        <Combobox
          id="location-parent"
          aria-label={t("Existing parent")}
          options={parentOptions}
          value={parentId}
          onValueChange={value => setParentId(value ?? ROOT)}
          placeholder={t("Choose an existing parent")}
          searchPlaceholder={t("Search locations…")}
          emptyText={t("No locations found.")}
        />
        <p className="text-xs text-muted-foreground">
          {t(
            "Pick an existing location to nest under it. Leave as “no existing parent” to build the ancestor chain below instead — where each level can also reuse an existing location.",
          )}
        </p>
      </div>

      {!hasExistingParent
        ? (
          <LocationAncestorChainEditor
            value={ancestors}
            onChange={setAncestors}
            existingOptions={locationOptions}
          />
        )
        : null}

      <AlternateNamesEditor
        value={alternateNames}
        onChange={setAlternateNames}
      />

      <div className="space-y-1">
        <Label htmlFor="location-tags">{t("Tags")}</Label>
        <TreeMultiCombobox
          id="location-tags"
          aria-label={t("Tags")}
          options={tagOptions}
          values={tagIds}
          onValuesChange={setTagIds}
          placeholder={t("Select tags…")}
          searchPlaceholder={t("Search tags…")}
          emptyText={t("No tags found.")}
          createOption={{
            label: t("Create tag"),
            onSelect: () => setAddTagOpen(true),
          }}
        />
      </div>
      <AddPlaceTypeModal
        open={addPlaceTypeOpen}
        onOpenChange={setAddPlaceTypeOpen}
        onCreated={pt => setPlaceType(pt.slug)}
      />
      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={tag => setTagIds(prev => (prev.includes(tag.id) ? prev : [...prev, tag.id]))}
      />

      <Button
        type="submit"
        disabled={isPending || name.trim().length === 0}
      >
        {isPending ? t("Creating…") : t("Create location")}
      </Button>

      {error
        ? <p className="text-xs text-destructive">{error.message}</p>
        : null}
    </form>
  );
}
