import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { GatedTagPicker } from "./BookmarkTagsField";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/**
 * The General-tab taxonomy fields: media type and tags (each with its inline-create modal). The
 * remaining relationship fields (YouTube channel, locations, people, groups) live on the Related tab
 * in {@link BookmarkRelatedEntitiesSection}; tag/location blacklists live in {@link BookmarkBlacklistSection}.
 */
export function BookmarkGeneralRelationsSection({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    tagTree,
    mediaTypes,
    addTagOpen,
    setAddTagOpen,
    saveField,
    saveTags,
    touchedRef,
  } = ctrl;
  const mediaTypeCreate = useEntityCreateOption("media-type", (mediaType) => {
    form.setFieldValue("mediaTypeId", mediaType.id);
    saveField("mediaTypeId", mediaType.id);
  });
  return (
    <>
      <form.AppField name="mediaTypeId">
        {field => (
          <field.TreeComboboxField
            label={t("Media type")}
            placeholder={t("No media type")}
            searchPlaceholder={t("Search media types…")}
            emptyText={t("No media types found.")}
            onValueChange={value => saveField("mediaTypeId", value || null)}
            createOption={mediaTypeCreate.createOption}
            options={mediaTypeNodesToOptions(mediaTypes ?? [])}
          />
        )}
      </form.AppField>
      {mediaTypeCreate.modal}

      <form.Subscribe selector={state => state.values.categoryId}>
        {categoryId => (
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
                  label: t("Create tag"),
                  onSelect: () => setAddTagOpen(true),
                }}
              />
            )}
          </form.Field>
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
    </>
  );
}
