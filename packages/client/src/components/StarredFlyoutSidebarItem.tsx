import type { ReactNode } from "react";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarCountBadge } from "./SidebarCountBadge";
import { useIsMobile } from "../hooks/use-mobile";
import { useFlyoutHover } from "../hooks/useFlyoutHover";

import { Badge } from "@/components/ui/badge";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** One link in a flyout — a fixed sub-taxonomy shortcut or a starred member. */
export interface FlyoutLink {
  id: string;
  label: string;
  icon: ReactNode;
  /** Route path; rendered `<Link to={to as any}>` (dynamic target, the pins/settings-favorites pattern). */
  to: string;
  count?: number;
}

/**
 * The data behind one sidebar item's flyout: the trigger, plus optional fixed shortcut links
 * (sub-taxonomies like Group Types) and/or the entity's starred members. Both empty → a plain link.
 */
interface SidebarFlyoutConfig {
  /** The section's own listing link + active-state prefix. */
  rootTo: string;
  /** Trigger icon (already-rendered node, so dynamic `CategoryIcon` etc. work). */
  triggerIcon: ReactNode;
  label: string;
  /** Heading shown above the starred group in the flyout. */
  starredTitle: string;
  count?: number;
  shortcuts?: FlyoutLink[];
  starred?: FlyoutLink[];
}

/** A single flyout row — shared by desktop popover + mobile inline list. */
function FlyoutLinkRow({
  link, onNavigate,
}: {
  link: FlyoutLink;
  onNavigate: () => void;
}) {
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      to={link.to as any}
      onClick={onNavigate}
      className="
        flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
        hover:bg-accent hover:text-accent-foreground
      "
    >
      {link.icon}
      <span className="flex-1 truncate">{link.label}</span>
      {link.count != null && link.count > 0
        ? (
          <Badge
            variant="secondary"
            className="shrink-0"
          >
            {link.count}
          </Badge>
        )
        : null}
    </Link>
  );
}

/** The flyout body: an optional shortcut group then an optional titled starred group. */
function FlyoutBody({
  config, onNavigate,
}: {
  config: SidebarFlyoutConfig;
  onNavigate: () => void;
}) {
  const shortcuts = config.shortcuts ?? [];
  const starred = config.starred ?? [];
  return (
    <>
      {shortcuts.length > 0
        ? (
          <div className="flex flex-col gap-0.5">
            {shortcuts.map(link => (
              <FlyoutLinkRow
                key={link.id}
                link={link}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )
        : null}
      {starred.length > 0
        ? (
          <>
            <p
              className="px-2 py-1 text-xs font-medium text-muted-foreground"
            >
              {config.starredTitle}
            </p>
            {starred.map(link => (
              <FlyoutLinkRow
                key={link.id}
                link={link}
                onNavigate={onNavigate}
              />
            ))}
          </>
        )
        : null}
    </>
  );
}

/**
 * The generic sidebar item with a hover flyout — subsumes the per-entity Categories/Tags/Groups/
 * Languages/Locations items. Desktop hovers a right-side popover; mobile toggles an inline list; when
 * the config has neither shortcuts nor starred members it renders a plain link (no flyout affordance).
 * Configs are built in `useSidebarFlyoutConfigs`.
 */
export function StarredFlyoutSidebarItem({
  config,
  pathname,
  sidebarState,
}: {
  config: SidebarFlyoutConfig;
  pathname: string;
  sidebarState?: string;
}) {
  const {
    t,
  } = useTranslation();
  const isMobile = useIsMobile();
  const {
    open, setOpen, openNow, closeSoon,
  } = useFlyoutHover();
  const [expanded, setExpanded] = useState(false);
  const isActive = pathname.startsWith(config.rootTo);
  const hasContent = (config.shortcuts?.length ?? 0) > 0 || (config.starred?.length ?? 0) > 0;
  const showTrailingContent = sidebarState !== "collapsed";

  const triggerButton = (
    <SidebarMenuButton
      asChild
      isActive={isActive}
      tooltip={config.label}
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Link to={config.rootTo as any}>
        {config.triggerIcon}
        <span className="flex-1 truncate">{config.label}</span>
        {showTrailingContent && config.count != null && config.count > 0
          ? (
            <Badge
              variant="secondary"
              className="shrink-0"
            >
              {config.count}
            </Badge>
          )
          : null}
        {showTrailingContent && hasContent && !isMobile
          ? (
            <ChevronRight
              aria-hidden="true"
              className="size-3.5 shrink-0 text-muted-foreground"
            />
          )
          : null}
      </Link>
    </SidebarMenuButton>
  );

  if (!hasContent) {
    return (
      <SidebarMenuItem>
        {triggerButton}
        <SidebarCountBadge
          count={config.count}
          sidebarState={sidebarState ?? "expanded"}
        />
      </SidebarMenuItem>
    );
  }

  if (isMobile) {
    return (
      <>
        <SidebarMenuItem>
          {triggerButton}
          <SidebarMenuAction
            aria-label={expanded
              ? t("Hide {{label}} shortcuts", {
                label: config.label,
              })
              : t("Show {{label}} shortcuts", {
                label: config.label,
              })}
            onClick={() => setExpanded(value => !value)}
          >
            <ChevronDown
              className={`
                transition-transform duration-200
                ${expanded ? "" : "-rotate-90"}
              `}
            />
          </SidebarMenuAction>
        </SidebarMenuItem>
        {expanded
          ? (
            <SidebarMenuItem className="px-1 pb-1">
              <FlyoutBody
                config={config}
                onNavigate={() => setExpanded(false)}
              />
            </SidebarMenuItem>
          )
          : null}
      </>
    );
  }

  return (
    <SidebarMenuItem>
      <Popover
        open={open}
        onOpenChange={setOpen}
      >
        <PopoverAnchor asChild>
          <div
            onMouseEnter={openNow}
            onMouseLeave={closeSoon}
          >
            {triggerButton}
          </div>
        </PopoverAnchor>
        <PopoverContent
          side="right"
          align="start"
          className="w-56 p-2"
          onOpenAutoFocus={e => e.preventDefault()}
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <FlyoutBody
            config={config}
            onNavigate={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </SidebarMenuItem>
  );
}
