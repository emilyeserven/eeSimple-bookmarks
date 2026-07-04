import type { LucideIcon } from "lucide-react";

import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { ChevronDown, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "../hooks/use-mobile";
import { useFavoriteSettingsPages } from "../hooks/useFavoriteSettingsPages";
import { SETTINGS_PAGES } from "../lib/settingsPages";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** A favorited settings page resolved to its registry label + icon, keyed by the favorite row id. */
interface ResolvedFavorite {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

/** The favorited-pages list (or empty-state) shared by the desktop flyout and the mobile inline view. */
function FavoritesList({
  resolved,
  onNavigate,
}: {
  resolved: readonly ResolvedFavorite[];
  onNavigate: () => void;
}) {
  const {
    t,
  } = useTranslation();
  if (resolved.length === 0) {
    return (
      <p className="px-2 py-1.5 text-sm text-muted-foreground">
        {t("Star a settings page to add it here.")}
      </p>
    );
  }
  return (
    <ul className="grid gap-0.5">
      {resolved.map(favorite => (
        <li key={favorite.id}>
          <Link
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            to={favorite.path as any}
            onClick={onNavigate}
            className="
              flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
              hover:bg-accent hover:text-accent-foreground
            "
          >
            <favorite.icon className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{t(favorite.label)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * Sidebar footer Settings button with the user's favorited settings pages. On desktop, hovering the
 * button (or the flyout) opens a popover **above** it; on mobile, a chevron expands the list inline
 * (hover popovers don't work on touch). Clicking the button still navigates to `/settings`. Pages
 * are favorited from the header star ({@link HeaderSettingsFavoriteButton}); their label and icon
 * come from the `SETTINGS_PAGES` registry, so a favorited path no longer in the registry is skipped.
 */
export function SettingsFavoritesFlyout({
  pathname,
}: {
  pathname: string;
}) {
  const {
    t,
  } = useTranslation();
  const {
    data: favorites = [],
  } = useFavoriteSettingsPages();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolved: ResolvedFavorite[] = favorites.flatMap((favorite) => {
    const page = SETTINGS_PAGES.find(p => p.path === favorite.path);
    return page
      ? [{
        id: favorite.id,
        path: page.path,
        label: page.label,
        icon: page.icon,
      }]
      : [];
  });

  function cancelClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openNow() {
    cancelClose();
    setOpen(true);
  }

  function closeSoon() {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  const settingsButton = (
    <SidebarMenuButton
      size="lg"
      asChild
      isActive={pathname.startsWith("/settings")}
      tooltip={t("Settings")}
    >
      <Link to="/settings">
        <div
          className="
            flex aspect-square size-8 items-center justify-center rounded-lg
            bg-sidebar-primary text-sidebar-primary-foreground
          "
        >
          <Settings className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm/tight">
          <span className="truncate font-semibold">{t("Settings")}</span>
          <span className="truncate text-xs">{t("Manage preferences")}</span>
        </div>
      </Link>
    </SidebarMenuButton>
  );

  // On touch, expand the favorites inline above the button rather than relying on a hover popover.
  if (isMobile) {
    return (
      <SidebarMenu>
        {expanded
          ? (
            <SidebarMenuItem className="px-1 pb-1">
              <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">
                {t("Favorited Settings")}
              </p>
              <FavoritesList
                resolved={resolved}
                onNavigate={() => setExpanded(false)}
              />
            </SidebarMenuItem>
          )
          : null}
        <SidebarMenuItem>
          {settingsButton}
          <SidebarMenuAction
            aria-label={expanded ? t("Hide favorited settings") : t("Show favorited settings")}
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
      </SidebarMenu>
    );
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverAnchor asChild>
        <div
          onMouseEnter={openNow}
          onMouseLeave={closeSoon}
        >
          <SidebarMenu>
            <SidebarMenuItem>
              {settingsButton}
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="top"
        align="start"
        className="w-56 p-2"
        onOpenAutoFocus={e => e.preventDefault()}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <p
          className="px-2 pb-1 text-xs font-medium text-muted-foreground"
        >
          {t("Favorited Settings")}
        </p>
        <FavoritesList
          resolved={resolved}
          onNavigate={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
