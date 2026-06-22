import type { PinContext } from "@/components/HeaderPinButton";
import type { SettingsPage } from "@/lib/settingsPages";

import { Pin, PinOff, Star } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { usePinToggle } from "@/hooks/usePinToggle";
import { useSettingsFavorite } from "@/hooks/useSettingsFavorite";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

/** Mobile search modal body — the same `uiStore` query the desktop inline search bar reads/writes. */
export function SearchControls() {
  const headerSearchQuery = useUiStore(state => state.headerSearchQuery);
  const setHeaderSearchQuery = useUiStore(state => state.setHeaderSearchQuery);
  return (
    <Input
      type="text"
      placeholder="Search…"
      value={headerSearchQuery}
      onChange={e => setHeaderSearchQuery(e.target.value)}
      autoFocus
    />
  );
}

/** Favorite/un-favorite the current Settings page from the More menu. */
export function FavoriteMenuItem({
  page,
}: {
  page: SettingsPage;
}) {
  const {
    isFavorited, toggle,
  } = useSettingsFavorite(page);
  return (
    <DropdownMenuItem onSelect={toggle}>
      <Star
        className={cn("size-4", isFavorited && "fill-current text-yellow-500")}
      />
      {isFavorited ? `Unfavorite ${page.label}` : `Favorite ${page.label}`}
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
    isPinned, name, toggle,
  } = usePinToggle(context);
  return (
    <DropdownMenuItem onSelect={toggle}>
      {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      {isPinned ? `Unpin ${name}` : `Pin ${name}`}
    </DropdownMenuItem>
  );
}
