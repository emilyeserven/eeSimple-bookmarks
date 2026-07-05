import type {
  CardBodyZone,
  CardZoneAlign,
  CardZoneDirection,
  CardZoneGap,
  CardZoneLayout,
  CardZoneLayouts,
  CardZoneMode,
  CardZoneVerticalAlign,
  CardZoneWrap,
} from "@eesimple/types";
import type { LucideIcon } from "lucide-react";

import { useState } from "react";

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";
import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignHorizontalSpaceBetween,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
  ArrowDown,
  ArrowRight,
  MoveHorizontal,
  StretchVertical,
  WrapText,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { CardZoneLayoutPreview } from "./CardZoneLayoutPreview";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

/** Human labels for the four card-body sub-zones, shown beside each Flex/Grid toggle. */
const BODY_ZONE_LABELS: Record<CardBodyZone, string> = {
  "card-single-top": "Single column top",
  "card-labels": "Labels",
  "card-table": "Table",
  "card-single-bottom": "Single column bottom",
};

/** A single option in a segmented toggle: its value, a text label, and an optional icon to show instead. */
interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

/**
 * A bordered segmented toggle (one selected value out of a small option list). Options with an `icon`
 * render the glyph in place of text, keeping the label as the accessible name + tooltip.
 */
function SegmentedToggle<T extends string>({
  value, options, onChange, ariaLabel,
}: {
  value: T;
  options: ToggleOption<T>[];
  onChange: (next: T) => void;
  ariaLabel?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      aria-label={ariaLabel}
      className="gap-0 overflow-hidden rounded-md border border-input"
      onValueChange={(next) => {
        if (next) onChange(next as T);
      }}
    >
      {options.map((opt, index) => {
        const Icon = opt.icon;
        return (
          <ToggleGroupItem
            key={opt.value}
            value={opt.value}
            aria-label={opt.label}
            title={opt.label}
            className={`
              rounded-none
              ${index < options.length - 1 ? "border-r border-input" : ""}
              first:rounded-l-sm
              last:rounded-r-sm
            `}
          >{Icon ? <Icon className="size-3.5" /> : opt.label}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}

const MODE_OPTIONS: ToggleOption<CardZoneMode>[] = [
  {
    value: "flex",
    label: "Flex",
  },
  {
    value: "grid",
    label: "Grid",
  },
];

const GAP_OPTIONS: ToggleOption<CardZoneGap>[] = [
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

const ALIGN_OPTIONS: ToggleOption<CardZoneAlign>[] = [
  {
    value: "start",
    label: "Start",
    icon: AlignHorizontalJustifyStart,
  },
  {
    value: "center",
    label: "Center",
    icon: AlignHorizontalJustifyCenter,
  },
  {
    value: "end",
    label: "End",
    icon: AlignHorizontalJustifyEnd,
  },
  {
    value: "between",
    label: "Between",
    icon: AlignHorizontalSpaceBetween,
  },
];

const VALIGN_OPTIONS: ToggleOption<CardZoneVerticalAlign>[] = [
  {
    value: "start",
    label: "Start",
    icon: AlignVerticalJustifyStart,
  },
  {
    value: "center",
    label: "Center",
    icon: AlignVerticalJustifyCenter,
  },
  {
    value: "end",
    label: "End",
    icon: AlignVerticalJustifyEnd,
  },
  {
    value: "stretch",
    label: "Stretch",
    icon: StretchVertical,
  },
];

const DIRECTION_OPTIONS: ToggleOption<CardZoneDirection>[] = [
  {
    value: "row",
    label: "Row",
    icon: ArrowRight,
  },
  {
    value: "column",
    label: "Column",
    icon: ArrowDown,
  },
];

const WRAP_OPTIONS: ToggleOption<CardZoneWrap>[] = [
  {
    value: "wrap",
    label: "Wrap",
    icon: WrapText,
  },
  {
    value: "nowrap",
    label: "No wrap",
    icon: MoveHorizontal,
  },
];

const EXAMPLE_COUNT_OPTIONS: ToggleOption<string>[] = [
  {
    value: "2",
    label: "2",
  },
  {
    value: "3",
    label: "3",
  },
];

interface CardZoneLayoutControlsProps {
  value: CardZoneLayouts;
  onChange: (layouts: CardZoneLayouts) => void;
}

/**
 * Per card-body sub-zone: a Flex/Grid mode toggle plus Gap and Alignment controls, each with a small live
 * preview showing how the set layout arranges a couple of example properties. Shared by the
 * card-display-rule editor and the homepage-section editor so both configure zone layout identically.
 */
export function CardZoneLayoutControls({
  value, onChange,
}: CardZoneLayoutControlsProps) {
  const {
    t,
  } = useTranslation();
  const [exampleCount, setExampleCount] = useState(3);
  function translateOptions<O extends { label: string }>(options: O[]): O[] {
    return options.map(opt => ({
      ...opt,
      label: t(opt.label),
    }));
  }
  const modeOptions = translateOptions(MODE_OPTIONS);
  const gapOptions = translateOptions(GAP_OPTIONS);
  const alignOptions = translateOptions(ALIGN_OPTIONS);
  const valignOptions = translateOptions(VALIGN_OPTIONS);
  const directionOptions = translateOptions(DIRECTION_OPTIONS);
  const wrapOptions = translateOptions(WRAP_OPTIONS);

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
      <label className="flex items-center gap-1.5">
        <span className="text-[11px] text-muted-foreground">{t("Preview")}</span>
        <SegmentedToggle
          value={String(exampleCount)}
          options={EXAMPLE_COUNT_OPTIONS}
          ariaLabel={t("Number of example properties")}
          onChange={next => setExampleCount(Number(next))}
        />
      </label>
      {/* The Table zone is always the fixed two-column `label : value` table — it has no layout rules. */}
      {CARD_BODY_ZONES.filter(zone => zone !== "card-table").map((zone) => {
        // The Table zone is filtered out above, so every remaining zone defaults to `flex`.
        const layout = normalizeCardZoneLayout(value[zone], "flex");
        return (
          <div
            key={zone}
            className="space-y-1.5"
          >
            <span className="text-xs font-medium text-muted-foreground">{t(BODY_ZONE_LABELS[zone])}</span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <SegmentedToggle
                value={layout.mode}
                options={modeOptions}
                ariaLabel={t("Mode")}
                onChange={mode => patchZone(zone, {
                  mode,
                })}
              />
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{t("Gap")}</span>
                <SegmentedToggle
                  value={layout.gap ?? "md"}
                  options={gapOptions}
                  onChange={gap => patchZone(zone, {
                    gap,
                  })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{t("Horizontal")}</span>
                <SegmentedToggle
                  value={layout.align ?? "start"}
                  options={alignOptions}
                  onChange={align => patchZone(zone, {
                    align,
                  })}
                />
              </label>
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">{t("Vertical")}</span>
                <SegmentedToggle
                  value={layout.alignItems ?? "start"}
                  options={valignOptions}
                  onChange={alignItems => patchZone(zone, {
                    alignItems,
                  })}
                />
              </label>
              {layout.mode === "flex"
                ? (
                  <>
                    <label className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">{t("Direction")}</span>
                      <SegmentedToggle
                        value={layout.direction ?? "row"}
                        options={directionOptions}
                        onChange={direction => patchZone(zone, {
                          direction,
                        })}
                      />
                    </label>
                    <label className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">{t("Wrap")}</span>
                      <SegmentedToggle
                        value={layout.wrap ?? "wrap"}
                        options={wrapOptions}
                        onChange={wrap => patchZone(zone, {
                          wrap,
                        })}
                      />
                    </label>
                  </>
                )
                : null}
            </div>
            <CardZoneLayoutPreview
              zone={zone}
              layout={layout}
              count={exampleCount}
            />
          </div>
        );
      })}
    </div>
  );
}
