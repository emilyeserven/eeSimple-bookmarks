import type { LocationNode } from "@eesimple/types";

import { RefreshCw } from "lucide-react";

import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { LocationAncestorsSection } from "./LocationAncestorsSection";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { ROOT, useLocationGeneralForm } from "./useLocationGeneralForm";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface LocationGeneralFormProps {
  /** The location being edited (as a tree node). */
  node: LocationNode;
}

/** Edit a location's name, coordinates, metadata, parent, alternate names, and tags. Each field auto-saves. */
export function LocationGeneralForm({
  node,
}: LocationGeneralFormProps) {
  const {
    form, alternateNames, setAlternateNames, tagIds, saveTagIds,
    wikidataId, usesWikidataCoordinates, saveUsesWikidataCoordinates,
    existingOptions, parentOptions, placeTypeChoices, tagOptions,
    saveField, followSlug, applyLookup,
    repullCoordinates, isRepullingCoordinates,
    autofillWikipediaLinks, isAutofillingWikipediaLinks,
    addPlaceTypeOpen, setAddPlaceTypeOpen,
  } = useLocationGeneralForm(node);

  return (
    <div className="space-y-4">
      <LocationLookupBox onSelect={applyLookup} />

      <form.AppField name="name">
        {field => (
          <field.TextField
            label="Name"
            placeholder="Location name"
            onBlur={() => saveField(
              "name",
              field.state.value.trim(),
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming can change the slug; follow it so the edit page keeps resolving.
                onSuccess: followSlug,
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
            // The slug derives from the romanized name, so a change here can move the slug too.
            onBlur={() => saveField(
              "romanizedName",
              field.state.value.trim(),
              {
                onSuccess: followSlug,
              },
            )}
          />
        )}
      </form.AppField>

      <div className="space-y-2">
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
                onBlur={() => saveField(
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
                onBlur={() => saveField(
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
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isRepullingCoordinates}
          onClick={repullCoordinates}
        >
          <RefreshCw
            className={isRepullingCoordinates
              ? "mr-2 size-3.5 animate-spin"
              : "mr-2 size-3.5"}
          />
          {isRepullingCoordinates ? "Re-geocoding…" : "Re-geocode"}
        </Button>
      </div>

      <form.AppField name="mapUrl">
        {field => (
          <field.TextField
            label="Map URL"
            placeholder="https://maps.google.com/…"
            onBlur={() => saveField("mapUrl", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <div className="flex items-start gap-3">
        <Checkbox
          id="location-uses-wikidata-coordinates"
          checked={usesWikidataCoordinates}
          onCheckedChange={value => saveUsesWikidataCoordinates(value === true)}
        />
        <div className="space-y-1">
          <Label htmlFor="location-uses-wikidata-coordinates">Uses Wikidata for coordinates</Label>
          <p className="text-xs text-muted-foreground">
            Auto-checked when a Wikidata search result is picked above
            {wikidataId ? ` (${wikidataId})` : ""}. When checked, &ldquo;Re-geocode&rdquo; and area
            refreshes query Wikidata only — Nominatim is skipped.
          </p>
        </div>
      </div>

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
              onBlur={() => saveField("plusCode", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
        <form.AppField name="placeType">
          {field => (
            <field.ComboboxField
              label="Place type"
              options={placeTypeChoices}
              placeholder="Select a place type…"
              searchPlaceholder="Search place types…"
              emptyText="No place types found."
              onValueChange={value => saveField("placeType", value.trim() || null)}
              createOption={{
                label: "Create place type",
                onSelect: () => setAddPlaceTypeOpen(true),
              }}
            />
          )}
        </form.AppField>
        <form.AppField name="countryCode">
          {field => (
            <field.TextField
              label="Country code"
              placeholder="e.g. JP"
              onBlur={() => saveField("countryCode", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
      </div>

      <AddPlaceTypeModal
        open={addPlaceTypeOpen}
        onOpenChange={setAddPlaceTypeOpen}
        onCreated={(placeType) => {
          form.setFieldValue("placeType", placeType.slug);
          saveField("placeType", placeType.slug);
        }}
      />

      <form.AppField name="officialLink">
        {field => (
          <field.TextField
            label="Official link"
            placeholder="https://…"
            onBlur={() => saveField("officialLink", field.state.value.trim() || null)}
          />
        )}
      </form.AppField>

      <div className="space-y-2">
        <div
          className="
            grid gap-3
            sm:grid-cols-2
          "
        >
          <form.AppField name="wikipediaLinkEn">
            {field => (
              <field.TextField
                label="Wikipedia link (EN)"
                placeholder="https://en.wikipedia.org/wiki/…"
                onBlur={() => saveField("wikipediaLinkEn", field.state.value.trim() || null)}
              />
            )}
          </form.AppField>
          <form.AppField name="wikipediaLinkLocal">
            {field => (
              <field.TextField
                label="Wikipedia link (Local)"
                placeholder="https://ja.wikipedia.org/wiki/…"
                onBlur={() => saveField("wikipediaLinkLocal", field.state.value.trim() || null)}
              />
            )}
          </form.AppField>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isAutofillingWikipediaLinks}
          onClick={autofillWikipediaLinks}
        >
          <RefreshCw
            className={isAutofillingWikipediaLinks
              ? "mr-2 size-3.5 animate-spin"
              : "mr-2 size-3.5"}
          />
          {isAutofillingWikipediaLinks ? "Searching Wikidata…" : "Autofill Wikipedia links"}
        </Button>
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
              saveField("parentId", value && value !== ROOT ? value : null)}
          />
        )}
      </form.AppField>

      <LocationAncestorsSection
        node={node}
        existingOptions={existingOptions}
        onReparented={updated => form.setFieldValue("parent", updated.parentId ?? ROOT)}
      />

      <AlternateNamesEditor
        value={alternateNames}
        onChange={setAlternateNames}
        onCommit={next => saveField("alternateNames", next)}
      />

      <div className="space-y-1">
        <Label htmlFor="location-tags">Tags</Label>
        <TreeMultiCombobox
          id="location-tags"
          aria-label="Tags"
          options={tagOptions}
          values={tagIds}
          onValuesChange={saveTagIds}
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
