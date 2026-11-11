import type { MymindImportCard, MymindImportOptions } from "@eesimple/types";

import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { importApi } from "../lib/api/imports";
import { runMymindImport } from "../lib/mymindImportRunner";
import { notifyError, notifySuccess } from "../lib/notifications";

/** Everything a batch of new bookmarks (plus newly-created tags/websites/channels) can change. */
const AFFECTED_KEYS = [
  ["bookmarks"],
  ["tags"],
  ["categories"],
  ["media-types"],
  ["websites"],
  ["youtube-channels"],
] as const;

/**
 * Run a mymind import: posts the parsed cards in batches (see `runMymindImport`), exposing live
 * `progress`, then invalidates every list the new bookmarks touch and fires one recorded toast.
 */
export function useMymindImport() {
  const {
    t,
  } = useTranslation();
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<{ done: number;
    total: number; } | null>(null);

  const mutation = useMutation({
    mutationFn: ({
      cards, options,
    }: { cards: MymindImportCard[];
      options: MymindImportOptions; }) => {
      setProgress({
        done: 0,
        total: cards.length,
      });
      return runMymindImport(cards, options, importApi.importMymind, (done, total) => setProgress({
        done,
        total,
      }));
    },
    onSuccess: (summary) => {
      for (const queryKey of AFFECTED_KEYS) {
        void queryClient.invalidateQueries({
          queryKey,
        });
      }
      const message = t("mymind import: {{created}} created, {{duplicates}} already saved, {{failed}} failed", {
        created: summary.created,
        duplicates: summary.duplicates,
        failed: summary.failed,
      });
      if (summary.failed > 0) notifyError(message);
      else notifySuccess(message);
    },
    onError: (err) => {
      notifyError(t("mymind import failed: {{message}}", {
        message: err.message,
      }));
    },
  });

  return {
    ...mutation,
    progress,
  };
}
