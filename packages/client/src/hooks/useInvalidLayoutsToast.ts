import { useEffect, useRef } from "react";

import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useInvalidEntityLayouts } from "./useEntityLayouts";
import { notifyError } from "../lib/notifications";

const INVALID_LAYOUTS_TOAST_ID = "invalid-layouts";

/**
 * Watch the shared entity-layouts query and, when the server flags one or more stored layouts as
 * structurally invalid, fire a single error toast pointing the user to Settings → Advanced → Layout
 * Issues (where they can inspect + reset each). Ref-guarded and given a stable toast `id` so it fires
 * once per transition into the invalid state rather than on every render/refetch — mirrors
 * {@link useServerUnreachableToast}. Mount once, globally (see `RootLayout`).
 */
export function useInvalidLayoutsToast(): void {
  const {
    t,
  } = useTranslation();
  const navigate = useNavigate();
  const invalidLayouts = useInvalidEntityLayouts();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (invalidLayouts.length === 0) {
      // Reset once everything is valid again, so a future corruption re-notifies.
      notifiedRef.current = false;
      return;
    }
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    notifyError(t("A saved page layout is invalid and was reset to its default."), {
      id: INVALID_LAYOUTS_TOAST_ID,
      description: t("Open Settings → Advanced → Layout Issues to see what went wrong and fix it."),
      action: {
        label: t("View"),
        onClick: () => void navigate({
          to: "/settings/advanced/layout-issues",
        }),
      },
    });
  }, [invalidLayouts, navigate, t]);
}
