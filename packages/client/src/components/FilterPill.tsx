import type { FacetSelectionSummary } from "../lib/filterFacets";
import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { Badge } from "./ui/badge";
import { ResponsivePopover } from "./ui/responsive-popover";

import { cn } from "@/lib/utils";

/**
 * One filter facet rendered as a pill under the search bar. Empty pills show just the facet name in
 * subtle text; an active pill fills and appends a compact selection summary (a count, else the
 * presence mode). Clicking opens a {@link ResponsivePopover} (popover ≥md, modal <md) holding the
 * facet's controls (`children`) — the same presence toggle + control + chips + Reset the sidebar uses.
 */
export function FilterPill({
  label, active, summary, children,
}: {
  label: string;
  active: boolean;
  summary: FacetSelectionSummary;
  children: ReactNode;
}) {
  const {
    t,
  } = useTranslation();

  const presenceLabels: Record<"has" | "missing" | "exclude", string> = {
    has: t("Has"),
    missing: t("Missing"),
    exclude: t("Excluded"),
  };
  const summaryText = summary.count > 0
    ? String(summary.count)
    : summary.presence
      ? presenceLabels[summary.presence]
      : null;

  return (
    <ResponsivePopover
      title={label}
      align="start"
      contentClassName="w-72"
      trigger={(
        <Badge
          asChild
          variant={active ? "secondary" : "outline"}
          className={cn("cursor-pointer", !active && "text-muted-foreground")}
        >
          <button
            type="button"
            aria-label={t("Filter by {{label}}", {
              label,
            })}
          >
            {label}
            {active && summaryText
              ? <span className="ml-1 font-semibold">{summaryText}</span>
              : null}
          </button>
        </Badge>
      )}
    >
      {children}
    </ResponsivePopover>
  );
}
