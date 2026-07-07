import type { Newsletter } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { DefaultTagsField } from "./DefaultTagsField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { SourceDefaultFields } from "./SourceDefaultFields";
import { useNewsletterGeneralForm } from "./useNewsletterGeneralForm";

import { Separator } from "@/components/ui/separator";

interface Props {
  newsletter: Newsletter;
}

/** Edit a newsletter's name + default category / media type / tags. Each field auto-saves (no Save button). */
export function NewsletterGeneralForm({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, tagIds, saveName, saveDescription, toggleTag, saveCategoryId, saveMediaTypeId,
    categoryOptions, mediaTypeOptions, tagTree,
  } = useNewsletterGeneralForm(newsletter);

  return (
    <div className="space-y-4">
      <form.AppField name="name">
        {field => (
          <field.TextField
            label={t("Newsletter name")}
            onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>

      <form.AppField name="description">
        {field => (
          <field.TextareaField
            label={t("Description")}
            onBlur={() => saveDescription(field.state.value, field.state.meta.errors.length === 0)}
          />
        )}
      </form.AppField>

      <SourceDefaultFields
        initialCategoryId={newsletter.category?.id ?? null}
        initialMediaTypeId={newsletter.mediaTypeId ?? null}
        categoryLabel={t("Default category")}
        mediaTypeLabel={t("Default media type")}
        categoryOptions={categoryOptions}
        mediaTypeOptions={mediaTypeOptions}
        onCategoryChange={saveCategoryId}
        onMediaTypeChange={saveMediaTypeId}
        note={t("Category and media type applied automatically to bookmarks imported from this newsletter.")}
      />

      <Separator />

      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description={t("Tags applied automatically to bookmarks imported from this newsletter.")}
        categoryId={newsletter.category?.id ?? null}
      />

      <Separator />

      <GenreMoodAssignmentSection
        ownerType="newsletter"
        ownerId={newsletter.id}
      />
    </div>
  );
}
