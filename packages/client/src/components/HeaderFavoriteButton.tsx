import type { FavoriteContext } from "@/hooks/useFavoriteToggle";

import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { cn } from "@/lib/utils";

/**
 * Header toolbar control that stars / un-stars the current category or tag ({@link FavoriteContext}).
 * Rendered only when the current page is a favoritable taxonomy entity. Starred items surface in the
 * sidebar Categories / Tags flyouts. Mirrors the toggle half of {@link HeaderPinButton}.
 */
export function HeaderFavoriteButton({
  context,
}: {
  context: FavoriteContext;
}) {
  const {
    t,
  } = useTranslation();
  const {
    isFavorite, name, toggle,
  } = useFavoriteToggle(context);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isFavorite
        ? t("Unstar {{name}}", {
          name,
        })
        : t("Star {{name}}", {
          name,
        })}
      aria-pressed={isFavorite}
      onClick={toggle}
    >
      <Star
        className={cn("size-4", isFavorite && "fill-current text-yellow-500")}
      />
    </Button>
  );
}
