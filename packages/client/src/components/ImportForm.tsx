import type { IngestSource } from "./importFormSchema";

import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { importFormSchema } from "./importFormSchema";
import { NewsletterFileField } from "./NewsletterFileField";
import { useCategories } from "../hooks/useCategories";
import {
  useIngestPaste,
  useIngestUpload,
  useIngestUrl,
} from "../hooks/useImports";
import { useNewsletters } from "../hooks/useNewsletters";
import { ApiError } from "../lib/apiError";
import { useAppForm } from "../lib/form";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
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
 * three ingest sources, then funnels into the matching ingest mutation and navigates to the Inbox.
 */
export function ImportForm({
  initialNewsletterId = null,
}: {
  /** Preselect a newsletter (e.g. when arriving from a newsletter's "Import an issue" link). */
  initialNewsletterId?: string | null;
}) {
  const navigate = useNavigate();
  const pasteMutation = useIngestPaste();
  const urlMutation = useIngestUrl();
  const uploadMutation = useIngestUpload();
  const {
    data: newsletters,
  } = useNewsletters();
  const {
    data: categories = [],
  } = useCategories();

  const [source, setSource] = useState<IngestSource>("paste");
  const [file, setFile] = useState<File | null>(null);
  const [addNewsletterOpen, setAddNewsletterOpen] = useState(false);

  // Refs keep the once-created onSubmit closure reading the latest file/actions.
  const fileRef = useRef(file);
  fileRef.current = file;
  const actionsRef = useRef({
    pasteMutation,
    urlMutation,
    uploadMutation,
    navigate,
  });
  actionsRef.current = {
    pasteMutation,
    urlMutation,
    uploadMutation,
    navigate,
  };

  const form = useAppForm({
    defaultValues: {
      source: "paste" as IngestSource,
      pastedContent: "",
      fetchUrl: "",
      newsletterId: initialNewsletterId,
      categoryId: "",
    },
    validators: {
      onChange: importFormSchema,
    },
    onSubmit: async ({
      value,
    }) => {
      const {
        pasteMutation: paste, urlMutation: url, uploadMutation: upload, navigate: go,
      }
        = actionsRef.current;
      const defaultCategoryId = value.categoryId || null;
      try {
        const result = value.source === "paste"
          ? await paste.mutateAsync({
            content: value.pastedContent,
            kind: "html",
            newsletterId: value.newsletterId,
            defaultCategoryId,
          })
          : value.source === "url"
            ? await url.mutateAsync({
              url: value.fetchUrl,
              newsletterId: value.newsletterId,
              defaultCategoryId,
            })
            : fileRef.current
              ? await upload.mutateAsync({
                file: fileRef.current,
                newsletterId: value.newsletterId,
                defaultCategoryId,
              })
              : null;
        if (!result) return;
        // Ingest is queued and processed in the background — the links appear in the Inbox as the
        // worker finishes (a per-import completion toast fires then, and progress shows in the header).
        notifySuccess("Import queued — links will appear in your Inbox as they're processed.");
        void go({
          to: "/inbox",
        });
      }
      catch (err) {
        notifyError(err instanceof ApiError ? err.message : "Couldn't import those links.");
      }
    },
  });

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <div className="space-y-2">
        <form.AppField name="newsletterId">
          {field => (
            <field.ComboboxField
              label="Newsletter"
              placeholder="No newsletter"
              searchPlaceholder="Search newsletters…"
              emptyText="No newsletters found."
              options={(newsletters ?? []).map(newsletter => ({
                value: newsletter.id,
                label: newsletter.name,
              }))}
            />
          )}
        </form.AppField>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Approved bookmarks inherit this newsletter&apos;s default category, tags, and media type, and
            belong to this issue.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddNewsletterOpen(true)}
          >
            New newsletter
          </Button>
        </div>
      </div>

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
                label="Pasted content"
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
                label="Webpage or newsletter URL"
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

      <form.AppField name="categoryId">
        {field => (
          <field.ComboboxField
            label="Category for all links (optional)"
            placeholder="No category"
            searchPlaceholder="Search categories…"
            emptyText="No categories found."
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

      <form.AppForm>
        <form.SubmitButton
          label="Import links"
          pendingLabel="Queuing…"
          disabledWhen={source === "upload" && !file}
        />
      </form.AppForm>

      <AddNewsletterModal
        open={addNewsletterOpen}
        onOpenChange={setAddNewsletterOpen}
        onCreated={newsletter => form.setFieldValue("newsletterId", newsletter.id)}
      />
    </form>
  );
}
