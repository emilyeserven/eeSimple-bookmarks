import type { IngestSource } from "./importFormSchema";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import { NewsletterFileField } from "./NewsletterFileField";
import { useEntityCreateOption } from "./useEntityCreateOption";
import { useImportForm } from "./useImportForm";

import { CategoryIcon } from "@/lib/icons";

const SOURCE_OPTIONS: { value: IngestSource;
  label: string; }[] = [
  {
    value: "paste",
    label: "Paste content",
  },
  {
    value: "url",
    label: "Fetch from a URL",
  },
  {
    value: "upload",
    label: "Upload a file",
  },
];

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

  const newsletterCreate = useEntityCreateOption("newsletter", newsletter => form.setFieldValue("newsletterId", newsletter.id));
  const categoryCreate = useEntityCreateOption("category", category => form.setFieldValue("categoryId", category.id));

  const selectedNewsletter = newsletters?.find(n => n.id === form.state.values.newsletterId);
  const advancedPreview = selectedNewsletter?.name ?? "None";

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
            label="Source"
            options={SOURCE_OPTIONS}
            onValueChange={value => setSource(value as IngestSource)}
          />
        )}
      </form.AppField>

      {source === "paste"
        ? (
          <form.AppField name="pastedContent">
            {field => (
              <field.RichTextField
                label="Content"
                hint="Paste a newsletter or article here — links are preserved."
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
                label="Content"
                type="url"
                placeholder="https://… (an article page, or a view-in-browser link)"
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
        title="Advanced"
        description="Approved bookmarks inherit the import group's default category, tags, and media type."
        preview={advancedPreview}
        defaultOpen={!!initialNewsletterId}
      >
        <div className="space-y-2">
          <form.AppField name="newsletterId">
            {field => (
              <field.ComboboxField
                label="Import Group"
                placeholder="No import group"
                searchPlaceholder="Search import groups…"
                emptyText="No import groups found."
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
                label="Category for all links (optional)"
                placeholder="No category"
                searchPlaceholder="Search categories…"
                emptyText="No categories found."
                createOption={categoryCreate.createOption}
                options={categories.map(category => ({
                  value: category.id,
                  label: category.name,
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
          label="Import links"
          pendingLabel="Queuing…"
          disabledWhen={source === "upload" && !file}
        />
      </form.AppForm>

      {newsletterCreate.modal}
      {categoryCreate.modal}
    </form>
  );
}
