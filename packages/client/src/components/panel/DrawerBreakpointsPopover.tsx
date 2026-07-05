import { Settings } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useDisplayPreferenceSettings,
  useUpdateDisplayPreferenceSettings,
} from "@/hooks/useAppSettings";
import i18n from "@/i18n";

const BREAKPOINT_OPTIONS = [
  {
    px: 640,
    label: i18n.t("640 px — Small (sm)"),
  },
  {
    px: 768,
    label: i18n.t("768 px — Medium (md)"),
  },
  {
    px: 1024,
    label: i18n.t("1024 px — Large (lg)"),
  },
  {
    px: 1280,
    label: i18n.t("1280 px — Extra Large (xl)"),
  },
  {
    px: 1536,
    label: i18n.t("1536 px — 2× Large (2xl)"),
  },
] as const;

/**
 * A gear button that opens a popover for choosing the viewport widths at which the pinned drawer
 * floats as an overlay instead of docking. Lives in the drawer toolbar next to the pin button.
 */
export function DrawerBreakpointsPopover() {
  const {
    data: displayData,
  } = useDisplayPreferenceSettings();
  const update = useUpdateDisplayPreferenceSettings();
  const {
    t,
  } = useTranslation();

  function toggleBreakpoint(px: number) {
    if (!displayData) return;
    const next = displayData.drawerUnpinnedBreakpoints.includes(px)
      ? displayData.drawerUnpinnedBreakpoints.filter(b => b !== px)
      : [...displayData.drawerUnpinnedBreakpoints, px];
    update.mutate({
      input: {
        ...displayData,
        drawerUnpinnedBreakpoints: next,
      },
      successMessage: t("Drawer breakpoints updated"),
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="
            hidden size-7
            md:inline-flex
          "
          aria-label={t("Drawer breakpoints")}
        >
          <Settings className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="space-y-3"
      >
        <div className="space-y-1">
          <p className="text-sm leading-none font-medium">{t("Unpin below viewport width")}</p>
          <p className="text-xs text-muted-foreground">
            {t("At these viewport widths the drawer floats as an overlay, even when pinned. Check every size at which you want it to float.")}
          </p>
        </div>
        <div className="space-y-3">
          {BREAKPOINT_OPTIONS.map(({
            px,
            label,
          }) => (
            <div
              key={px}
              className="flex items-center gap-2"
            >
              <Checkbox
                id={`breakpoint-${px}`}
                checked={displayData?.drawerUnpinnedBreakpoints.includes(px) ?? false}
                onCheckedChange={() => toggleBreakpoint(px)}
              />
              <Label htmlFor={`breakpoint-${px}`}>
                {t("Below {{label}}", {
                  label,
                })}
              </Label>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
