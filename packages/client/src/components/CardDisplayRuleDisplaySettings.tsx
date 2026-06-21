import type {
  BookmarkImageVisibility,
  CardFieldZones,
  CustomProperty,
  HomepageSectionImageLayout,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { CardFieldZoneBoard } from "./CardFieldZoneBoard";
import { OnOffToggleGroup } from "./DisplayControlPrimitives";
import { useCustomAspectRatios } from "../hooks/useCustomAspectRatios";
import { buildAspectOptions } from "../lib/aspectOptions";
import { defaultCardFieldZones } from "../lib/bookmarkCardValues";
import { useUiStore } from "../stores/uiStore";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** The per-card display config a rule overrides; `null` on any attribute means "inherit". */
export interface RuleDisplayValue {
  fieldZones: CardFieldZones | null;
  imageMode: string | null;
  imageVisibility: BookmarkImageVisibility | null;
  imageLayout: HomepageSectionImageLayout | null;
  hideWebsiteForYouTube: boolean | null;
}

/** Defaults applied when a non-default rule first switches an attribute from "inherit" to "override". */
const OVERRIDE_DEFAULTS = {
  imageMode: "natural",
  imageVisibility: "shown" as BookmarkImageVisibility,
  imageLayout: "above" as HomepageSectionImageLayout,
  hideWebsiteForYouTube: false,
};

interface CardDisplayRuleDisplaySettingsProps {
  value: RuleDisplayValue;
  onChange: (patch: Partial<RuleDisplayValue>) => void;
  /** Custom properties available, used to extend the card-field toggle list. */
  properties: CustomProperty[];
  /** Stable id prefix so checkbox/label pairs stay unique across multiple rule editors. */
  idPrefix: string;
  /**
   * The Default rule: every attribute is concrete (no "inherit" option), since it is the baseline
   * every other rule falls back to.
   */
  isDefault?: boolean;
}

/**
 * Controlled display config for a card display rule: image visibility/aspect/layout, corner overlays,
 * and card-field visibility — each with an "Inherit / Override" toggle (a non-default rule leaves
 * `null` attributes to lower-priority rules / the Default). Grid columns and card/table view are
 * deliberately excluded: those are page-level, not per-card. The Default rule renders the same
 * controls with every attribute concrete.
 */
export function CardDisplayRuleDisplaySettings({
  value, onChange, properties, idPrefix, isDefault = false,
}: CardDisplayRuleDisplaySettingsProps) {
  const croppedWidth = useUiStore(state => state.croppedWidth);
  const croppedHeight = useUiStore(state => state.croppedHeight);
  const {
    data: customRatios = [],
  } = useCustomAspectRatios();
  const aspectOptions = buildAspectOptions(croppedWidth, croppedHeight, customRatios);

  return (
    <div className="space-y-4">
      <OverridableRow
        label="Images"
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
          >Show
          </ToggleGroupItem>
          <ToggleGroupItem
            value="image-only"
            className="rounded-none border-r border-input"
          >Only
          </ToggleGroupItem>
          <ToggleGroupItem
            value="off"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >Off
          </ToggleGroupItem>
        </ToggleGroup>
      </OverridableRow>

      <OverridableRow
        label="Aspect"
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
        label="Layout"
        idPrefix={idPrefix}
        attr="imageLayout"
        isDefault={isDefault}
        isOverridden={value.imageLayout !== null}
        onOverrideChange={on => onChange({
          imageLayout: on ? OVERRIDE_DEFAULTS.imageLayout : null,
        })}
        hint="Side layout only applies at 1–2 columns."
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
          >Above
          </ToggleGroupItem>
          <ToggleGroupItem
            value="side"
            className="
              rounded-none
              last:rounded-r-sm
            "
          >Side
          </ToggleGroupItem>
        </ToggleGroup>
      </OverridableRow>

      <OverridableRow
        label="Hide website for YouTube"
        idPrefix={idPrefix}
        attr="hideWebsiteForYouTube"
        isDefault={isDefault}
        isOverridden={value.hideWebsiteForYouTube !== null}
        onOverrideChange={on => onChange({
          hideWebsiteForYouTube: on ? OVERRIDE_DEFAULTS.hideWebsiteForYouTube : null,
        })}
        hint="Hides the website pill on a card that also has a YouTube channel."
      >
        <OnOffToggleGroup
          value={value.hideWebsiteForYouTube ?? OVERRIDE_DEFAULTS.hideWebsiteForYouTube}
          onChange={on => onChange({
            hideWebsiteForYouTube: on,
          })}
        />
      </OverridableRow>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Card fields</Label>
          {!isDefault && (
            <label
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Checkbox
                id={`${idPrefix}-override-fieldZones`}
                checked={value.fieldZones !== null}
                onCheckedChange={checked => onChange({
                  fieldZones: checked === true ? defaultCardFieldZones(properties) : null,
                })}
              />
              Override
            </label>
          )}
        </div>
        {value.fieldZones !== null
          ? (
            <>
              <p className="text-xs text-muted-foreground">
                Drag each field onto a zone. Image corners overlay it on the card image; anything left
                in “Available” is hidden.
              </p>
              <CardFieldZoneBoard
                value={value.fieldZones}
                onChange={zones => onChange({
                  fieldZones: zones,
                })}
                properties={properties}
                idPrefix={`${idPrefix}-zones`}
              />
            </>
          )
          : <p className="text-xs text-muted-foreground">Inheriting card fields from lower-priority rules.</p>}
      </div>
    </div>
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
              Override
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
          Inherit instead
        </button>
      )}
      {active && hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
