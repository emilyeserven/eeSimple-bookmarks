import type { SettingsPage } from "@/lib/settingsPages";
import type { FavoriteSettingsPage } from "@eesimple/types";

import {
  useAddFavoriteSettingsPage,
  useFavoriteSettingsPages,
  useRemoveFavoriteSettingsPage,
} from "@/hooks/useFavoriteSettingsPages";

/**
 * Favorite/un-favorite state + toggle for a Settings page. Shared by `HeaderSettingsFavoriteButton`
 * (desktop star) and the header More menu's favorite item, so both stay in sync.
 */
export function useSettingsFavorite(page: SettingsPage) {
  const {
    data: favorites = [],
  } = useFavoriteSettingsPages();
  const addFavorite = useAddFavoriteSettingsPage();
  const removeFavorite = useRemoveFavoriteSettingsPage();

  const favorited = favorites.find((f: FavoriteSettingsPage) => f.path === page.path);

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

  return {
    isFavorited: Boolean(favorited),
    toggle,
  };
}
