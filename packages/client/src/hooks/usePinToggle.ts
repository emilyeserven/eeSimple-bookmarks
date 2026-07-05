import type { PinContext } from "@/components/HeaderPinButton";
import type { PinnedSidebarItem } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { useAddPinnedSidebarItem, usePinnedSidebarItems, useRemovePinnedSidebarItem } from "@/hooks/usePinnedSidebarItems";

/**
 * Pinned state + toggle for the current page's entity. Shared by `HeaderPinButton` (desktop toggle)
 * and the header More menu's pin item, so both stay in sync.
 */
export function usePinToggle(context: PinContext) {
  const {
    t,
  } = useTranslation();
  const {
    data: pins = [],
  } = usePinnedSidebarItems();
  const addPin = useAddPinnedSidebarItem();
  const removePin = useRemovePinnedSidebarItem();

  const pinned = pins.find(
    (p: PinnedSidebarItem) => p.entityType === context.entityType && p.entityId === context.entityId,
  );

  function toggle() {
    if (pinned) {
      removePin.mutate(pinned.id);
    }
    else {
      addPin.mutate({
        entityType: context.entityType,
        entityId: context.entityId,
      });
    }
  }

  return {
    isPinned: Boolean(pinned),
    name: context.label ?? t("this item"),
    toggle,
  };
}
