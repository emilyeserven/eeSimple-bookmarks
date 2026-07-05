import type { RuleDisplayValue } from "./CardDisplayRuleDisplaySettings";
import type {
  BookmarkImageVisibility,
  HomepageSectionImageLayout,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { OnOffToggleGroup } from "./DisplayControlPrimitives";
import { useCroppedHeight, useCroppedWidth } from "../hooks/useAppSettings";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { buildAspectOptions } from "../lib/aspectOptions";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Defaults applied when a non-default rule first switches an attribute from "inherit" to "override". */
const OVERRIDE_DEFAULTS = {
  imageMode: "natural",
  imageVisibility: "shown" as BookmarkImageVisibility,
  imageLayout: "above" as HomepageSectionImageLayout,
  hideWebsiteForYouTube: false,
};

interface CardDisplayImageControlsProps {
  value: RuleDisplayValue;
  onChange: (patch: Partial<RuleDisplayValue>) => void;
  idPrefix: string;
  isDefault: boolean;
}

/**
 * The image-related display rows of a card display rule: visibility, aspect, layout, and the
 * hide-website-for-YouTube toggle — each wrapped in an `OverridableRow`.
 */
export function CardDisplayImageControls({
  value, onChange, idPrefix, isDefault,
}: CardDisplayImageControlsProps) {
  const {
    t,
  } = useTranslation();
  const croppedWidth = useCroppedWidth();
  const croppedHeight = useCroppedHeight();
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const aspectOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios);

  return (
    <>
      <OverridableRow
        label={t("Images")}
        idPrefix={idPrefix}
        attr="imageVisibility"
        isDefault={isDefault}
        isOverridden={value.imageVisibility !== null}
        onOverrideChange={on => onChange({
          imageVisibility: on ? OVERRIDE_DEFAULTS.imageVisibility : null,
        })}
      >
        <ToggleGroup
          type="single"
          size="sm"
          value={value.imageVisibility ?? OVERRIDE_DEFAULTS.imageVisibility}
          className="gap-0 overflow-hidden rounded-md border border-input"
          onValueChange={(next) => {
            if (next) onChange({
              imageVisibility: next as BookmarkImageVisibility,
            });
          }}
        >
          <ToggleGroupItem
            value="shown"
            className="
              rounded-none border-r border-input
              first:rounded-l-sm
            "
          >{t("Show")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="image-only"
            className="rounded-none border-r border-input"
          >{t("Only")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="off"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >{t("Off")}
          </ToggleGroupItem>
        </ToggleGroup>
      </OverridableRow>

      <OverridableRow
        label={t("Aspect")}
        idPrefix={idPrefix}
        attr="imageMode"
        isDefault={isDefault}
        isOverridden={value.imageMode !== null}
        onOverrideChange={on => onChange({
          imageMode: on ? OVERRIDE_DEFAULTS.imageMode : null,
        })}
      >
        <Select
          value={value.imageMode ?? OVERRIDE_DEFAULTS.imageMode}
          onValueChange={next => onChange({
            imageMode: next,
          })}
        >
          <SelectTrigger className="h-7 w-44 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {aspectOptions.map(opt => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </OverridableRow>

      <OverridableRow
        label={t("Layout")}
        idPrefix={idPrefix}
        attr="imageLayout"
        isDefault={isDefault}
        isOverridden={value.imageLayout !== null}
        onOverrideChange={on => onChange({
          imageLayout: on ? OVERRIDE_DEFAULTS.imageLayout : null,
        })}
        hint={t("Side layout only applies at 1–2 columns.")}
      >
        <ToggleGroup
          type="single"
          size="sm"
          value={value.imageLayout ?? OVERRIDE_DEFAULTS.imageLayout}
          className="gap-0 overflow-hidden rounded-md border border-input"
          onValueChange={(next) => {
            if (next) onChange({
              imageLayout: next as HomepageSectionImageLayout,
            });
          }}
        >
          <ToggleGroupItem
            value="above"
            className="
              rounded-none border-r border-input
              first:rounded-l-sm
            "
          >{t("Above")}
          </ToggleGroupItem>
          <ToggleGroupItem
            value="side"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >{t("Side")}
          </ToggleGroupItem>
        </ToggleGroup>
      </OverridableRow>

      <OverridableRow
        label={t("Hide website for YouTube")}
        idPrefix={idPrefix}
        attr="hideWebsiteForYouTube"
        isDefault={isDefault}
        isOverridden={value.hideWebsiteForYouTube !== null}
        onOverrideChange={on => onChange({
          hideWebsiteForYouTube: on ? OVERRIDE_DEFAULTS.hideWebsiteForYouTube : null,
        })}
        hint={t("Hides the website pill on a card that also has a YouTube channel.")}
      >
        <OnOffToggleGroup
          value={value.hideWebsiteForYouTube ?? OVERRIDE_DEFAULTS.hideWebsiteForYouTube}
          onChange={on => onChange({
            hideWebsiteForYouTube: on,
          })}
        />
      </OverridableRow>
    </>
  );
}

interface OverridableRowProps {
  label: string;
  idPrefix: string;
  attr: string;
  isDefault: boolean;
  isOverridden: boolean;
  onOverrideChange: (on: boolean) => void;
  hint?: string;
  children: ReactNode;
}

/** A labeled display control with an "Override" checkbox; hidden (always-on) for the Default rule. */
function OverridableRow({
  label, idPrefix, attr, isDefault, isOverridden, onOverrideChange, hint, children,
}: OverridableRowProps) {
  const {
    t,
  } = useTranslation();
  const active = isDefault || isOverridden;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-4">
        <Label className="text-sm font-medium">{label}</Label>
        {active
          ? children
          : (
            <label
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Checkbox
                id={`${idPrefix}-override-${attr}`}
                checked={false}
                onCheckedChange={checked => onOverrideChange(checked === true)}
              />
              {t("Override")}
            </label>
          )}
      </div>
      {active && !isDefault && (
        <button
          type="button"
          className="
            text-xs text-muted-foreground underline-offset-2
            hover:underline
          "
          onClick={() => onOverrideChange(false)}
        >
          {t("Inherit instead")}
        </button>
      )}
      {active && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
