import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { AddPersonModal } from "./AddPersonModal";
import { BookmarkLocationRelationsField } from "./BookmarkLocationRelationsField";
import { LocationPicker } from "./LocationPicker";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { describeError } from "../lib/apiError";
import { notifyFieldSaved, notifyFieldSaveError } from "../lib/autoSave";
import { computePersonGroupGaps } from "../lib/personGroupGaps";

import { Label } from "@/components/ui/label";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/**
 * The YouTube-channel field (with its inline-create modal) — one of the related-entity fields the old
 * `BookmarkRelatedEntitiesSection` bundled, now a standalone placeable field (#1163 field extraction).
 */
export function BookmarkChannelSelectField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    youtubeChannels,
    saveField,
  } = ctrl;
  const youtubeChannelCreate = useEntityCreateOption("youtube-channel", (channel) => {
    form.setFieldValue("youtubeChannelId", channel.id);
    saveField("youtubeChannelId", channel.id);
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
    </>
  );
}

/**
 * The Locations field — the LocationPicker plus the per-location relation editor (with inline-create) —
 * now a standalone placeable field (#1163 field extraction).
 */
export function BookmarkLocationsSelectField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    locationTree,
    saveLocations,
    saveLocationRelations,
    touchedRef,
  } = ctrl;
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

      <form.Subscribe selector={state => state.values.locationIds}>
        {locationIds => (
          <form.Field name="locationRelationByLocationId">
            {relationField => (
              <BookmarkLocationRelationsField
                locationIds={locationIds}
                locationTree={locationTree ?? []}
                value={relationField.state.value}
                onChange={(next) => {
                  relationField.handleChange(next);
                  saveLocationRelations(next);
                }}
              />
            )}
          </form.Field>
        )}
      </form.Subscribe>
    </>
  );
}

/**
 * A compact hint under the People field: when a credited person isn't a member of one of the
 * bookmark's (creator) Groups, offer to add that group to the person's Groups in one click. Reads
 * `personIds`/`groupIds` reactively so it appears/clears as the selections change, and each person's
 * own group membership from the loaded `people` list. Renders nothing when there are no gaps.
 */
function BookmarkPersonGroupMembershipHint({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    people,
    updatePerson,
  } = ctrl;

  function addAll(gaps: ReturnType<typeof computePersonGroupGaps>): void {
    let remaining = gaps.length;
    let failed = false;
    for (const {
      person, missingGroupIds,
    } of gaps) {
      updatePerson.mutate(
        {
          id: person.id,
          input: {
            groupIds: [...person.groupIds, ...missingGroupIds],
          },
        },
        {
          onSuccess: () => {
            remaining -= 1;
            if (remaining === 0 && !failed) notifyFieldSaved("Groups");
          },
          onError: (e) => {
            failed = true;
            notifyFieldSaveError("Groups", describeError(e));
          },
        },
      );
    }
  }

  return (
    <form.Subscribe
      selector={state => ({
        personIds: state.values.personIds,
        groupIds: state.values.groupIds,
      })}
    >
      {({
        personIds, groupIds,
      }) => {
        const gaps = computePersonGroupGaps(people ?? [], personIds, groupIds);
        if (gaps.length === 0) return null;
        const names = gaps.map(gap => gap.person.name).join(", ");
        return (
          <p className="text-sm text-muted-foreground">
            {t("Not in every selected group: {{names}}.", {
              names,
            })}
            {" "}
            <button
              type="button"
              className="
                text-primary underline-offset-4
                hover:underline
              "
              onClick={() => addAll(gaps)}
            >
              {t("Add to groups")}
            </button>
          </p>
        );
      }}
    </form.Subscribe>
  );
}

/**
 * The People field (individual creators, with the inline "Create person" modal) — now a standalone
 * placeable field (#1163 field extraction).
 */
export function BookmarkPeopleSelectField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    people,
    addPersonOpen,
    setAddPersonOpen,
    savePeople,
  } = ctrl;
  return (
    <>
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
            <BookmarkPersonGroupMembershipHint ctrl={ctrl} />
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
    </>
  );
}

/**
 * The Groups field (group creators, with inline-create) — now a standalone placeable field
 * (#1163 field extraction).
 */
export function BookmarkGroupsSelectField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    groups,
    saveGroups,
  } = ctrl;
  const groupCreate = useEntityCreateOption("group", (group) => {
    const current = form.getFieldValue("groupIds");
    if (!current.includes(group.id)) {
      const newGroupIds = [...current, group.id];
      form.setFieldValue("groupIds", newGroupIds);
      saveGroups(newGroupIds);
    }
  });
  return (
    <>
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
