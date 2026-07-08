import type { Newsletter } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { DefaultTagsField } from "./DefaultTagsField";
import { GenreMoodAssignmentSection } from "./GenreMoodAssignmentSection";
import { CategoryDefaultField, MediaTypeDefaultField } from "./SourceDefaultFields";
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

/** Default category applied to imported bookmarks — auto-saves on change. */
export function NewsletterCategoryEdit({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    saveCategoryId, categoryOptions,
  } = useNewsletterGeneralForm(newsletter);
  return (
    <>
      <CategoryDefaultField
        initialCategoryId={newsletter.category?.id ?? null}
        categoryLabel={t("Default category")}
        categoryOptions={categoryOptions}
        onCategoryChange={saveCategoryId}
      />
      <p className="text-sm text-muted-foreground">
        {t("Category applied automatically to bookmarks imported from this newsletter.")}
      </p>
    </>
  );
}

/** Default media type applied to imported bookmarks — auto-saves on change. */
export function NewsletterMediaTypeEdit({
  newsletter,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    saveMediaTypeId, mediaTypeOptions,
  } = useNewsletterGeneralForm(newsletter);
  return (
    <>
      <MediaTypeDefaultField
        initialMediaTypeId={newsletter.mediaTypeId ?? null}
        mediaTypeLabel={t("Default media type")}
        mediaTypeOptions={mediaTypeOptions}
        onMediaTypeChange={saveMediaTypeId}
      />
      <p className="text-sm text-muted-foreground">
        {t("Media type applied automatically to bookmarks imported from this newsletter.")}
      </p>
    </>
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
      <NewsletterCategoryEdit newsletter={newsletter} />
      <NewsletterMediaTypeEdit newsletter={newsletter} />
      <NewsletterTagsEdit newsletter={newsletter} />
      <NewsletterGenreMoodEdit newsletter={newsletter} />
    </div>
  );
}
