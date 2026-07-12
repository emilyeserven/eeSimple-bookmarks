import type { LocationNode } from "@eesimple/types";

import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { AddPlaceTypeModal } from "./AddPlaceTypeModal";
import { AlternateNamesEditor } from "./AlternateNamesEditor";
import { EntityNamesTabEditor } from "./entityNames/EntityNamesTab";
import { PrimaryLanguageField } from "./entityNames/PrimaryLanguageField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { LabeledWebsitesField } from "./LabeledWebsitesField";
import { LocationAncestorsSection } from "./LocationAncestorsSection";
import { LocationGeneralFormProvider, useLocationGeneralFormContext } from "./LocationGeneralFormContext";
import { LocationLookupBox } from "./LocationLookupBox";
import { TreeMultiCombobox } from "./TreeMultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { ROOT } from "./useLocationGeneralForm";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * The location General-tab **edit** fields (#1191 field extraction). Each is a placeable
 * {@link import("./workbench/location").locationFields} entry, split out of the former monolithic
 * `LocationGeneralForm`. All except {@link LocationNamesEditField} / {@link LocationGenreMoodsEditField}
 * read the **shared** `useLocationGeneralForm` controller from {@link useLocationGeneralFormContext}
 * (mounted by the `EditFormProvider` seam on `EntityEditView`), so the one `useAppForm` instance keeps
 * coordinating name-blur primary-language sync, geocode lookup, force re-geocode, and the Wikidata
 * source flag across the now-separate fibers. Each field still auto-saves on blur/change via the
 * controller's `saveField`.
 */

/** Name (auto-saves on blur; renaming can move the slug, so follow it). */
export function LocationNameEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl, primaryLanguage,
  } = useLocationGeneralFormContext();
  const {
    form, saveField, followSlug,
  } = ctrl;
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Name")}
          placeholder={t("Location name")}
          onBlur={() => {
            const trimmed = field.state.value.trim();
            saveField(
              "name",
              trimmed,
              {
                valid: field.state.meta.errors.length === 0,
                // Renaming can change the slug; follow it so the edit page keeps resolving.
                onSuccess: followSlug,
              },
            );
            primaryLanguage.syncPrimaryValue(trimmed);
          }}
        />
      )}
    </form.AppField>
  );
}

/** Primary language (the availability-kind usage level named "primary language"). */
export function LocationPrimaryLanguageEditField() {
  const {
    ctrl, primaryLanguage,
  } = useLocationGeneralFormContext();
  const {
    form,
  } = ctrl;
  return (
    <PrimaryLanguageField
      value={primaryLanguage.primaryLanguageId}
      onValueChange={v => primaryLanguage.setPrimaryLanguage(v, form.state.values.name)}
    />
  );
}

/** Language-labelled names (self-contained — persists its own rows via the entity-names editor). */
export function LocationNamesEditField({
  node,
}: {
  node: LocationNode;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1">
      <Label>{t("Names")}</Label>
      <EntityNamesTabEditor
        ownerType="location"
        ownerId={node.id}
      />
    </div>
  );
}

/** Description (auto-saves on blur). */
export function LocationDescriptionEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField,
  } = ctrl;
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          onBlur={() => saveField(
            "description",
            field.state.value.trim() || null,
            {
              valid: field.state.meta.errors.length === 0,
            },
          )}
        />
      )}
    </form.AppField>
  );
}

/** Geocoding lookup box — picking a candidate stages coordinates/place-type/country into the form. */
export function LocationGeoLookupEditField() {
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  return <LocationLookupBox onSelect={ctrl.applyLookup} />;
}

/** Latitude/longitude pair + the force "Re-geocode" button (kept one field — the button drives both). */
export function LocationCoordinatesEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField, repullCoordinates, isRepullingCoordinates,
  } = ctrl;
  return (
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
  );
}

/** Map URL (auto-saves on blur). */
export function LocationMapUrlEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField,
  } = ctrl;
  return (
    <form.AppField name="mapUrl">
      {field => (
        <field.TextField
          label={t("Map URL")}
          placeholder="https://maps.google.com/…"
          onBlur={() => saveField("mapUrl", field.state.value.trim() || null)}
        />
      )}
    </form.AppField>
  );
}

/** "Uses Wikidata for coordinates" toggle (auto-checked when a Wikidata candidate is picked). */
export function LocationUsesWikidataEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    wikidataId, usesWikidataCoordinates, saveUsesWikidataCoordinates,
  } = ctrl;
  return (
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
  );
}

/** "Hide on main map" toggle — keeps this location (and its subtree) off the all-locations map plot. */
export function LocationHiddenOnMainMapEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    hiddenOnMainMap, saveHiddenOnMainMap,
  } = ctrl;
  return (
    <div className="flex items-start gap-3">
      <Checkbox
        id="location-hidden-on-main-map"
        checked={hiddenOnMainMap}
        onCheckedChange={value => saveHiddenOnMainMap(value === true)}
      />
      <div className="space-y-1">
        <Label htmlFor="location-hidden-on-main-map">{t("Hide on main map")}</Label>
        <p className="text-xs text-muted-foreground">
          {t(
            "When checked, this location and everything under it are hidden from the main all-locations map (so it can zoom to the regions you care about). It still appears in the list and on its own map.",
          )}
        </p>
      </div>
    </div>
  );
}

