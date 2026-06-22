import type { SettingsPage } from "@/lib/settingsPages";
import type { FavoriteSettingsPage } from "@eesimple/types";

import { Star } from "lucide-react";

import {
  useAddFavoriteSettingsPage,
  useFavoriteSettingsPages,
  useRemoveFavoriteSettingsPage,
} from "../hooks/useFavoriteSettingsPages";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Header toolbar control that favorites / un-favorites the current Settings page. Rendered only when
 * the current page is a favoritable {@link SettingsPage} (the header gates on a non-null page).
 * Mirrors the toggle half of {@link HeaderPinButton}. Favorited pages surface in the sidebar
 * Settings flyout.
 */
export function HeaderSettingsFavoriteButton({
  page,
}: {
  page: SettingsPage;
}) {
  const {
    data: favorites = [],
  } = useFavoriteSettingsPages();
  const addFavorite = useAddFavoriteSettingsPage();
  const removeFavorite = useRemoveFavoriteSettingsPage();

  const favorited = favorites.find((f: FavoriteSettingsPage) => f.path === page.path);
  const isFavorited = Boolean(favorited);

  function toggle() {
    if (favorited) {
      removeFavorite.mutate(favorited.id);
    }
    else {
      addFavorite.mutate({
        path: page.path,
      });
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isFavorited ? `Unfavorite ${page.label}` : `Favorite ${page.label}`}
      aria-pressed={isFavorited}
      onClick={toggle}
    >
      <Star
        className={cn("size-4", isFavorited && "fill-current text-yellow-500")}
      />
    </Button>
  );
}
