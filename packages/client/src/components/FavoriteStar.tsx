import { Star } from "lucide-react";

import i18n from "@/i18n";
import { cn } from "@/lib/utils";

/**
 * Small filled star marking a user-starred (favorite) row in a combobox / picker list. Render it
 * only when the item is a favorite so starred entries — already hoisted to the top of their picker
 * by `sortFavoritesFirst` — are also visually distinguishable at a glance.
 */
export function FavoriteStar({
  className,
}: { className?: string }) {
  return (
    <Star
      className={cn("size-3.5 shrink-0 fill-amber-400 text-amber-400", className)}
      role="img"
      aria-label={i18n.t("Favorite")}
    />
  );
}
