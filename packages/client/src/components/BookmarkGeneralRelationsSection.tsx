import type { useBookmarkGeneralForm } from "./useBookmarkGeneralForm";

import { useTranslation } from "react-i18next";

import { AddTagModal } from "./AddTagModal";
import { BookmarkTagsField } from "./BookmarkTagsField";
import { useEntityCreateOption } from "./useEntityCreateOption";

import { useBuiltInName } from "@/lib/builtInName";
import { mediaTypeNodesToOptions } from "@/lib/comboboxOptions";

type Ctrl = ReturnType<typeof useBookmarkGeneralForm>;

/**
 * The General-tab **Media type** field (with its inline-create modal) — one of the two halves the old
 * `BookmarkGeneralRelationsSection` bundled, now a standalone placeable field (#1163 field extraction).
 */
export function BookmarkMediaTypeField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    mediaTypes,
    saveField,
  } = ctrl;
  const builtInName = useBuiltInName();
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
            options={mediaTypeNodesToOptions(mediaTypes ?? [], builtInName)}
          />
        )}
      </form.AppField>
      {mediaTypeCreate.modal}
    </>
  );
}

/**
 * The General-tab **Tags** field (with its inline-create modal) — the other half of the old
 * `BookmarkGeneralRelationsSection`, now a standalone placeable field (#1163 field extraction).
 */
export function BookmarkTagsSelectField({
  ctrl,
}: { ctrl: Ctrl }) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    tagTree,
    addTagOpen,
    setAddTagOpen,
    saveTags,
    touchedRef,
  } = ctrl;
  return (
    <>
      <form.Field name="tagIds">
        {field => (
          <BookmarkTagsField
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

/**
 * The General-tab taxonomy fields: media type and tags (each with its inline-create modal). The
 * related-entity fields (YouTube channel, locations, people, groups) are now individually-placeable
 * layout fields (see `BookmarkRelatedEntitiesSection.tsx`'s `*SelectField` exports); tag/location
 * blacklists live in {@link BookmarkBlacklistSection}. Recomposed from the two halves above so this
 * component's own consumers stay unchanged.
 */
export function BookmarkGeneralRelationsSection({
  ctrl,
}: { ctrl: Ctrl }) {
  return (
    <>
      <BookmarkMediaTypeField ctrl={ctrl} />
      <BookmarkTagsSelectField ctrl={ctrl} />
    </>
  );
}
