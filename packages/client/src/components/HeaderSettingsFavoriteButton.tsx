import type { SettingsPage } from "@/lib/settingsPages";

import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSettingsFavorite } from "@/hooks/useSettingsFavorite";
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
    isFavorited, toggle,
  } = useSettingsFavorite(page);

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
