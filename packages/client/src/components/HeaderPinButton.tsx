import type { PinnedSidebarEntityType } from "@eesimple/types";

import { Pin, PinOff } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { usePinToggle } from "@/hooks/usePinToggle";

/** The pinnable entity for the page the header is currently on. */
export interface PinContext {
  entityType: PinnedSidebarEntityType;
  entityId: string;
  label?: string;
}

/**
 * Header toolbar control for pinning — a context-aware toggle that pins/unpins the current page's
 * entity ({@link PinContext}). Rendered only when the current page has a pinnable entity.
 */
export function HeaderPinButton({
  context,
}: {
  context: PinContext;
}) {
  const {
    isPinned, name, toggle,
  } = usePinToggle(context);
  const {
    t,
  } = useTranslation();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isPinned
        ? t("Unpin {{name}}", {
          name,
        })
        : t("Pin {{name}}", {
          name,
        })}
      aria-pressed={isPinned}
      onClick={toggle}
    >
      {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
    </Button>
  );
}
