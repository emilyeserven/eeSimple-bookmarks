import type { ScanPipelineGate, ScanPipelineGateLive } from "@eesimple/types";
import type { TFunction } from "i18next";
import type { LucideIcon } from "lucide-react";

import { Link } from "@tanstack/react-router";
import { Cable, CircleCheck, Globe, Link2, SlidersHorizontal } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

/** One icon per gate kind — exhaustive, so a new gate kind fails `tsc` here. */
const GATE_ICONS = {
  always: CircleCheck,
  queryParam: SlidersHorizontal,
  connector: Cable,
  websiteFlag: Globe,
  urlPattern: Link2,
} satisfies Record<ScanPipelineGate["kind"], LucideIcon>;

function stateLabel(t: TFunction, state: ScanPipelineGateLive["state"] | undefined): string {
  switch (state) {
    case "on":
      return t("Active");
    case "off":
      return t("Inactive");
    case "conditional":
      return t("Conditional");
    default:
      return "…";
  }
}

function stateVariant(state: ScanPipelineGateLive["state"] | undefined): "default" | "outline" | "secondary" {
  if (state === "on") return "default";
  if (state === "off") return "outline";
  return "secondary";
}

/**
 * The live on/off/conditional pill for a scan-pipeline gate (stage or precedence source). Matches
 * the Connectors page's Active/Inactive badge language; a connector gate links to the Connectors
 * tab where the underlying provider is configured. The gate's live `detail` is the hover tooltip.
 */
export function GateBadge({
  gate, live,
}: { gate: ScanPipelineGate;
  live?: ScanPipelineGateLive; }) {
  const {
    t,
  } = useTranslation();
  const Icon = GATE_ICONS[gate.kind];
  const badge = (
    <Badge
      variant={stateVariant(live?.state)}
      title={live?.detail}
    >
      <Icon />
      {stateLabel(t, live?.state)}
    </Badge>
  );
  if (gate.kind !== "connector") return badge;
  return (
    <Link
      to="/settings/advanced/connectors"
      className="inline-flex"
      aria-label={t("Open Connectors settings")}
    >
      {badge}
    </Link>
  );
}
