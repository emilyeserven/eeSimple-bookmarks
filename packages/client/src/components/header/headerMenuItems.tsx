import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";

import { Pin, PinOff, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
