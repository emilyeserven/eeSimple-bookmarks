import type { IngestSource } from "./newsletterImportFormSchema";

import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { AddNewsletterModal } from "./AddNewsletterModal";
import { NewsletterFileField } from "./NewsletterFileField";
import { newsletterImportSchema } from "./newsletterImportFormSchema";
import {
  useIngestPaste,
  useIngestUpload,
  useIngestUrl,
} from "../hooks/useNewsletterImports";
import { useNewsletters } from "../hooks/useNewsletters";
import { ApiError } from "../lib/apiError";
import { useAppForm } from "../lib/form";
import { notifyError, notifySuccess } from "../lib/notifications";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

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
export function NewsletterImportForm({
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

  const [source, setSource] = useState<IngestSource>("paste");
  const [file, setFile] = useState<File | null>(null);
  const [enrich, setEnrich] = useState(false);
  const [addNewsletterOpen, setAddNewsletterOpen] = useState(false);

  // Refs keep the once-created onSubmit closure reading the latest file/enrich/actions.
  const fileRef = useRef(file);
  fileRef.current = file;
  const enrichRef = useRef(enrich);
  enrichRef.current = enrich;
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
      try {
        const result = value.source === "paste"
          ? await paste.mutateAsync({
            content: value.pastedContent,
            kind: "auto",
            enrich: enrichRef.current,
            newsletterId: value.newsletterId,
          })
          : value.source === "url"
            ? await url.mutateAsync({
              url: value.fetchUrl,
              enrich: enrichRef.current,
              newsletterId: value.newsletterId,
            })
            : fileRef.current
              ? await upload.mutateAsync({
                file: fileRef.current,
                enrich: enrichRef.current,
                newsletterId: value.newsletterId,
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
              <field.TextareaField
                label="Newsletter content"
                placeholder="Paste the newsletter's HTML or plain text…"
                rows={10}
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

      <div className="flex items-center gap-2">
        <Checkbox
          id="enrich"
          checked={enrich}
          onCheckedChange={checked => setEnrich(checked === true)}
        />
        <Label
          htmlFor="enrich"
          className="font-normal"
        >
          Fetch titles &amp; previews now (slower)
        </Label>
      </div>

      <form.AppForm>
        <form.SubmitButton
          label="Extract links"
          pendingLabel="Extracting…"
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
