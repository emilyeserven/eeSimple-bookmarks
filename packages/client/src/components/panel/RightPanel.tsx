import { Pin, PinOff, X } from "lucide-react";

import { PanelContent } from "./PanelContent";
import { usePanelControls } from "./usePanelControls";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUiStore } from "@/stores/uiStore";

/**
 * The single shared right-hand panel. Its content is URL-driven (`dCT`/`dCId`); its presentation
 * depends on the pin preference and viewport: a docked inline column when pinned on desktop, or a
 * floating overlay drawer when unpinned — and always floating on mobile.
 */
export function RightPanel() {
  const {
    isOpen, close,
  } = usePanelControls();
  const isMobile = useIsMobile();
  const pinned = useUiStore(state => state.panelPinned);

  const docked = pinned && !isMobile;

  // Docked + closed: render nothing so the main content area spans the full width.
  if (docked) {
    if (!isOpen) return null;
    return (
      <aside
        className="
          hidden w-full max-w-md shrink-0 flex-col border-l bg-background
          md:flex
        "
      >
        <PanelChrome docked />
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <PanelContent />
        </div>
      </aside>
    );
  }

  // Floating (unpinned, or mobile): a controlled overlay drawer.
  return (
    <Sheet
      open={isOpen}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <SheetContent
        side="right"
        className="
          w-full flex-col
          sm:max-w-md
        "
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Panel</SheetTitle>
          <SheetDescription>Browse, view, and edit your content.</SheetDescription>
        </SheetHeader>
        <PanelChrome docked={false} />
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <PanelContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface PanelChromeProps {
  /** Whether the panel is docked inline (vs. a floating overlay). */
  docked: boolean;
}

/** Panel toolbar: a pin toggle (desktop only) and a close button (docked only). */
function PanelChrome({
  docked,
}: PanelChromeProps) {
  const {
    close,
  } = usePanelControls();
  const pinned = useUiStore(state => state.panelPinned);
  const setPanelPinned = useUiStore(state => state.setPanelPinned);

  return (
    <div className="flex items-center justify-between gap-1 px-4 pt-4">
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
        onClick={() => setPanelPinned(!pinned)}
      >
        {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      </Button>
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
