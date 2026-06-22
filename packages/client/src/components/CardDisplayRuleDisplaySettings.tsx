import type {
  BookmarkImageVisibility,
  CardBodyZone,
  CardFieldZones,
  CardZoneAlign,
  CardZoneDirection,
  CardZoneGap,
  CardZoneLayout,
  CardZoneLayouts,
  CardZoneMode,
  CardZoneVerticalAlign,
  CardZoneWrap,
  CustomProperty,
  HomepageSectionImageLayout,
} from "@eesimple/types";
import type { ReactNode } from "react";

import { CARD_BODY_ZONES, defaultCardZoneLayouts, normalizeCardZoneLayout } from "@eesimple/types";

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
  cardZoneLayouts: CardZoneLayouts | null;
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

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <Label className="text-sm font-medium">Section layout</Label>
          {!isDefault && (
            <label
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Checkbox
                id={`${idPrefix}-override-cardZoneLayouts`}
                checked={value.cardZoneLayouts !== null}
                onCheckedChange={checked => onChange({
                  cardZoneLayouts: checked === true ? defaultCardZoneLayouts() : null,
                })}
              />
              Override
            </label>
          )}
        </div>
        {value.cardZoneLayouts !== null
          ? (
            <>
              <p className="text-xs text-muted-foreground">
                How each card-body section arranges its fields: inline flow (Flex) or a two-column grid.
              </p>
              <CardZoneLayoutControls
                value={value.cardZoneLayouts}
                onChange={layouts => onChange({
                  cardZoneLayouts: layouts,
                })}
              />
            </>
          )
          : <p className="text-xs text-muted-foreground">Inheriting section layout from lower-priority rules.</p>}
      </div>
    </div>
  );
}

/** Human labels for the four card-body sub-zones, shown beside each Flex/Grid toggle. */
const BODY_ZONE_LABELS: Record<CardBodyZone, string> = {
  "card-single-top": "Single column top",
  "card-labels": "Labels",
  "card-table": "Table",
  "card-single-bottom": "Single column bottom",
};

/** A bordered segmented toggle (one selected value out of a small option list). */
function SegmentedToggle<T extends string>({
  value, options, onChange,
}: {
  value: T;
  options: { value: T;
    label: string; }[];
  onChange: (next: T) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
    >
      {options.map((opt, index) => (
        <ToggleGroupItem
          key={opt.value}
          value={opt.value}
          className={`
            rounded-none
            ${index < options.length - 1 ? "border-r border-input" : ""}
            first:rounded-l-sm
            last:rounded-r-sm
          `}
        >{opt.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const MODE_OPTIONS: { value: CardZoneMode;
  label: string; }[] = [
  {
    value: "flex",
    label: "Flex",
  },
  {
    value: "grid",
    label: "Grid",
  },
];

const GAP_OPTIONS: { value: CardZoneGap;
  label: string; }[] = [
  {
    value: "sm",
    label: "S",
  },
  {
    value: "md",
    label: "M",
  },
  {
    value: "lg",
    label: "L",
  },
];

const ALIGN_OPTIONS: { value: CardZoneAlign;
  label: string; }[] = [
  {
    value: "start",
    label: "Start",
  },
  {
    value: "center",
    label: "Center",
  },
  {
    value: "end",
    label: "End",
  },
  {
    value: "between",
    label: "Between",
  },
];

const VALIGN_OPTIONS: { value: CardZoneVerticalAlign;
  label: string; }[] = [
  {
    value: "start",
    label: "Start",
  },
  {
    value: "center",
    label: "Center",
  },
  {
    value: "end",
    label: "End",
  },
  {
    value: "stretch",
    label: "Stretch",
  },
];

const DIRECTION_OPTIONS: { value: CardZoneDirection;
  label: string; }[] = [
  {
    value: "row",
    label: "Row",
  },
  {
    value: "column",
    label: "Column",
  },
];

const WRAP_OPTIONS: { value: CardZoneWrap;
  label: string; }[] = [
  {
    value: "wrap",
    label: "Wrap",
  },
  {
    value: "nowrap",
    label: "No wrap",
  },
];

interface CardZoneLayoutControlsProps {
  value: CardZoneLayouts;
  onChange: (layouts: CardZoneLayouts) => void;
}

/** Per card-body sub-zone: a Flex/Grid mode toggle plus Gap and Alignment controls. */
function CardZoneLayoutControls({
  value, onChange,
}: CardZoneLayoutControlsProps) {
  function patchZone(zone: CardBodyZone, patch: Partial<CardZoneLayout>): void {
    const current = normalizeCardZoneLayout(value[zone], zone === "card-table" ? "grid" : "flex");
    onChange({
      ...value,
      [zone]: {
        ...current,
        ...patch,
      },
    });
  }
  return (
    <div className="space-y-3">
      {CARD_BODY_ZONES.map((zone) => {
        const layout = normalizeCardZoneLayout(value[zone], zone === "card-table" ? "grid" : "flex");
        return (
          <div
            key={zone}
            className="space-y-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">{BODY_ZONE_LABELS[zone]}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <SegmentedToggle
                value={layout.mode}
                options={MODE_OPTIONS}
                onChange={mode => patchZone(zone, {
                  mode,
                })}
              />
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Gap</span>
                <SegmentedToggle
                  value={layout.gap ?? "md"}
                  options={GAP_OPTIONS}
                  onChange={gap => patchZone(zone, {
                    gap,
                  })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Horizontal</span>
                <SegmentedToggle
                  value={layout.align ?? "start"}
                  options={ALIGN_OPTIONS}
                  onChange={align => patchZone(zone, {
                    align,
                  })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Vertical</span>
                <SegmentedToggle
                  value={layout.alignItems ?? "start"}
                  options={VALIGN_OPTIONS}
                  onChange={alignItems => patchZone(zone, {
                    alignItems,
                  })}
                />
              </label>
              {layout.mode === "flex"
                ? (
                  <>
                    <label className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Direction</span>
                      <SegmentedToggle
                        value={layout.direction ?? "row"}
                        options={DIRECTION_OPTIONS}
                        onChange={direction => patchZone(zone, {
                          direction,
                        })}
                      />
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">Wrap</span>
                      <SegmentedToggle
                        value={layout.wrap ?? "wrap"}
                        options={WRAP_OPTIONS}
                        onChange={wrap => patchZone(zone, {
                          wrap,
                        })}
                      />
                    </label>
                  </>
                )
                : null}
            </div>
          </div>
        );
      })}
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
