import { ChevronLeft, Pin, PinOff, X } from "lucide-react";

import { getContentType } from "./contentTypes";
import { PanelContent } from "./PanelContent";
import { usePanelControls } from "./usePanelControls";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useResizeHandle } from "@/hooks/useResizeHandle";
import { useCategories } from "@/hooks/useCategories";
import { useTagTree } from "@/hooks/useTags";
import { NEW_SENTINEL } from "@/lib/drawerSearch";
import type { DrawerContentType } from "@/lib/drawerSearch";
import { flattenTree } from "@/lib/tagTree";
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
  const panelWidth = useUiStore(state => state.panelWidth);
  const setPanelWidth = useUiStore(state => state.setPanelWidth);
  const {
    onPointerDown: onPanelResizePointerDown,
  } = useResizeHandle({
    direction: "left",
    currentWidth: panelWidth,
    onChange: setPanelWidth,
    min: 18,
    max: 40,
  });

  const docked = pinned && !isMobile;

  // Docked + closed: render nothing so the main content area spans the full width.
  if (docked) {
    if (!isOpen) return null;
    return (
      <aside
        className="
          relative hidden shrink-0 flex-col border-l bg-background
          md:flex
        "
        style={{
          width: `${panelWidth}rem`,
        }}
      >
        <div
          className="
            absolute inset-y-0 left-0 z-10 w-1 cursor-col-resize
            transition-colors
            hover:bg-border/60
          "
          onPointerDown={onPanelResizePointerDown}
        />
        <PanelChrome docked />
        <PanelBreadcrumbs />
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
        <PanelBreadcrumbs />
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

function usePanelItemLabel(dCT: DrawerContentType | null, dCId: string | null): string | null {
  const { data: tagTree } = useTagTree();
  const { data: categories } = useCategories();

  if (!dCId || dCId === NEW_SENTINEL || !dCT) return null;

  if (dCT === "tag") {
    return flattenTree(tagTree ?? []).find(({ node }) => node.id === dCId)?.node.name ?? null;
  }
  if (dCT === "category") {
    return categories?.find(c => c.id === dCId)?.name ?? null;
  }
  return null;
}

/** Breadcrumb navigation bar shown below the chrome when a content type is selected. */
function PanelBreadcrumbs() {
  const {
    dCT, dCId, open, openType,
  } = usePanelControls();

  const specificName = usePanelItemLabel(dCT ?? null, dCId ?? null);

  if (!dCT) return null;

  const def = getContentType(dCT);

  const atList = !dCId;
  const onBack = atList ? open : () => openType(dCT);

  const itemLabel = dCId
    ? (dCId === NEW_SENTINEL ? `New ${def.singular}` : (specificName ?? def.singular))
    : null;

  return (
    <div className="flex items-center gap-1 px-4 pb-2">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        aria-label={atList ? "Back to content types" : `Back to ${def.label}`}
        onClick={onBack}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink
              className="cursor-pointer"
              onClick={open}
            >
              Browse
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            {itemLabel
              ? (
                <BreadcrumbLink
                  className="cursor-pointer"
                  onClick={() => openType(dCT)}
                >
                  {def.label}
                </BreadcrumbLink>
              )
              : <BreadcrumbPage>{def.label}</BreadcrumbPage>}
          </BreadcrumbItem>
          {itemLabel
            ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{itemLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )
            : null}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
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
