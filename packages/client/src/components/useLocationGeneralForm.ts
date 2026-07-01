import type { ComboboxOption } from "./Combobox";
import type { Location, LocationLookupCandidate, LocationNode, UpdateLocationInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { locationSchema } from "./locationFormSchema";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import {
  useAutofillLocationWikipediaLinks,
  useLocationTree,
  useRefreshLocationCoordinates,
  useUpdateLocation,
} from "../hooks/useLocations";
import { usePlaceTypes } from "../hooks/usePlaceTypes";
import { useTagTree } from "../hooks/useTags";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds, tagNodesToOptions } from "../lib/tagTree";

/** Sentinel for the "(root)" option; an empty value reads as "no selection" in the combobox. */
export const ROOT = "__root__";

const LABELS: Record<keyof UpdateLocationInput, string> = {
  name: "Name",
  romanizedName: "Romanized name",
  alternateNames: "Alternate names",
  latitude: "Latitude",
  longitude: "Longitude",
  mapUrl: "Map URL",
  plusCode: "Plus code",
  placeType: "Place type",
  countryCode: "Country code",
  // Not an editable field — captured from geocoding / backfilled on demand; listed to satisfy the
  // exhaustive key map.
  boundary: "Boundary",
  wikidataId: "Wikidata ID",
  usesWikidataCoordinates: "Uses Wikidata coordinates",
  officialLink: "Official link",
  wikipediaLinkEn: "Wikipedia link (EN)",
  wikipediaLinkLocal: "Wikipedia link (Local)",
  sortOrder: "Sort order",
  parentId: "Parent",
  tagIds: "Tags",
};

/**
 * The editable text/number fields shared by the autosave snapshot and the form defaults, with each
 * nullable column resolved to its blank/zero fallback. Pulled to module scope (and unit-tested) so
 * the `??` chains don't inflate the hook's cognitive complexity.
 */
function locationEditableDefaults(node: LocationNode) {
  return {
    name: node.name,
    romanizedName: node.romanizedName ?? "",
    latitude: node.latitude ?? 0,
    longitude: node.longitude ?? 0,
    mapUrl: node.mapUrl ?? "",
    plusCode: node.plusCode ?? "",
    placeType: node.placeType ?? "",
    countryCode: node.countryCode ?? "",
    officialLink: node.officialLink ?? "",
    wikipediaLinkEn: node.wikipediaLinkEn ?? "",
    wikipediaLinkLocal: node.wikipediaLinkLocal ?? "",
  };
}

/** The autosave engine's initial snapshot for a location (see {@link locationEditableDefaults}). */
export function buildLocationAutoSaveInitial(node: LocationNode): UpdateLocationInput {
  return {
    ...locationEditableDefaults(node),
    alternateNames: node.alternateNames,
    parentId: node.parentId,
    tagIds: node.tagIds ?? [],
  };
}

/** The edit form's default values for a location (the `parent` combobox uses the ROOT sentinel). */
export function buildLocationFormDefaults(node: LocationNode) {
  return {
    ...locationEditableDefaults(node),
    parent: node.parentId ?? ROOT,
  };
}

/** The local (non-autosaved-immediately) field state of the edit form, grouped to spread hook density. */
function useLocationEditState(node: LocationNode) {
  const [alternateNames, setAlternateNames] = useState(node.alternateNames);
  const [tagIds, setTagIds] = useState<string[]>(node.tagIds ?? []);
  const [addPlaceTypeOpen, setAddPlaceTypeOpen] = useState(false);
  const [wikidataId, setWikidataId] = useState<string | null>(node.wikidataId);
  const [usesWikidataCoordinates, setUsesWikidataCoordinates] = useState(node.usesWikidataCoordinates);
  return {
    alternateNames,
    setAlternateNames,
    tagIds,
    setTagIds,
    addPlaceTypeOpen,
    setAddPlaceTypeOpen,
    wikidataId,
    setWikidataId,
    usesWikidataCoordinates,
    setUsesWikidataCoordinates,
  };
}

/**
 * Owns the stateful pieces of the location General (edit) form: the autosave engine, the local
 * alternate-names + tag state, the location/tag tree queries (resolved to picker options), the
 * geocoding-lookup save, and the field-save handlers. Returns one bag so `LocationGeneralForm`
 * stays a presentational shell.
 */
