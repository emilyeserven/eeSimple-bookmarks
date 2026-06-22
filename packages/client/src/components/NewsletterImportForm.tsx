import type { IngestSource } from "./newsletterImportFormSchema";

import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { NewsletterFileField } from "./NewsletterFileField";
import { newsletterImportSchema } from "./newsletterImportFormSchema";
import { useCategories } from "../hooks/useCategories";
import {
  useIngestPaste,
  useIngestUpload,
  useIngestUrl,
} from "../hooks/useNewsletterImports";
import { ApiError } from "../lib/apiError";
import { useAppForm } from "../lib/form";
import { notifyError, notifySuccess } from "../lib/notifications";

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
 * Submit-style create form for a newsletter import (the create-flow exception — not auto-save). Picks
 * one of three ingest sources, then funnels into the matching ingest mutation and navigates to the new
 * import's review queue.
 */
export function NewsletterImportForm() {
  const navigate = useNavigate();
  const pasteMutation = useIngestPaste();
  const urlMutation = useIngestUrl();
  const uploadMutation = useIngestUpload();
  const {
    data: categories = [],
  } = useCategories();

  const [source, setSource] = useState<IngestSource>("paste");
  const [file, setFile] = useState<File | null>(null);

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
      categoryId: "",
    },
    validators: {
      onChange: newsletterImportSchema,
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
            defaultCategoryId,
          })
          : value.source === "url"
            ? await url.mutateAsync({
              url: value.fetchUrl,
              defaultCategoryId,
            })
            : fileRef.current
              ? await upload.mutateAsync({
                file: fileRef.current,
                defaultCategoryId,
              })
              : null;
        if (!result) return;
        const count = result.items.length;
        notifySuccess(`Imported ${count} link${count === 1 ? "" : "s"} for review`);
        void go({
          to: "/newsletters/$importId",
          params: {
            importId: result.id,
          },
        });
      }
      catch (err) {
        notifyError(err instanceof ApiError ? err.message : "Couldn't import that newsletter.");
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
                label="Newsletter content"
                hint="Paste the newsletter here — links are preserved."
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
                label="Newsletter URL"
                type="url"
                placeholder="https://…/the-view-in-browser-link"
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
          label="Extract links"
          pendingLabel="Extracting…"
          disabledWhen={source === "upload" && !file}
        />
      </form.AppForm>
    </form>
  );
}
