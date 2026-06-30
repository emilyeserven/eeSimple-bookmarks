import type { IngestSource } from "./importFormSchema";

import { useRef, useState } from "react";

import { useNavigate } from "@tanstack/react-router";

import { importFormSchema } from "./importFormSchema";
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

interface UseImportFormParams {
  initialNewsletterId: string | null;
  onComplete?: () => void;
}

/**
 * State + submit orchestration for {@link ImportForm}: the ingest mutations, the source/file local
 * state, the latest-value refs, and the `useAppForm` instance whose `onSubmit` funnels into the
 * matching ingest mutation. Extracted to keep the component thin (the create-flow exception — this
 * stays submit-driven, not auto-save).
 */
export function useImportForm({
  initialNewsletterId,
  onComplete,
}: UseImportFormParams) {
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

  // Refs keep the once-created onSubmit closure reading the latest file/actions.
  const fileRef = useRef(file);
  fileRef.current = file;
  const actionsRef = useRef({
    pasteMutation,
    urlMutation,
    uploadMutation,
    navigate,
    onComplete,
  });
  actionsRef.current = {
    pasteMutation,
    urlMutation,
    uploadMutation,
    navigate,
    onComplete,
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
        pasteMutation: paste,
        urlMutation: url,
        uploadMutation: upload,
        navigate: go,
        onComplete: done,
      } = actionsRef.current;
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
        if (done) {
          done();
        }
        else {
          void go({
            to: "/inbox",
          });
        }
      }
      catch (err) {
        notifyError(err instanceof ApiError ? err.message : "Couldn't import those links.");
      }
    },
  });

  return {
    form,
    source,
    setSource,
    file,
    setFile,
    newsletters,
    categories,
  };
}
