import type { ComboboxOption } from "./Combobox";
import type { Location, LocationLookupCandidate, LocationNode, UpdateLocationInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { locationSchema } from "./locationFormSchema";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useLocationTree, useUpdateLocation } from "../hooks/useLocations";
import { useTagTree } from "../hooks/useTags";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { useAppForm } from "../lib/form";
import { placeTypeChoices } from "../lib/locationLevels";
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
  sortOrder: "Sort order",
  parentId: "Parent",
  tagIds: "Tags",
};

/**
 * Owns the stateful pieces of the location General (edit) form: the autosave engine, the local
 * alternate-names + tag state, the location/tag tree queries (resolved to picker options), the
 * geocoding-lookup save, and the field-save handlers. Returns one bag so `LocationGeneralForm`
 * stays a presentational shell.
 */
export function useLocationGeneralForm(node: LocationNode) {
  const navigate = useNavigate();
  const updateLocation = useUpdateLocation();
  const {
    data: tree,
  } = useLocationTree();
  const {
    data: tagTree,
  } = useTagTree();
  const [alternateNames, setAlternateNames] = useState(node.alternateNames);
  const [tagIds, setTagIds] = useState<string[]>(node.tagIds ?? []);

  const autoSave = useFieldAutoSave<UpdateLocationInput, Location>({
    id: node.id,
    update: updateLocation,
    labels: LABELS,
    initial: {
      name: node.name,
      romanizedName: node.romanizedName ?? "",
      alternateNames: node.alternateNames,
      latitude: node.latitude ?? 0,
      longitude: node.longitude ?? 0,
      mapUrl: node.mapUrl ?? "",
      plusCode: node.plusCode ?? "",
      placeType: node.placeType ?? "",
      countryCode: node.countryCode ?? "",
      parentId: node.parentId,
      tagIds: node.tagIds ?? [],
    },
  });

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

  // Every location (flat), used to offer the distinct place types already in use as picker choices.
  const allLocations = flattenTree(tree ?? []).map(item => item.node);

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
    defaultValues: {
      name: node.name,
      romanizedName: node.romanizedName ?? "",
      latitude: node.latitude ?? 0,
      longitude: node.longitude ?? 0,
      mapUrl: node.mapUrl ?? "",
      plusCode: node.plusCode ?? "",
      placeType: node.placeType ?? "",
      countryCode: node.countryCode ?? "",
      parent: node.parentId ?? ROOT,
    },
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
    existingOptions,
    parentOptions,
    placeTypeChoices: placeTypeChoices(allLocations, node.placeType),
    tagOptions: tagNodesToOptions(tagTree ?? []),
    saveField: autoSave.saveField,
    followSlug,
    applyLookup,
  };
}
