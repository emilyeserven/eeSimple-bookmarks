import { useRef, useState } from "react";

import { Link } from "@tanstack/react-router";
import { Settings, Star } from "lucide-react";

import { useFavoriteSettingsPages } from "../hooks/useFavoriteSettingsPages";
import { SETTINGS_PAGES } from "../lib/settingsPages";

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** A favorited settings page resolved to its registry label, keyed by the favorite row id. */
interface ResolvedFavorite {
  id: string;
  path: string;
  label: string;
}

/**
 * Sidebar footer Settings button with a hover-driven flyout of the user's favorited settings pages.
 * Clicking the button still navigates to `/settings`; hovering it (or the flyout) opens the list.
 * Pages are favorited from the header star ({@link HeaderSettingsFavoriteButton}). Labels come from
 * the `SETTINGS_PAGES` registry, so a favorited path no longer in the registry is skipped.
 */
export function SettingsFavoritesFlyout({
  pathname,
}: {
  pathname: string;
}) {
  const {
    data: favorites = [],
  } = useFavoriteSettingsPages();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolved: ResolvedFavorite[] = favorites.flatMap((favorite) => {
    const page = SETTINGS_PAGES.find(p => p.path === favorite.path);
    return page
      ? [{
        id: favorite.id,
        path: page.path,
        label: page.label,
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
              <SidebarMenuButton
                size="lg"
                asChild
                isActive={pathname.startsWith("/settings")}
                tooltip="Settings"
              >
                <Link to="/settings">
                  <div
                    className="
                      flex aspect-square size-8 items-center justify-center
                      rounded-lg bg-sidebar-primary
                      text-sidebar-primary-foreground
                    "
                  >
                    <Settings className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm/tight">
                    <span className="truncate font-semibold">Settings</span>
                    <span className="truncate text-xs">Manage preferences</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="right"
        align="end"
        className="w-56 p-2"
        onOpenAutoFocus={e => e.preventDefault()}
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
      >
        <p
          className="px-2 pb-1 text-xs font-medium text-muted-foreground"
        >
          Favorited Settings
        </p>
        {resolved.length > 0
          ? (
            <ul className="grid gap-0.5">
              {resolved.map(favorite => (
                <li key={favorite.id}>
                  <Link
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    to={favorite.path as any}
                    onClick={() => setOpen(false)}
                    className="
                      flex items-center gap-2 rounded-md px-2 py-1.5 text-sm
                      hover:bg-accent hover:text-accent-foreground
                    "
                  >
                    <Star
                      className="size-3.5 shrink-0 fill-current text-yellow-500"
                    />
                    <span className="truncate">{favorite.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
          : (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Star a settings page to add it here.
            </p>
          )}
      </PopoverContent>
    </Popover>
  );
}
