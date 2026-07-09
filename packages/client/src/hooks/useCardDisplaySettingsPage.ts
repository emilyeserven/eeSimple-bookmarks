import type { CardDisplayConfig } from "@eesimple/types";

import { useCallback, useEffect, useState } from "react";

import { useCardDisplayConfig, useUpdateCardDisplayConfig } from "./useCardDisplayConfig";
import i18n from "../i18n";
import { describeError } from "../lib/apiError";
import { notifyError, notifySuccess } from "../lib/notifications";

/**
 * Owns the Card Display settings page's draft + per-field auto-save. The draft is seeded from the
 * server config and updated optimistically; each change persists via a partial `PUT` and fires a
 * field-named toast (the `toast-notifications` standard). There is no Save button.
 */
export function useCardDisplaySettingsPage() {
  const {
    data: config,
    isPending,
  } = useCardDisplayConfig();
  const update = useUpdateCardDisplayConfig();
  const [draft, setDraft] = useState<CardDisplayConfig | undefined>(undefined);

  useEffect(() => {
    if (config) setDraft(config);
  }, [config]);

  const persist = useCallback((patch: Partial<CardDisplayConfig>, label: string) => {
    setDraft(current => (current
      ? {
        ...current,
        ...patch,
      }
      : current));
    update.mutate(patch, {
      onSuccess: () => notifySuccess(i18n.t("{{field}} saved", {
        field: label,
      })),
      onError: (err: Error) => notifyError(describeError(err, i18n.t("Save failed"))),
    });
  }, [update]);

  return {
    draft,
    isPending,
    persist,
  };
}
