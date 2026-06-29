import type { ComboboxOption } from "./Combobox";
import type { Location, LocationNode, UpdateLocationInput } from "@eesimple/types";

import { useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { locationSchema } from "./locationFormSchema";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useLocationTree, useUpdateLocation } from "../hooks/useLocations";
import { useTagTree } from "../hooks/useTags";
import { useAppForm } from "../lib/form";
import { flattenTree, subtreeIds, tagNodesToOptions } from "../lib/tagTree";

import { Label } from "@/components/ui/label";

/** Sentinel for the "(root)" option; an empty value reads as "no selection" in the combobox. */
const ROOT = "__root__";

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
  sortOrder: "Sort order",
  parentId: "Parent",
  tagIds: "Tags",
};

interface LocationGeneralFormProps {
  /** The location being edited (as a tree node). */
  node: LocationNode;
}

/** Edit a location's name, coordinates, metadata, parent, alternate names, and tags. Each field auto-saves. */
export function LocationGeneralForm({
  node,
}: LocationGeneralFormProps) {
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

  const forbiddenIds = new Set(subtreeIds(node));
  const parentOptions: ComboboxOption[] = [
    {
      value: ROOT,
      label: "(root)",
    },
    ...flattenTree(tree ?? [])
      .filter(item => !forbiddenIds.has(item.node.id))
      .map(item => ({
        value: item.node.id,
        label: item.node.name,
        depth: item.depth,
        searchAlias: item.node.romanizedName ?? undefined,
      })),
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

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            placeholder="Location name"
            onBlur={() => autoSave.saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming changes the slug; follow it so the edit page keeps resolving.
                onSuccess: (updated) => {
                  if (updated.slug !== node.slug) {
                    void navigate({
                      to: "/taxonomies/locations/$locationSlug/edit/general",
                      params: {
                        locationSlug: updated.slug,
                      },
                    });
                  }
                },
              },
            )}
          />
        )}
      </form.AppField>

      <form.AppField name="romanizedName">
        {field => (
          <field.TextField
            label="Romanized name"
            placeholder="Optional romanized form"
            onBlur={() => autoSave.saveField("romanizedName", field.state.value.trim())}
          />
        )}
      </form.AppField>

      <div
        className="
          grid gap-3
          sm:grid-cols-2
        "
      >
        <form.AppField name="latitude">
          {field => (
            <field.NumberField
              label="Latitude"
              onBlur={() => autoSave.saveField(
                "latitude",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
        <form.AppField name="longitude">
          {field => (
            <field.NumberField
              label="Longitude"
              onBlur={() => autoSave.saveField(
                "longitude",
                field.state.value,
                {
                  valid: field.state.meta.errors.length === 0,
                },
              )}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="mapUrl">
        {field => (
          <field.TextField
            label="Map URL"
            placeholder="https://maps.google.com/…"
            onBlur={() => autoSave.saveField("mapUrl", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <div
        className="
          grid gap-3
          sm:grid-cols-3
        "
      >
        <form.AppField name="plusCode">
          {field => (
            <field.TextField
              label="Plus code"
              placeholder="e.g. 8Q7XMP+2J"
              onBlur={() => autoSave.saveField("plusCode", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
        <form.AppField name="placeType">
          {field => (
            <field.TextField
              label="Place type"
              placeholder="e.g. city"
              onBlur={() => autoSave.saveField("placeType", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
        <form.AppField name="countryCode">
          {field => (
            <field.TextField
              label="Country code"
              placeholder="e.g. JP"
              onBlur={() => autoSave.saveField("countryCode", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
      </div>

      <form.AppField name="parent">
        {field => (
          <field.ComboboxField
            label="Parent"
            options={parentOptions}
            placeholder="Choose a parent"
            searchPlaceholder="Search locations…"
            emptyText="No locations found."
            onValueChange={value =>
              autoSave.saveField("parentId", value && value !== ROOT ? value : null)}
          />
        )}
      </form.AppField>

      <AlternateNamesEditor
        value={alternateNames}
        onChange={setAlternateNames}
        onCommit={next => autoSave.saveField("alternateNames", next)}
      />

      <div className="space-y-1">
        <Label htmlFor="location-tags">Tags</Label>
        <TreeMultiCombobox
          id="location-tags"
          aria-label="Tags"
          options={tagNodesToOptions(tagTree ?? [])}
          values={tagIds}
          onValuesChange={(next) => {
            setTagIds(next);
            autoSave.saveField("tagIds", next);
          }}
          placeholder="Select tags…"
          searchPlaceholder="Search tags…"
          emptyText="No tags found."
        />
        <p className="text-xs text-muted-foreground">
          Looser mood / biome tags associated with this location.
        </p>
      </div>
    </div>
  );
}
