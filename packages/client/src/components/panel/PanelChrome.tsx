import { Pin, PinOff, X } from "lucide-react";

import { DrawerBreakpointsPopover } from "./DrawerBreakpointsPopover";
import { usePanelControls } from "./usePanelControls";

import { Button } from "@/components/ui/button";
import {
  useDisplayPreferenceSettings,
  usePanelPinned,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import { notifyError, notifySuccess } from "@/lib/notifications";

interface PanelChromeProps {
  /** Whether the panel is docked inline (vs. a floating overlay). */
  docked: boolean;
  /** Whether the current viewport width falls below a user-configured unpin breakpoint. */
  isBreakpointUnpinned: boolean;
}

/** Panel toolbar: a pin toggle (desktop only) and a close button (docked only). */
export function PanelChrome({
  docked,
  isBreakpointUnpinned,
}: PanelChromeProps) {
  const {
    close,
  } = usePanelControls();
  const pinned = usePanelPinned();
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();

  function togglePinned() {
    if (!displayData) return;
    const next = !pinned;
    update.mutate({
      ...displayData,
      panelPinned: next,
    }, {
      onSuccess: () => notifySuccess(next ? "Drawer pinned" : "Drawer unpinned"),
      onError: error => notifyError(error.message),
    });
  }

  return (
    <div className="flex items-center justify-between gap-1 px-4 pt-4">
      <div className="flex items-center gap-1">
        {!isBreakpointUnpinned && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="
              hidden size-7
              md:inline-flex
            "
            aria-label={pinned ? "Unpin panel" : "Pin panel"}
            aria-pressed={pinned}
            onClick={togglePinned}
          >
            {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
          </Button>
        )}
        {!isBreakpointUnpinned && pinned && <DrawerBreakpointsPopover />}
      </div>
      {docked
        ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Close panel"
            onClick={close}
          >
            <X className="size-4" />
          </Button>
        )
        : null}
    </div>
  );
}
