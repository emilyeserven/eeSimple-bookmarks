import type { PinContext } from "@/components/HeaderPinButton";
import type { FavoriteContext } from "@/hooks/useFavoriteToggle";
import type { SettingsPage } from "@/lib/settingsPages";

import { Pin, PinOff, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useFavoriteToggle } from "@/hooks/useFavoriteToggle";
import { usePinToggle } from "@/hooks/usePinToggle";
import { useSettingsFavorite } from "@/hooks/useSettingsFavorite";
import { cn } from "@/lib/utils";

/** Favorite/un-favorite the current Settings page from the More menu. */
export function FavoriteMenuItem({
  page,
}: {
  page: SettingsPage;
}) {
  const {
    t,
  } = useTranslation();
  const {
    isFavorited, toggle,
  } = useSettingsFavorite(page);
  return (
    <DropdownMenuItem onSelect={toggle}>
      <Star
        className={cn("size-4", isFavorited && "fill-current text-yellow-500")}
      />
      {isFavorited
        ? t("Unfavorite {{label}}", {
          label: page.label,
        })
        : t("Favorite {{label}}", {
          label: page.label,
        })}
    </DropdownMenuItem>
  );
}

/** Star/un-star the current entity from the More menu. */
export function FavoriteTaxonomyMenuItem({
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
    <DropdownMenuItem
      onSelect={() => toggle({
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
      {context.isFavorite
        ? t("Unstar {{name}}", {
          name: context.label,
        })
        : t("Star {{name}}", {
          name: context.label,
        })}
    </DropdownMenuItem>
  );
}

/** Pin/unpin the current page's entity from the More menu. */
export function PinMenuItem({
  context,
}: {
  context: PinContext;
}) {
  const {
    t,
  } = useTranslation();
  const {
    isPinned, name, toggle,
  } = usePinToggle(context);
  return (
    <DropdownMenuItem onSelect={toggle}>
      {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      {isPinned
        ? t("Unpin {{name}}", {
          name,
        })
        : t("Pin {{name}}", {
          name,
        })}
    </DropdownMenuItem>
  );
}
