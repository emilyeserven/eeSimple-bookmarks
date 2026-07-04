import type { BookmarkDetailLayout } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import {
  useBookmarkDetailLayout,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * The bookmark-detail layout chooser body (single / tabbed). Shared by `BookmarkDetailLayoutPopover`
 * (desktop popover) and the header More menu's mobile modal — the single source of truth. The choice
 * is a global, server-persisted preference (`bookmarkDetailLayout`) and fires a recorded toast.
 */
export function BookmarkDetailLayoutControls() {
  const {
    t,
  } = useTranslation();
  const layout = useBookmarkDetailLayout();
  const {
    data,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();

  function setLayout(next: BookmarkDetailLayout) {
    if (!data) return;
    update.mutate({
      input: {
        ...data,
        bookmarkDetailLayout: next,
      },
      successMessage: next === "tabbed" ? t("Detail layout: tabbed") : t("Detail layout: single"),
    });
  }

  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={layout}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) setLayout(next as "single" | "tabbed");
      }}
    >
      <ToggleGroupItem
        value="single"
        className="
          rounded-none border-r border-input
          first:rounded-l-sm
        "
      >
        {t("Single")}
      </ToggleGroupItem>
      <ToggleGroupItem
        value="tabbed"
        className="
          rounded-none
          last:rounded-r-sm
        "
      >
        {t("Tabbed")}
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
