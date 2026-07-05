import type { LocationNode } from "@eesimple/types";

import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LocationAncestorsSection } from "./LocationAncestorsSection";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { ROOT, useLocationGeneralForm } from "./useLocationGeneralForm";
import { useLocationSyncRegistration } from "../hooks/useLocationSyncRegistration";

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
    t,
  } = useTranslation();
  const {
    form, alternateNames, setAlternateNames, tagIds, saveTagIds,
    wikidataId, usesWikidataCoordinates, saveUsesWikidataCoordinates,
    existingOptions, parentOptions, placeTypeChoices, tagOptions,
    saveField, followSlug, applyLookup,
    repullCoordinates, isRepullingCoordinates,
    autofillWikipediaLinks, isAutofillingWikipediaLinks,
    addPlaceTypeOpen, setAddPlaceTypeOpen,
  } = useLocationGeneralForm(node);

  const tagCreate = useEntityCreateOption("tag", (tag) => {
    if (!tagIds.includes(tag.id)) saveTagIds([...tagIds, tag.id]);
  });

  // Register the header "Sync from source" button for this location (re-geocode).
  useLocationSyncRegistration({
    node,
    form,
    saveField,
    repullCoordinates,
    usesWikidataCoordinates,
  });

  return (
    <div className="space-y-4">
      <LocationLookupBox onSelect={applyLookup} />

      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Name")}
            placeholder={t("Location name")}
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

      <div className="space-y-1">
        <Label>{t("Names")}</Label>
        <EntityNamesTabEditor
          ownerType="location"
          ownerId={node.id}
        />
      </div>

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
                label={t("Latitude")}
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
                label={t("Longitude")}
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
          {isRepullingCoordinates ? t("Re-geocoding…") : t("Re-geocode")}
        </Button>
      </div>

      <form.AppField name="mapUrl">
        {field => (
          <field.TextField
            label={t("Map URL")}
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
          <Label htmlFor="location-uses-wikidata-coordinates">{t("Uses Wikidata for coordinates")}</Label>
          <p className="text-xs text-muted-foreground">
            {t("Auto-checked when a Wikidata search result is picked above")}
            {wikidataId ? ` (${wikidataId})` : ""}
            {t(
              ". When checked, “Re-geocode” and area refreshes query Wikidata only — Nominatim is skipped.",
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
        <form.AppField name="plusCode">
          {field => (
            <field.TextField
              label={t("Plus code")}
              placeholder="e.g. 8Q7XMP+2J"
              onBlur={() => saveField("plusCode", field.state.value.trim() || null)}
            />
          )}
        </form.AppField>
        <form.AppField name="placeType">
          {field => (
            <field.ComboboxField
              label={t("Place type")}
              options={placeTypeChoices}
              placeholder={t("Select a place type…")}
              searchPlaceholder={t("Search place types…")}
              emptyText={t("No place types found.")}
              onValueChange={value => saveField("placeType", value.trim() || null)}
              createOption={{
                label: t("Create place type"),
                onSelect: () => setAddPlaceTypeOpen(true),
              }}
            />
          )}
        </form.AppField>
        <form.AppField name="countryCode">
          {field => (
            <field.TextField
              label={t("Country code")}
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
            label={t("Official link")}
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
                label={t("Wikipedia link (EN)")}
                placeholder="https://en.wikipedia.org/wiki/…"
                onBlur={() => saveField("wikipediaLinkEn", field.state.value.trim() || null)}
              />
            )}
          </form.AppField>
          <form.AppField name="wikipediaLinkLocal">
            {field => (
              <field.TextField
                label={t("Wikipedia link (Local)")}
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
          {isAutofillingWikipediaLinks ? t("Searching Wikidata…") : t("Autofill Wikipedia links")}
        </Button>
      </div>

      <form.AppField name="parent">
        {field => (
          <field.ComboboxField
            label={t("Parent")}
            options={parentOptions}
            placeholder={t("Choose a parent")}
            searchPlaceholder={t("Search locations…")}
            emptyText={t("No locations found.")}
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
        <Label htmlFor="location-tags">{t("Tags")}</Label>
        <TreeMultiCombobox
          id="location-tags"
          aria-label={t("Tags")}
          options={tagOptions}
          values={tagIds}
          onValuesChange={saveTagIds}
          placeholder={t("Select tags…")}
          searchPlaceholder={t("Search tags…")}
          emptyText={t("No tags found.")}
          createOption={tagCreate.createOption}
        />
        <p className="text-xs text-muted-foreground">
          {t("Looser mood / biome tags associated with this location.")}
        </p>
      </div>
      {tagCreate.modal}

      <GenreMoodAssignmentSection
        ownerType="location"
        ownerId={node.id}
      />
    </div>
  );
}
