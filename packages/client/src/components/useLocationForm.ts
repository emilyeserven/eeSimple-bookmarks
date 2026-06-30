import type { ComboboxOption } from "./Combobox";
import type { AncestorDraft } from "./locationFormSchema";
import type {
  CreateLocationInput,
  Location,
  LocationAlternateName,
  LocationBoundary,
  LocationLookupCandidate,
} from "@eesimple/types";

import { useState } from "react";

import { ancestorToInput, geocodedAncestorsToDrafts, splitAncestorChain } from "./locationFormSchema";
import { useCreateLocation, useCreateLocationChain, useLocationTree } from "../hooks/useLocations";
import { useTagTree } from "../hooks/useTags";
import { placeTypeChoices } from "../lib/locationLevels";
import { flattenTree, tagNodesToOptions } from "../lib/tagTree";

/** Sentinel for the "(root / no existing parent)" option. */
export const ROOT = "__root__";

/** Parse a free-text number input into `number | null` (blank → null). */
function parseCoord(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  return Number.isNaN(n) ? null : n;
}

/**
 * Owns every stateful piece of the location create form: the create mutations, the field state, the
 * geocoder prefill, the derived option lists, and the submit handler. Returns one bag so
 * `LocationForm` stays a presentational shell.
 */
export function useLocationForm(onCreated?: (location: Location) => void) {
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

  // Every location (flat), used to offer the distinct place types already in use as picker choices.
  const allLocations = flattenTree(tree ?? []).map(item => item.node);

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

  const placeTypeOptions = placeTypeChoices(allLocations, placeType);
  const tagOptions = tagNodesToOptions(tagTree ?? []);

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

  /** Apply a geocoding candidate's fields to the form. */
  function applyCandidate(candidate: LocationLookupCandidate): void {
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
  }

  return {
    name,
    setName,
    romanizedName,
    setRomanizedName,
    latitude,
    setLatitude,
    longitude,
    setLongitude,
    mapUrl,
    setMapUrl,
    plusCode,
    setPlusCode,
    placeType,
    setPlaceType,
    countryCode,
    setCountryCode,
    parentId,
    setParentId,
    alternateNames,
    setAlternateNames,
    tagIds,
    setTagIds,
    ancestors,
    setAncestors,
    isPending,
    error,
    locationOptions,
    parentOptions,
    placeTypeOptions,
    tagOptions,
    hasExistingParent,
    handleSubmit,
    applyCandidate,
  };
}