export function useLocationGeneralForm(node: LocationNode) {
  const navigate = useNavigate();
  const updateLocation = useUpdateLocation();
  const refreshCoordinatesMutation = useRefreshLocationCoordinates();
  const autofillWikipediaLinksMutation = useAutofillLocationWikipediaLinks();
  const {
    data: tree,
  } = useLocationTree();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: placeTypesData,
  } = usePlaceTypes();
  const {
    alternateNames, setAlternateNames, tagIds, setTagIds, addPlaceTypeOpen, setAddPlaceTypeOpen,
    wikidataId, setWikidataId, usesWikidataCoordinates, setUsesWikidataCoordinates,
  } = useLocationEditState(node);

  const autoSave = useFieldAutoSave<UpdateLocationInput, Location>({
    id: node.id,
    update: updateLocation,
    labels: LABELS,
    initial: buildLocationAutoSaveInitial(node),
  });

  function saveUsesWikidataCoordinates(next: boolean): void {
    setUsesWikidataCoordinates(next);
    autoSave.saveField("usesWikidataCoordinates", next);
  }

  // The slug derives from the name/romanized name; when a save moves it, follow it so the edit
  // page keeps resolving.
  const followSlug = (updated: Location) => {
    if (updated.slug !== node.slug) {
      void navigate({
        to: "/taxonomies/locations/$locationSlug/edit/general",
        params: {
          locationSlug: updated.slug,
        },
      });
    }
  };

  const forbiddenIds = new Set(subtreeIds(node));
  // Existing locations selectable as this node's parent / ancestors — its own subtree is excluded so
  // a reparent can't put it under itself or a descendant. Shared by the Parent picker and the
  // ancestor-chain section below.
  const existingOptions: ComboboxOption[] = flattenTree(tree ?? [])
    .filter(item => !forbiddenIds.has(item.node.id))
    .map(item => ({
      value: item.node.id,
      label: item.node.name,
      depth: item.depth,
      romanized: item.node.romanizedName,
    }));
  const parentOptions: ComboboxOption[] = [
    {
      value: ROOT,
      label: "(root)",
    },
    ...existingOptions,
  ];

  const form = useAppForm({
    defaultValues: buildLocationFormDefaults(node),
    validators: {
      onChange: locationSchema,
    },
  });

  function applyLookup(candidate: LocationLookupCandidate): void {
    // Autograb the geocoded fields into the form…
    if (candidate.latitude != null) form.setFieldValue("latitude", candidate.latitude);
    if (candidate.longitude != null) form.setFieldValue("longitude", candidate.longitude);
    if (candidate.mapUrl) form.setFieldValue("mapUrl", candidate.mapUrl);
    if (candidate.countryCode) form.setFieldValue("countryCode", candidate.countryCode);
    if (candidate.placeType) form.setFieldValue("placeType", candidate.placeType);
    setWikidataId(candidate.wikidataId);
    // A Wikidata-sourced candidate auto-checks "Uses Wikidata for coordinates"; a Nominatim one
    // un-checks it (picking a fresh candidate resets the source).
    const usesWikidata = candidate.wikidataId != null;
    setUsesWikidataCoordinates(usesWikidata);
    // …and persist them together in one save with a single toast (the multi-key pattern).
    updateLocation.mutate(
      {
        id: node.id,
        input: {
          latitude: candidate.latitude,
          longitude: candidate.longitude,
          mapUrl: candidate.mapUrl ?? undefined,
          countryCode: candidate.countryCode ?? undefined,
          placeType: candidate.placeType ?? undefined,
          wikidataId: candidate.wikidataId,
          usesWikidataCoordinates: usesWikidata,
        },
      },
      {
        onSuccess: () => notifyFieldSaved("Location coordinates"),
        onError: error => notifyFieldSaveError(
          "Location coordinates",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  function repullCoordinates(): void {
    refreshCoordinatesMutation.mutate(
      {
        id: node.id,
        usesWikidataCoordinates,
      },
      {
        onSuccess: (updated) => {
          if (updated.latitude != null) form.setFieldValue("latitude", updated.latitude);
          if (updated.longitude != null) form.setFieldValue("longitude", updated.longitude);
          if (updated.mapUrl) form.setFieldValue("mapUrl", updated.mapUrl);
          notifyFieldSaved("Coordinates");
        },
        onError: error => notifyFieldSaveError(
          "Coordinates",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  function autofillWikipediaLinks(): void {
    autofillWikipediaLinksMutation.mutate(
      {
        id: node.id,
      },
      {
        onSuccess: (updated) => {
          form.setFieldValue("wikipediaLinkEn", updated.wikipediaLinkEn ?? "");
          form.setFieldValue("wikipediaLinkLocal", updated.wikipediaLinkLocal ?? "");
          if (updated.wikipediaLinkEn || updated.wikipediaLinkLocal) {
            notifyFieldSaved("Wikipedia links");
          }
          else {
            notifyFieldSaveError("Wikipedia links", "No matching Wikipedia article was found");
          }
        },
        onError: error => notifyFieldSaveError(
          "Wikipedia links",
          error instanceof Error ? error.message : undefined,
        ),
      },
    );
  }

  function saveTagIds(next: string[]): void {
    setTagIds(next);
    autoSave.saveField("tagIds", next);
  }

  return {
    form,
    alternateNames,
    setAlternateNames,
    tagIds,
    saveTagIds,
    wikidataId,
    usesWikidataCoordinates,
    saveUsesWikidataCoordinates,
    existingOptions,
    parentOptions,
    placeTypeChoices: (placeTypesData ?? []).map(pt => ({
      value: pt.slug,
      label: pt.name,
    })),
    tagOptions: tagNodesToOptions(tagTree ?? []),
    saveField: autoSave.saveField,
    followSlug,
    applyLookup,
    repullCoordinates,
    isRepullingCoordinates: refreshCoordinatesMutation.isPending,
    autofillWikipediaLinks,
    isAutofillingWikipediaLinks: autofillWikipediaLinksMutation.isPending,
    addPlaceTypeOpen,
    setAddPlaceTypeOpen,
  };
}
