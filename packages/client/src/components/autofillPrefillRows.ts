import type { AutofillRule, CustomProperty } from "@eesimple/types";

import { formatDateTime, formatNumber } from "../lib/bookmarkFormat";

import i18n from "@/i18n";

/** A resolved prefill custom-property row for the Prefill view. */
export interface PrefillPropertyRow {
  id: string;
  name: string;
  display: string;
}

/** Resolve the rule's number/boolean/date-time prefill values into display rows. */
export function prefillPropertyRows(
  rule: AutofillRule,
  properties: CustomProperty[],
): PrefillPropertyRow[] {
  return [
    ...rule.numberValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? i18n.t("Unknown"),
        display: prop ? formatNumber(e.value, prop) : String(e.value),
      };
    }),
    ...rule.booleanValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? i18n.t("Unknown"),
        display: e.value ? i18n.t("Yes") : i18n.t("No"),
      };
    }),
    ...rule.dateTimeValues.map((e) => {
      const prop = properties.find(p => p.id === e.propertyId);
      return {
        id: e.propertyId,
        name: prop?.name ?? i18n.t("Unknown"),
        display: prop ? formatDateTime(e.value, prop) : e.value,
      };
    }),
  ];
}
