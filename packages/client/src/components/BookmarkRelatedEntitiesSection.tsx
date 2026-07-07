import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { AddPersonModal } from "./AddPersonModal";
import { LocationPicker } from "./LocationPicker";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/**
 * The related-entity fields moved off the General tab onto the "Related" edit tab: YouTube channel,
 * locations, people, and groups (each with its inline-create modal). Media type + tags stay on
 * General in {@link BookmarkGeneralRelationsSection}.
 */
export function BookmarkRelatedEntitiesSection({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    locationTree,
    people,
    groups,
    youtubeChannels,
    addPersonOpen,
    setAddPersonOpen,
    saveField,
    saveLocations,
    savePeople,
    saveGroups,
    touchedRef,
  } = ctrl;
  const youtubeChannelCreate = useEntityCreateOption("youtube-channel", (channel) => {
    form.setFieldValue("youtubeChannelId", channel.id);
    saveField("youtubeChannelId", channel.id);
  });
  const groupCreate = useEntityCreateOption("group", (group) => {
    const current = form.getFieldValue("groupIds");
    if (!current.includes(group.id)) {
      const newGroupIds = [...current, group.id];
      form.setFieldValue("groupIds", newGroupIds);
      saveGroups(newGroupIds);
    }
  });
  const locationCreate = useEntityCreateOption("location", (location) => {
    touchedRef.current.add("locations");
    const current = form.getFieldValue("locationIds");
    if (!current.includes(location.id)) {
      const newLocationIds = [...current, location.id];
      form.setFieldValue("locationIds", newLocationIds);
      saveLocations(newLocationIds);
    }
  });
  return (
    <>
      <form.AppField name="youtubeChannelId">
        {field => (
          <field.ComboboxField
            label={t("YouTube channel")}
            placeholder={t("No channel")}
            searchPlaceholder={t("Search channels…")}
            emptyText={t("No channels found.")}
            onValueChange={value => saveField("youtubeChannelId", value || null)}
            createOption={youtubeChannelCreate.createOption}
            options={(youtubeChannels ?? []).map(channel => ({
              value: channel.id,
              label: channel.name,
            }))}
          />
        )}
      </form.AppField>
      {youtubeChannelCreate.modal}

      <form.Field name="locationIds">
        {field => (
          <div className="space-y-1">
            <Label>{t("Locations")}</Label>
            <LocationPicker
              tree={locationTree ?? []}
              selectedIds={field.state.value}
              onToggle={(id) => {
                touchedRef.current.add("locations");
                const current = field.state.value;
                const newLocationIds = current.includes(id)
                  ? current.filter(locationId => locationId !== id)
                  : [...current, id];
                field.handleChange(newLocationIds);
                saveLocations(newLocationIds);
              }}
              createOption={locationCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {locationCreate.modal}

      <form.Field name="personIds">
        {field => (
          <div className="space-y-1">
            <Label>{t("People")}</Label>
            <MultiCombobox
              options={(people ?? []).map(a => ({
                value: a.id,
                label: a.name,
                names: a.names,
              }))}
              values={field.state.value}
              onValuesChange={(ids) => {
                field.handleChange(ids);
                savePeople(ids);
              }}
              placeholder={t("Select people…")}
              searchPlaceholder={t("Search people…")}
              emptyText={t("No people found.")}
              createOption={{
                label: t("Create person"),
                onSelect: () => setAddPersonOpen(true),
              }}
            />
          </div>
        )}
      </form.Field>
      <AddPersonModal
        open={addPersonOpen}
        onOpenChange={setAddPersonOpen}
        onCreated={(person) => {
          const current = form.getFieldValue("personIds");
          if (!current.includes(person.id)) {
            const newPersonIds = [...current, person.id];
            form.setFieldValue("personIds", newPersonIds);
            savePeople(newPersonIds);
          }
        }}
      />

      <form.Field name="groupIds">
        {field => (
          <div className="space-y-1">
            <Label>{t("Groups")}</Label>
            <MultiCombobox
              options={(groups ?? []).map(g => ({
                value: g.id,
                label: g.name,
                names: g.names,
              }))}
              values={field.state.value}
              onValuesChange={(ids) => {
                field.handleChange(ids);
                saveGroups(ids);
              }}
              placeholder={t("Select groups…")}
              searchPlaceholder={t("Search groups…")}
              emptyText={t("No groups found.")}
              createOption={groupCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {groupCreate.modal}
    </>
  );
}
