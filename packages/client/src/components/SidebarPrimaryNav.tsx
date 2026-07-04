import type { useAppSidebarData } from "./useAppSidebarData";

import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { SidebarCountBadge } from "./SidebarCountBadge";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { navItems } from "@/lib/sidebarNavItems";

type SidebarData = ReturnType<typeof useAppSidebarData>;

/** One pinned entity/filter link with its count badge. */
function SidebarPinItem({
  pin, sidebarState,
}: {
  pin: SidebarData["resolvedPins"][number];
  sidebarState: string;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={pin.isActive}
        tooltip={pin.label}
      >
        {pin.link.kind === "path"
          ? (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Link to={pin.link.path as any}>
              {pin.icon}
              <span>{pin.label}</span>
            </Link>
          )
          : (
            <Link
              to="/bookmarks"
              search={pin.link.search}
            >
              {pin.icon}
              <span>{pin.label}</span>
            </Link>
          )}
      </SidebarMenuButton>
      <SidebarCountBadge
        count={pin.bookmarkCount}
        sidebarState={sidebarState}
      />
    </SidebarMenuItem>
  );
}

/** A "Show More" / "See All" / "Show Less" pagination affordance row for the pinned list. */
function PinPaginationItem({
  show, tooltip, label, direction, onClick,
}: {
  show: boolean;
  tooltip: string;
  label: string;
  direction: "down" | "up";
  onClick: () => void;
}) {
  if (!show) return null;
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={tooltip}
        onClick={onClick}
        className="text-xs text-muted-foreground"
      >
        {direction === "down"
          ? <ChevronDown className="size-4" />
          : (
            <ChevronUp
              className="size-4"
            />
          )}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

/** The always-visible top nav group: the static nav links plus the user's pinned items. */
export function SidebarPrimaryNav({
  pathname,
  sidebarState,
  inboxCount,
  bookmarkCount,
  resolvedPins,
  pagination,
  setPinnedExpanded,
  setPinnedShowAll,
}: {
  pathname: string;
  sidebarState: string;
  inboxCount: number | null | undefined;
  bookmarkCount: number | null | undefined;
  resolvedPins: SidebarData["resolvedPins"];
  pagination: SidebarData["pagination"];
  setPinnedExpanded: (v: boolean) => void;
  setPinnedShowAll: (v: boolean) => void;
}) {
  const {
    t,
  } = useTranslation();
  const {
    visiblePins, hasShowMore, hasSeeAll, hasShowLess,
  } = pagination;
  const notCollapsed = sidebarState !== "collapsed";
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive
              = item.to === "/"
                ? pathname === "/"
                : pathname.startsWith(item.to);
            return (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.title}
                >
                  <Link to={item.to}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
                {item.to === "/inbox"
                  ? (
                    <SidebarCountBadge
                      count={inboxCount}
                      sidebarState={sidebarState}
                    />
                  )
                  : null}
                {item.to === "/bookmarks"
                  ? (
                    <SidebarCountBadge
                      count={bookmarkCount}
                      sidebarState={sidebarState}
                    />
                  )
                  : null}
              </SidebarMenuItem>
            );
          })}
          {resolvedPins.length > 0
            ? (
              <>
                {visiblePins.map(pin => (
                  <SidebarPinItem
                    key={pin.id}
                    pin={pin}
                    sidebarState={sidebarState}
                  />
                ))}
                <PinPaginationItem
                  show={hasShowMore && notCollapsed}
                  tooltip={t("Show more pinned items")}
                  label={t("Show More")}
                  direction="down"
                  onClick={() => setPinnedExpanded(true)}
                />
                <PinPaginationItem
                  show={hasSeeAll && notCollapsed}
                  tooltip={t("Show all pinned items")}
                  label={t("See All")}
                  direction="down"
                  onClick={() => setPinnedShowAll(true)}
                />
                <PinPaginationItem
                  show={hasShowLess && notCollapsed}
                  tooltip={t("Show fewer pinned items")}
                  label={t("Show Less")}
                  direction="up"
                  onClick={() => {
                    setPinnedExpanded(false);
                    setPinnedShowAll(false);
                  }}
                />
              </>
            )
            : null}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