/** Plus code (auto-saves on blur). */
export function LocationPlusCodeEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField,
  } = ctrl;
  return (
    <form.AppField name="plusCode">
      {field => (
        <field.TextField
          label={t("Plus code")}
          placeholder="e.g. 8Q7XMP+2J"
          onBlur={() => saveField("plusCode", field.state.value.trim() || null)}
        />
      )}
    </form.AppField>
  );
}

/** Place type (combobox with inline create; auto-saves on change). */
export function LocationPlaceTypeEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField, placeTypeChoices, addPlaceTypeOpen, setAddPlaceTypeOpen,
  } = ctrl;
  return (
    <>
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
      <AddPlaceTypeModal
        open={addPlaceTypeOpen}
        onOpenChange={setAddPlaceTypeOpen}
        onCreated={(placeType) => {
          form.setFieldValue("placeType", placeType.slug);
          saveField("placeType", placeType.slug);
        }}
      />
    </>
  );
}

/** Country code (auto-saves on blur). */
export function LocationCountryCodeEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField,
  } = ctrl;
  return (
    <form.AppField name="countryCode">
      {field => (
        <field.TextField
          label={t("Country code")}
          placeholder="e.g. JP"
          onBlur={() => saveField("countryCode", field.state.value.trim() || null)}
        />
      )}
    </form.AppField>
  );
}

/** Official link (auto-saves on blur). */
export function LocationOfficialLinkEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField,
  } = ctrl;
  return (
    <form.AppField name="officialLink">
      {field => (
        <field.TextField
          label={t("Official link")}
          placeholder="https://…"
          onBlur={() => saveField("officialLink", field.state.value.trim() || null)}
        />
      )}
    </form.AppField>
  );
}

/** Wikipedia EN/Local pair + the "Autofill Wikipedia links" button (kept one field — button fills both). */
export function LocationWikipediaLinksEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField, autofillWikipediaLinks, isAutofillingWikipediaLinks,
  } = ctrl;
  return (
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
  );
}

/** Parent combobox (auto-saves on change; ROOT sentinel clears the parent). */
export function LocationParentEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, saveField, parentOptions,
  } = ctrl;
  return (
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
  );
}

/** Ancestor-chain reparent section (writes back into the shared form's `parent` field). */
export function LocationAncestorsEditField({
  node,
}: {
  node: LocationNode;
}) {
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    form, existingOptions,
  } = ctrl;
  return (
    <LocationAncestorsSection
      node={node}
      existingOptions={existingOptions}
      onReparented={updated => form.setFieldValue("parent", updated.parentId ?? ROOT)}
    />
  );
}

/** Alternate names (auto-saves the list on commit). */
export function LocationAlternateNamesEditField() {
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    alternateNames, setAlternateNames, saveField,
  } = ctrl;
  return (
    <AlternateNamesEditor
      value={alternateNames}
      onChange={setAlternateNames}
      onCommit={next => saveField("alternateNames", next)}
    />
  );
}

/** Looser mood / biome tags (multi-select with inline create; auto-saves on change). */
export function LocationTagsEditField() {
  const {
    t,
  } = useTranslation();
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  const {
    tagIds, saveTagIds, tagOptions,
  } = ctrl;
  const tagCreate = useEntityCreateOption("tag", (tag) => {
    if (!tagIds.includes(tag.id)) saveTagIds([...tagIds, tag.id]);
  });
  return (
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
      {tagCreate.modal}
    </div>
  );
}

/** Labeled websites (auto-saves the list on change). */
export function LocationLabeledWebsitesEditField({
  node,
}: {
  node: LocationNode;
}) {
  const {
    ctrl,
  } = useLocationGeneralFormContext();
  return (
    <LabeledWebsitesField
      labeledWebsites={node.labeledWebsites}
      onChange={next => ctrl.saveField("labeledWebsites", next)}
    />
  );
}

/** Genres & moods (self-contained polymorphic-assignment section, auto-saves its own rows). */
export function LocationGenreMoodsEditField({
  node,
}: {
  node: LocationNode;
}) {
  return (
    <GenreMoodAssignmentSection
      ownerType="location"
      ownerId={node.id}
    />
  );
}

interface LocationGeneralFormProps {
  /** The location being edited (as a tree node). */
  node: LocationNode;
}

/**
 * The full per-field auto-saving location General edit form, **recomposed** from the granular field
 * components above (wrapped in {@link LocationGeneralFormProvider}). The real edit page renders those
 * fields individually through the layout registry; this standalone composition is kept so the
 * `LocationGeneralForm.stories.tsx` story (and any other whole-form consumer) renders unchanged (the
 * "a form reused elsewhere is recomposed, not deleted" rule).
 */
export function LocationGeneralForm({
  node,
}: LocationGeneralFormProps) {
  return (
    <LocationGeneralFormProvider node={node}>
      <div className="space-y-4">
        <LocationGeoLookupEditField />
        <LocationNameEditField />
        <LocationDescriptionEditField />
        <LocationPrimaryLanguageEditField />
        <LocationNamesEditField node={node} />
        <LocationCoordinatesEditField />
        <LocationMapUrlEditField />
        <LocationUsesWikidataEditField />
        <LocationPlusCodeEditField />
        <LocationPlaceTypeEditField />
        <LocationCountryCodeEditField />
        <LocationOfficialLinkEditField />
        <LocationWikipediaLinksEditField />
        <LocationParentEditField />
        <LocationAncestorsEditField node={node} />
        <LocationAlternateNamesEditField />
        <LocationTagsEditField />
        <LocationLabeledWebsitesEditField node={node} />
        <LocationGenreMoodsEditField node={node} />
      </div>
    </LocationGeneralFormProvider>
  );
}
