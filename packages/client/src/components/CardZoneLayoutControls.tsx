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

import { CARD_BODY_ZONES, normalizeCardZoneLayout } from "@eesimple/types";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

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

/**
 * Per card-body sub-zone: a Flex/Grid mode toggle plus Gap and Alignment controls. Shared by the
 * card-display-rule editor and the homepage-section editor so both configure zone layout identically.
 */
export function CardZoneLayoutControls({
  value, onChange,
}: CardZoneLayoutControlsProps) {
  const {
    t,
  } = useTranslation();
  function translateOptions<T extends string>(options: { value: T;
    label: string; }[]) {
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
          </div>
        );
      })}
    </div>
  );
}
