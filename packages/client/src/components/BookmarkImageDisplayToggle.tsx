import type { ImageDisplayPreference } from "@eesimple/types";

import { Camera, ImageIcon, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function useOptions(): { value: ImageDisplayPreference;
  label: string;
  Icon: typeof Sparkles; }[] {
  const {
    t,
  } = useTranslation();
  return [
    {
      value: "auto",
      label: t("Automatic (image, falling back to screenshot)"),
      Icon: Sparkles,
    },
    {
      value: "image",
      label: t("Always use the image"),
      Icon: ImageIcon,
    },
    {
      value: "screenshot",
      label: t("Always use the screenshot"),
      Icon: Camera,
    },
  ];
}

interface BookmarkImageDisplayToggleProps {
  value: ImageDisplayPreference;
  onChange: (preference: ImageDisplayPreference) => void;
  hasImage: boolean;
  hasScreenshot: boolean;
  disabled?: boolean;
}

/**
 * Picks which of a bookmark's two image sources (uploaded/scraped image vs. page screenshot) the
 * cover displays. "Image"/"Screenshot" are disabled when that source doesn't exist yet; the
 * resolution itself lives in {@link resolveBookmarkDisplayImage} (`lib/bookmarkImage.ts`).
 */
export function BookmarkImageDisplayToggle({
  value, onChange, hasImage, hasScreenshot, disabled = false,
}: BookmarkImageDisplayToggleProps) {
  const {
    t,
  } = useTranslation();
  const options = useOptions();
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold">{t("Cover image:")}</span>
      <ToggleGroup
        type="single"
        size="sm"
        variant="outline"
        value={value}
        onValueChange={(next) => {
          if (next === "auto" || next === "image" || next === "screenshot") onChange(next);
        }}
        aria-label={t("Which image source the bookmark's cover displays")}
      >
        {options.map(({
          value: optionValue, label, Icon,
        }) => {
          const optionDisabled = disabled
            || (optionValue === "image" && !hasImage)
            || (optionValue === "screenshot" && !hasScreenshot);
          return (
            <Tooltip key={optionValue}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={optionValue}
                  aria-label={label}
                  disabled={optionDisabled}
                  className={cn(
                    value === optionValue
                    && `
                      bg-primary text-primary-foreground
                      hover:bg-primary hover:text-primary-foreground
                    `,
                  )}
                >
                  <Icon className="size-3" />
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent>
                {optionDisabled
                  ? t("{{label}} (none captured yet)", {
                    label,
                  })
                  : label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
