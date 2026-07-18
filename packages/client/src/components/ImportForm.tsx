import type { IngestSource } from "./importFormSchema";

import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { NewsletterFileField } from "./NewsletterFileField";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useImportForm } from "./useImportForm";

import { sortFavoritesFirst } from "@/lib/favoritesOrder";
import { CategoryIcon } from "@/lib/icons";

/**
 * Submit-style create form for an import (the create-flow exception — not auto-save). Picks one of
 * three ingest sources, then funnels into the matching ingest mutation and either calls
 * `onComplete` (modal mode) or navigates to the Inbox (page mode).
 */
export function ImportForm({
  initialNewsletterId = null,
  onComplete,
}: {
  /** Preselect an import group (e.g. when arriving from an import group's "Add import group" button). */
  initialNewsletterId?: string | null;
  /** Called after a successful import. When provided, navigation to /inbox is skipped. */
  onComplete?: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    form,
    source,
    setSource,
    file,
    setFile,
    newsletters,
    categories,
  } = useImportForm({
    initialNewsletterId,
    onComplete,
  });

  const sourceOptions: { value: IngestSource;
    label: string; }[] = [
    {
      value: "paste",
      label: t("Paste content"),
    },
    {
      value: "url",
      label: t("Fetch from a URL"),
    },
    {
      value: "upload",
      label: t("Upload a file"),
    },
  ];

  const newsletterCreate = useEntityCreateOption("newsletter", newsletter => form.setFieldValue("newsletterId", newsletter.id));
  const categoryCreate = useEntityCreateOption("category", category => form.setFieldValue("categoryId", category.id));

  const selectedNewsletter = newsletters?.find(n => n.id === form.state.values.newsletterId);
  const advancedPreview = selectedNewsletter?.name ?? t("None");

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <form.AppField name="source">
        {field => (
          <field.SelectField
            label={t("Source")}
            options={sourceOptions}
            onValueChange={value => setSource(value as IngestSource)}
          />
        )}
      </form.AppField>

      {source === "paste"
        ? (
          <form.AppField name="pastedContent">
            {field => (
              <field.RichTextField
                label={t("Content")}
                hint={t("Paste a newsletter or article here — links are preserved.")}
              />
            )}
          </form.AppField>
        )
        : null}

      {source === "url"
        ? (
          <form.AppField name="fetchUrl">
            {field => (
              <field.TextField
                label={t("Content")}
                type="url"
                placeholder={t("https://… (an article page, or a view-in-browser link)")}
              />
            )}
          </form.AppField>
        )
        : null}

      {source === "upload"
        ? (
          <NewsletterFileField
            file={file}
            onChange={setFile}
          />
        )
        : null}

      <CollapsibleFormSection
        title={t("Advanced")}
        description={t("Approved bookmarks inherit the import group's default category, tags, and media type.")}
        preview={advancedPreview}
        defaultOpen={!!initialNewsletterId}
      >
        <div className="space-y-2">
          <form.AppField name="newsletterId">
            {field => (
              <field.ComboboxField
                label={t("Import Group")}
                placeholder={t("No import group")}
                searchPlaceholder={t("Search import groups…")}
                emptyText={t("No import groups found.")}
                createOption={newsletterCreate.createOption}
                options={(newsletters ?? []).map(newsletter => ({
                  value: newsletter.id,
                  label: newsletter.name,
                }))}
              />
            )}
          </form.AppField>
        </div>

        <div className="space-y-2">
          <form.AppField name="categoryId">
            {field => (
              <field.ComboboxField
                label={t("Category for all links (optional)")}
                placeholder={t("No category")}
                searchPlaceholder={t("Search categories…")}
                emptyText={t("No categories found.")}
                createOption={categoryCreate.createOption}
                options={sortFavoritesFirst(categories).map(category => ({
                  value: category.id,
                  label: category.name,
                  names: category.names,
                  icon: (
                    <CategoryIcon
                      name={category.icon}
                      className="size-4 shrink-0"
                    />
                  ),
                }))}
              />
            )}
          </form.AppField>
        </div>
      </CollapsibleFormSection>

      <form.AppForm>
        <form.SubmitButton
          label={t("Import links")}
          pendingLabel={t("Queuing…")}
          disabledWhen={source === "upload" && !file}
        />
      </form.AppForm>

      {newsletterCreate.modal}
      {categoryCreate.modal}
    </form>
  );
}
