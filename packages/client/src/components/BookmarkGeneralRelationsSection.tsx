import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { AddPersonModal } from "./AddPersonModal";
import { AddTagModal } from "./AddTagModal";
import { GatedTagPicker } from "./BookmarkTagsField";
import { LocationPicker } from "./LocationPicker";
import { MultiCombobox } from "./MultiCombobox";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { Label } from "@/components/ui/label";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/** The relationship fields: media type, tags + tag blacklist, locations + location blacklist, and people (each with its inline-create modal). */
export function BookmarkGeneralRelationsSection({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    form,
    tagTree,
    locationTree,
    mediaTypes,
    people,
    groups,
    addTagOpen,
    setAddTagOpen,
    addPersonOpen,
    setAddPersonOpen,
    saveField,
    saveTags,
    saveLocations,
    saveBlacklistedTagIds,
    saveBlacklistedLocationIds,
    savePeople,
    saveGroups,
    touchedRef,
  } = ctrl;
  const mediaTypeCreate = useEntityCreateOption("media-type", (mediaType) => {
    form.setFieldValue("mediaTypeId", mediaType.id);
    saveField("mediaTypeId", mediaType.id);
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
      <form.AppField name="mediaTypeId">
        {field => (
          <field.TreeComboboxField
            label="Media type"
            placeholder="No media type"
            searchPlaceholder="Search media types…"
            emptyText="No media types found."
            onValueChange={value => saveField("mediaTypeId", value || null)}
            createOption={mediaTypeCreate.createOption}
            options={mediaTypeNodesToOptions(mediaTypes ?? [])}
          />
        )}
      </form.AppField>
      {mediaTypeCreate.modal}

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
          <>
            <form.Field name="tagIds">
              {field => (
                <GatedTagPicker
                  categoryId={categoryId}
                  tree={tagTree ?? []}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    touchedRef.current.add("tags");
                    const current = field.state.value;
                    const newTagIds = current.includes(id)
                      ? current.filter(tagId => tagId !== id)
                      : [...current, id];
                    field.handleChange(newTagIds);
                    saveTags(newTagIds);
                  }}
                  createOption={{
                    label: "Create tag",
                    onSelect: () => setAddTagOpen(true),
                  }}
                />
              )}
            </form.Field>
            <form.Field name="blacklistedTagIds">
              {field => (
                <GatedTagPicker
                  categoryId={categoryId}
                  tree={tagTree ?? []}
                  selectedIds={field.state.value}
                  onToggle={(id) => {
                    const current = field.state.value;
                    const next = current.includes(id)
                      ? current.filter(tagId => tagId !== id)
                      : [...current, id];
                    field.handleChange(next);
                    saveBlacklistedTagIds(next);
                  }}
                  label="Tag blacklist"
                  description="Tags toggled here will never be auto-applied by autofill rules."
                />
              )}
            </form.Field>
          </>
        )}
      </form.Subscribe>
      <AddTagModal
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onCreated={(tag) => {
          touchedRef.current.add("tags");
          const current = form.getFieldValue("tagIds");
          if (!current.includes(tag.id)) {
            const newTagIds = [...current, tag.id];
            form.setFieldValue("tagIds", newTagIds);
            saveTags(newTagIds);
          }
        }}
      />

      <form.Field name="locationIds">
        {field => (
          <div className="space-y-1">
            <Label>Locations</Label>
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

      <form.Field name="blacklistedLocationIds">
        {field => (
          <div className="space-y-1">
            <Label>Location blacklist</Label>
            <p className="text-xs text-muted-foreground">
              Locations toggled here will never be auto-applied by autofill rules.
            </p>
            <LocationPicker
              tree={locationTree ?? []}
              selectedIds={field.state.value}
              onToggle={(id) => {
                const current = field.state.value;
                const next = current.includes(id)
                  ? current.filter(locationId => locationId !== id)
                  : [...current, id];
                field.handleChange(next);
                saveBlacklistedLocationIds(next);
              }}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="personIds">
        {field => (
          <div className="space-y-1">
            <Label>People</Label>
            <MultiCombobox
              options={(people ?? []).map(a => ({
                value: a.id,
                label: a.name,
              }))}
              values={field.state.value}
              onValuesChange={(ids) => {
                field.handleChange(ids);
                savePeople(ids);
              }}
              placeholder="Select people…"
              searchPlaceholder="Search people…"
              emptyText="No people found."
              createOption={{
                label: "Create person",
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
            <Label>Groups</Label>
            <MultiCombobox
              options={(groups ?? []).map(g => ({
                value: g.id,
                label: g.name,
              }))}
              values={field.state.value}
              onValuesChange={(ids) => {
                field.handleChange(ids);
                saveGroups(ids);
              }}
              placeholder="Select groups…"
              searchPlaceholder="Search groups…"
              emptyText="No groups found."
              createOption={groupCreate.createOption}
            />
          </div>
        )}
      </form.Field>
      {groupCreate.modal}
    </>
  );
}
