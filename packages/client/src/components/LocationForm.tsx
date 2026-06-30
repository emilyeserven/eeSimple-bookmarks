import type { ComboboxOption } from "./Combobox";
import type { AncestorDraft } from "./locationFormSchema";
import type {
  CreateLocationInput,
  Location,
  LocationAlternateName,
  LocationBoundary,
} from "@eesimple/types";

import { useState } from "react";

import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { Combobox } from "./Combobox";
import { LocationAncestorChainEditor } from "./LocationAncestorChainEditor";
import { geocodedAncestorsToDrafts, splitAncestorChain } from "./locationFormSchema";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useCreateLocation, useCreateLocationChain, useLocationTree } from "../hooks/useLocations";
import { useTagTree } from "../hooks/useTags";
import { flattenTree, tagNodesToOptions } from "../lib/tagTree";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Sentinel for the "(root / no existing parent)" option. */
const ROOT = "__root__";

interface LocationFormProps {
  /** Called with the created leaf location so the opener can navigate to it. */
  onCreated?: (location: Location) => void;
}

/** Parse a free-text number input into `number | null` (blank → null). */
function parseCoord(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

/** Drop a draft ancestor's empty optional fields into a `CreateLocationInput`. */
function ancestorToInput(draft: AncestorDraft): CreateLocationInput {
  return {
    name: draft.name.trim(),
    romanizedName: draft.romanizedName?.trim() || null,
    latitude: draft.latitude,
    longitude: draft.longitude,
    mapUrl: draft.mapUrl,
    placeType: draft.placeType,
    countryCode: draft.countryCode,
  };
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
  const createLocation = useCreateLocation();
  const createChain = useCreateLocationChain();
  const {
    data: tree,
  } = useLocationTree();
  const {
    data: tagTree,
  } = useTagTree();

  const [name, setName] = useState("");
  const [romanizedName, setRomanizedName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [plusCode, setPlusCode] = useState("");
  const [placeType, setPlaceType] = useState("");
  const [countryCode, setCountryCode] = useState("");
  // Captured from a geocoding candidate (not user-editable); persisted so the location renders as an area.
  const [boundary, setBoundary] = useState<LocationBoundary | null>(null);
  const [parentId, setParentId] = useState<string>(ROOT);
  const [alternateNames, setAlternateNames] = useState<LocationAlternateName[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [ancestors, setAncestors] = useState<AncestorDraft[]>([]);

  const isPending = createLocation.isPending || createChain.isPending;
  const error = createLocation.error ?? createChain.error;

  // Existing locations as options, shared by the leaf parent picker and the ancestor-chain rows.
  const locationOptions: ComboboxOption[] = flattenTree(tree ?? []).map(item => ({
    value: item.node.id,
    label: item.node.name,
    depth: item.depth,
    romanized: item.node.romanizedName,
  }));
  const parentOptions: ComboboxOption[] = [
    {
      value: ROOT,
      label: "(no existing parent)",
    },
    ...locationOptions,
  ];

  const hasExistingParent = parentId !== ROOT && parentId !== "";
  // An existing ancestor row caps the chain: it anchors the top, the new rows below it are created.
  const {
    newAncestors, parentId: chainParentId,
  } = splitAncestorChain(ancestors);

  function baseInput(): CreateLocationInput {
    return {
      name: name.trim(),
      romanizedName: romanizedName.trim() || null,
      alternateNames: alternateNames.filter(a => a.value.trim().length > 0),
      latitude: parseCoord(latitude),
      longitude: parseCoord(longitude),
      mapUrl: mapUrl.trim() || null,
      plusCode: plusCode.trim() || null,
      placeType: placeType.trim() || null,
      countryCode: countryCode.trim() || null,
      boundary,
      tagIds,
    };
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim().length === 0) return;

    // An existing parent short-circuits the chain — just attach to it.
    if (hasExistingParent) {
      createLocation.mutate(
        {
          ...baseInput(),
          parentId,
        },
        {
          onSuccess: location => onCreated?.(location),
        },
      );
      return;
    }

    // Any entered ancestors (new) and/or a reused existing ancestor → create the leaf plus its
    // chain in one call, anchoring the top to the existing location when one was picked.
    if (newAncestors.length > 0 || chainParentId) {
      createChain.mutate(
        {
          location: baseInput(),
          ancestors: newAncestors.map(ancestorToInput),
          parentId: chainParentId,
        },
        {
          onSuccess: location => onCreated?.(location),
        },
      );
      return;
    }

    // Plain root location.
    createLocation.mutate(baseInput(), {
      onSuccess: location => onCreated?.(location),
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit}
    >
      <LocationLookupBox
        onSelect={(candidate) => {
          // Prefer the local/native name as the title; the English form goes to romanized name.
          setName(candidate.name);
          setRomanizedName(candidate.romanizedName ?? "");
          if (candidate.latitude != null) setLatitude(String(candidate.latitude));
          if (candidate.longitude != null) setLongitude(String(candidate.longitude));
          if (candidate.mapUrl) setMapUrl(candidate.mapUrl);
          if (candidate.countryCode) setCountryCode(candidate.countryCode);
          if (candidate.placeType) setPlaceType(candidate.placeType);
          setBoundary(candidate.boundary);
          // Auto-fill the ancestor chain from the geocoded hierarchy, reusing existing locations
          // where one matches by name. Reset the explicit parent so the filled chain is shown and
          // used (an existing parent short-circuits the chain on submit).
          setParentId(ROOT);
          setAncestors(geocodedAncestorsToDrafts(candidate.ancestors, locationOptions.map(option => ({
            id: option.value,
            name: option.label,
            romanizedName: option.romanized,
          }))));
        }}
      />

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
          <Input
            id="location-place-type"
            placeholder="e.g. city"
            value={placeType}
            onChange={event => setPlaceType(event.target.value)}
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
          options={tagNodesToOptions(tagTree ?? [])}
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
