import type { ToolbarAction } from "./toolbarActions";

import React from "react";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

/** One row in the More menu: a self-contained item, or a modal-opening row. */
function MoreMenuRow({
  action,
  onOpenModal,
}: {
  action: ToolbarAction;
  onOpenModal: (key: string) => void;
}) {
  const mobile = action.mobile;
  if (mobile.kind === "menuItem") return <>{mobile.node}</>;
  if (mobile.kind === "modal") {
    const Icon = mobile.icon;
    return (
      <DropdownMenuItem
        disabled={mobile.disabled}
        onSelect={(e) => {
          e.preventDefault();
          onOpenModal(action.key);
        }}
      >
        <Icon className="size-4" />
        {mobile.label}
      </DropdownMenuItem>
    );
  }
  return null;
}

/**
 * Small-screen overflow: every collapsible action as an icon + label row in one ellipsis menu. Modal
 * controls open a `Dialog` rendered as a *sibling* of the dropdown — so the modal survives the
 * dropdown closing — keyed off `activeModal`.
 */
function HeaderMoreMenu({
  actions,
}: {
  actions: ToolbarAction[];
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [activeModal, setActiveModal] = React.useState<string | null>(null);

  return (
    <>
      <DropdownMenu
        open={menuOpen}
        onOpenChange={setMenuOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="More"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {actions.map(action => (
            <MoreMenuRow
              key={action.key}
              action={action}
              onOpenModal={(key) => {
                setMenuOpen(false);
                setActiveModal(key);
              }}
            />
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {actions.map(action => (
        action.mobile.kind === "modal"
          ? (
            <React.Fragment key={action.key}>
              {action.mobile.renderModal(activeModal === action.key, (open) => {
                if (!open) setActiveModal(null);
              })}
            </React.Fragment>
          )
          : null
      ))}
    </>
  );
}

/**
 * The right-side header toolbar. Wide screens render the inline row (separated by dividers); small
 * screens collapse every action except the panel toggle into the {@link HeaderMoreMenu}, keeping the
 * panel toggle standalone on the far right.
 */
export function HeaderToolbar({
  actions,
}: {
  actions: ToolbarAction[];
}) {
  const isMobile = useIsMobile();
  const standalone = actions.filter(a => a.mobile.kind === "standalone");
  const collapsible = actions.filter(a => a.mobile.kind !== "standalone");

  return (
    <div className="-mr-1 ml-auto flex items-center gap-1">
      {isMobile
        ? (
          <>
            {collapsible.length > 0 && <HeaderMoreMenu actions={collapsible} />}
            {standalone.map(action => (
              <React.Fragment key={action.key}>{action.desktop}</React.Fragment>
            ))}
          </>
        )
        : actions.map((action, i) => (
          <React.Fragment key={action.key}>
            {i > 0 && (
              <Separator
                orientation="vertical"
                className="h-4"
              />
            )}
            {action.desktop}
          </React.Fragment>
        ))}
    </div>
  );
}
