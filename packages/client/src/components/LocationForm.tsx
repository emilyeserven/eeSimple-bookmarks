import type { Location } from "@eesimple/types";

import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { Combobox } from "./Combobox";
import { LocationAncestorChainEditor } from "./LocationAncestorChainEditor";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { ROOT, useLocationForm } from "./useLocationForm";

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
 */
export function LocationForm({
  onCreated,
}: LocationFormProps) {
  const {
    name, setName,
    romanizedName, setRomanizedName,
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
  } = useLocationForm(onCreated);

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <LocationLookupBox onSelect={applyCandidate} />

      <div className="space-y-1">
        <Label htmlFor="location-name">Name</Label>
        <Input
          id="location-name"
          placeholder="Location name"
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="location-romanized">Romanized name</Label>
        <Input
          id="location-romanized"
          placeholder="Optional romanized form"
          value={romanizedName}
          onChange={event => setRomanizedName(event.target.value)}
        />
      </div>

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <div className="space-y-1">
          <Label htmlFor="location-latitude">Latitude</Label>
          <Input
            id="location-latitude"
            type="number"
            value={latitude}
            onChange={event => setLatitude(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-longitude">Longitude</Label>
          <Input
            id="location-longitude"
            type="number"
            value={longitude}
            onChange={event => setLongitude(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location-map-url">Map URL</Label>
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
          <Label htmlFor="location-uses-wikidata-coordinates">Uses Wikidata for coordinates</Label>
          <p className="text-xs text-muted-foreground">
            Auto-checked when a Wikidata search result is picked above
            {wikidataId ? ` (${wikidataId})` : ""}. When checked, future coordinate/area refreshes
            query Wikidata only — Nominatim is skipped.
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
          <Label htmlFor="location-plus-code">Plus code</Label>
          <Input
            id="location-plus-code"
            value={plusCode}
            onChange={event => setPlusCode(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-place-type">Place type</Label>
          <Combobox
            id="location-place-type"
            aria-label="Place type"
            options={placeTypeOptions}
            value={placeType || undefined}
            onValueChange={value => setPlaceType(value ?? "")}
            placeholder="Select a place type…"
            searchPlaceholder="Search place types…"
            emptyText="No place types found."
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="location-country">Country code</Label>
          <Input
            id="location-country"
            placeholder="e.g. JP"
            value={countryCode}
            onChange={event => setCountryCode(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="location-parent">Existing parent</Label>
        <Combobox
          id="location-parent"
          aria-label="Existing parent"
          options={parentOptions}
          value={parentId}
          onValueChange={value => setParentId(value ?? ROOT)}
          placeholder="Choose an existing parent"
          searchPlaceholder="Search locations…"
          emptyText="No locations found."
        />
        <p className="text-xs text-muted-foreground">
          Pick an existing location to nest under it. Leave as “no existing parent” to build the
          ancestor chain below instead — where each level can also reuse an existing location.
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
        <Label htmlFor="location-tags">Tags</Label>
        <TreeMultiCombobox
          id="location-tags"
          aria-label="Tags"
          options={tagOptions}
          values={tagIds}
          onValuesChange={setTagIds}
          placeholder="Select tags…"
          searchPlaceholder="Search tags…"
          emptyText="No tags found."
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || name.trim().length === 0}
      >
        {isPending ? "Creating…" : "Create location"}
      </Button>

      {error
        ? <p className="text-xs text-destructive">{error.message}</p>
        : null}
    </form>
  );
}
