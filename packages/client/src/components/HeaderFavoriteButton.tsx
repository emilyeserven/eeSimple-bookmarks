import type { FavoriteContext } from "@/hooks/useFavoriteToggle";

import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { cn } from "@/lib/utils";

/**
 * Header toolbar control that stars / un-stars the current entity ({@link FavoriteContext}, resolved
 * generically by `useHeaderFavoriteContext`). Rendered only when the current page is a favoritable
 * entity detail page. Starred items surface in that entity's sidebar flyout.
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
    toggle,
  } = useFavoriteToggle(context.kind);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={context.isFavorite
        ? t("Unstar {{name}}", {
          name: context.label,
        })
        : t("Star {{name}}", {
          name: context.label,
        })}
      aria-pressed={context.isFavorite}
      onClick={() => toggle({
        id: context.entityId,
        name: context.label,
        isFavorite: context.isFavorite,
      })}
    >
      <Star
        className={cn("size-4", context.isFavorite && `
          fill-current text-yellow-500
        `)}
      />
    </Button>
  );
}
