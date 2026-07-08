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

/**
 * The placeable sub-fields of a newsletter's General edit form (the newsletter workbench registry uses
 * each as a `WorkbenchField.edit` renderer; `NewsletterGeneralForm` recomposes them into the same whole
 * form the Storybook story renders). Each owns its own `useNewsletterGeneralForm` slice — auto-save is
 * per field, react-query dedupes the shared taxonomy queries. The `tags`/`genreMoods` fields carry a
 * leading `<Separator/>` (the layout system only inserts separators between sections, so a within-tab
 * separator lives on the field it precedes).
 */

/** Name field — auto-saves on blur and follows the new slug on rename. */
export function NewsletterNameField({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveName,
  } = useNewsletterGeneralForm(newsletter);
  return (
    <form.AppField name="name">
      {field => (
        <field.TextField
          label={t("Newsletter name")}
          onBlur={() => saveName(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/** Description field — auto-saves on blur. */
export function NewsletterDescriptionEdit({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    form, saveDescription,
  } = useNewsletterGeneralForm(newsletter);
  return (
    <form.AppField name="description">
      {field => (
        <field.TextareaField
          label={t("Description")}
          onBlur={() => saveDescription(field.state.value, field.state.meta.errors.length === 0)}
        />
      )}
    </form.AppField>
  );
}

/** Default category + media type applied to imported bookmarks — each combobox auto-saves on change. */
export function NewsletterSourceDefaultsEdit({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    saveCategoryId, saveMediaTypeId, categoryOptions, mediaTypeOptions,
  } = useNewsletterGeneralForm(newsletter);
  return (
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
  );
}

/** Default tags applied to imported bookmarks — auto-saves on toggle. Carries its leading separator. */
export function NewsletterTagsEdit({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    tagIds, toggleTag, tagTree,
  } = useNewsletterGeneralForm(newsletter);
  return (
    <>
      <Separator />
      <DefaultTagsField
        tree={tagTree}
        selectedIds={tagIds}
        onToggle={toggleTag}
        description={t("Tags applied automatically to bookmarks imported from this newsletter.")}
      />
    </>
  );
}

/** Genres & moods assignment — self-saving. Carries its leading separator. */
export function NewsletterGenreMoodEdit({
  newsletter,
}: Props) {
  return (
    <>
      <Separator />
      <GenreMoodAssignmentSection
        ownerType="newsletter"
        ownerId={newsletter.id}
      />
    </>
  );
}

/**
 * Edit a newsletter's name + default category / media type / tags. Each field auto-saves (no Save
 * button). Composed from the same placeable sub-fields the newsletter workbench registry uses, so this
 * whole-form shell (rendered by its Storybook story) stays in lockstep with the layout-driven General tab.
 */
export function NewsletterGeneralForm({
  newsletter,
}: Props) {
  return (
    <div className="space-y-4">
      <NewsletterNameField newsletter={newsletter} />
      <NewsletterDescriptionEdit newsletter={newsletter} />
      <NewsletterSourceDefaultsEdit newsletter={newsletter} />
      <NewsletterTagsEdit newsletter={newsletter} />
      <NewsletterGenreMoodEdit newsletter={newsletter} />
    </div>
  );
}
