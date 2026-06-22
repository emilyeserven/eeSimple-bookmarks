import type { BookmarkDetailLayout } from "@eesimple/types";

import {
  useBookmarkDetailLayout,
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "../hooks/useAppSettings";
import { notifyError, notifySuccess } from "../lib/notifications";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/**
 * The bookmark-detail layout chooser body (single / tabbed). Shared by `BookmarkDetailLayoutPopover`
 * (desktop popover) and the header More menu's mobile modal — the single source of truth. The choice
 * is a global, server-persisted preference (`bookmarkDetailLayout`) and fires a recorded toast.
 */
export function BookmarkDetailLayoutControls() {
  const layout = useBookmarkDetailLayout();
  const {
    data,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();

  function setLayout(next: BookmarkDetailLayout) {
    if (!data) return;
    update.mutate({
      ...data,
      bookmarkDetailLayout: next,
    }, {
      onSuccess: () => notifySuccess(next === "tabbed" ? "Detail layout: tabbed" : "Detail layout: single"),
      onError: error => notifyError(error.message),
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
        Single
      </ToggleGroupItem>
      <ToggleGroupItem
        value="tabbed"
        className="
          rounded-none
          last:rounded-r-sm
        "
      >
        Tabbed
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
