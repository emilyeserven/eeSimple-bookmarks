import type { CardBodyZone, CardZoneLayout } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { cardBodyContainerClass, zoneForm } from "../lib/cardZoneLayoutClasses";

interface CardZoneLayoutPreviewProps {
  /** The card-body sub-zone this preview illustrates. Never `card-table` (the caller filters it out). */
  zone: CardBodyZone;
  /** The zone's resolved Flex/Grid layout — the same value fed to the real card. */
  layout: CardZoneLayout;
  /** How many example properties to lay out (2 or 3). */
  count: number;
}

/** A muted example "label : value" bar for the single-column zones (varied height shows cross-axis align). */
function SampleRow({
  label, tall,
}: { label: string;
  tall: boolean; }) {
  return (
    <div
      className={`
        flex min-w-0 flex-col justify-center rounded-sm bg-muted px-2
        text-[10px] leading-tight text-muted-foreground
        ${tall ? "py-2" : "py-1"}
      `}
    >
      <span className="truncate font-medium">{label}</span>
    </div>
  );
}

/** A muted example pill for the Labels zone. */
function SamplePill({
  label,
}: { label: string }) {
  return (
    <span
      className="
        inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px]
        text-muted-foreground
      "
    >
      {label}
    </span>
  );
}

/**
 * A small live preview of how a card-body zone arranges its fields under the currently-set layout. It
 * lays out `count` placeholder properties through {@link cardBodyContainerClass} — the exact container
 * class the real card uses — so Flex/Grid, direction, wrap, gap, and both alignments are all reflected.
 */
export function CardZoneLayoutPreview({
  zone, layout, count,
}: CardZoneLayoutPreviewProps) {
  const {
    t,
  } = useTranslation();
  const form = zoneForm(zone) === "label" ? "label" : "single";
  const containerClass = cardBodyContainerClass(form, layout);
  const items = Array.from({
    length: count,
  }, (_, index) => index);
  return (
    <div
      className="rounded-md border border-dashed border-input bg-muted/30 p-2"
    >
      <div
        className={`
          min-h-16
          ${containerClass}
        `}
      >
        {items.map(index => (
          form === "label"
            ? (
              <SamplePill
                key={index}
                label={`${t("Property")} ${index + 1}`}
              />
            )
            : (
              <SampleRow
                key={index}
                label={`${t("Property")} ${index + 1}`}
                tall={index === 1}
              />
            )
        ))}
      </div>
    </div>
  );
}
