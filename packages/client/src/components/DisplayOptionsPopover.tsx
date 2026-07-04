import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ListingDisplayControls } from "./ListingDisplayControls";

import { Button } from "@/components/ui/button";
import { ResponsivePopover } from "@/components/ui/responsive-popover";

interface DisplayOptionsPopoverProps {
  pageKey: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * The display-options control for listing pages: the card/table view toggle and grid column count.
 * A popover on desktop, a modal on small screens. Per-card field visibility and image presentation
 * are configured in Settings → Card Display Rules, not here.
 */
export function DisplayOptionsPopover({
  pageKey,
  open,
  onOpenChange,
}: DisplayOptionsPopoverProps) {
  const {
    t,
  } = useTranslation();
  return (
    <ResponsivePopover
      title={t("Display")}
      open={open}
      onOpenChange={onOpenChange}
      trigger={(
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("Display options")}
        >
          <Eye className="size-4" />
        </Button>
      )}
    >
      <ListingDisplayControls pageKey={pageKey} />
    </ResponsivePopover>
  );
}
