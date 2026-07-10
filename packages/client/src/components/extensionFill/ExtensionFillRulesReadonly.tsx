import type { CustomProperty, WebsiteExtensionFillRule } from "@eesimple/types";
import type { ReactNode } from "react";

import { Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LabeledSection } from "../LabeledSection";

import { Button } from "@/components/ui/button";
import { useCustomProperties } from "@/hooks/useCustomProperties";
import {
  describeFillFilter,
  describeFillRead,
  describeFillTarget,
  describeFillTransform,
  describePathMatch,
} from "@/lib/extensionFillForm";

/**
 * Read-only, full-detail rendering of a website's {@link WebsiteExtensionFillRule}s — the initial
 * state of the Extension Fill edit tab. Shows every configured piece (target, path gate, selector,
 * read mode, split, filters, transforms) as static `label : value` rows, so the fiddly rules can't
 * be changed by accident; an Edit button hands off to the live {@link ExtensionFillRulesEditor}.
 */
export function ExtensionFillRulesReadonly({
  rules, onEdit,
}: {
  rules: WebsiteExtensionFillRule[];
  onEdit: () => void;
}) {
  const {
    t,
  } = useTranslation();
  const properties = useCustomProperties();
  // Same set the editor offers (file/image property types can't be a fill target) — resolve the
  // custom-property name so a `customProperty` target reads as its real name, not an id.
  const propertiesById = new Map(
    (properties.data ?? [])
      .filter(property => property.type !== "file" && property.type !== "image")
      .map(property => [property.id, property]),
  );

  return (
    <LabeledSection
      title={t("Extension Fill Rules")}
      description={t(
        "Rules the browser extension uses to scrape this site's pages and offer the extracted values back to a matching bookmark.",
      )}
    >
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onEdit}
          >
            <Pencil className="mr-1 size-4" />
            {t("Edit")}
          </Button>
        </div>
        {rules.length > 0
          ? rules.map(rule => (
            <ReadonlyFillRuleCard
              key={rule.id}
              rule={rule}
              property={rule.target.kind === "customProperty"
                ? propertiesById.get(rule.target.propertyId)
                : undefined}
            />
          ))
          : <p className="text-sm text-muted-foreground">{t("No extension fill rules yet.")}</p>}
      </div>
    </LabeledSection>
  );
}

/** One static rule card: label header over a `label : value` detail list. */
function ReadonlyFillRuleCard({
  rule, property,
}: {
  rule: WebsiteExtensionFillRule;
  property?: CustomProperty;
}) {
  const {
    t,
  } = useTranslation();
  const filters = rule.extract.filters ?? [];
  const transforms = rule.extract.transform ?? [];
  return (
    <div className="space-y-2 rounded-lg border bg-card p-3">
      <div className="text-sm font-medium">
        {rule.label.trim() || describeFillTarget(rule.target, property)}
      </div>
      <dl className="space-y-1 text-sm">
        <DetailRow
          label={t("Target")}
          value={describeFillTarget(rule.target, property)}
        />
        {rule.pathMatch
          ? (
            <DetailRow
              label={t("Path match")}
              value={describePathMatch(rule.pathMatch)}
            />
          )
          : null}
        <DetailRow
          label={t("Selector")}
          value={<code className="font-mono text-xs break-all">{rule.extract.selector}</code>}
        />
        {rule.extract.read?.kind === "attr"
          ? (
            <DetailRow
              label={t("Read")}
              value={describeFillRead(rule.extract.read)}
            />
          )
          : null}
        {rule.target.kind === "taxonomy" && rule.extract.split
          ? (
            <DetailRow
              label={t("Split on")}
              value={<code className="font-mono text-xs">{rule.extract.split}</code>}
            />
          )
          : null}
        {filters.length > 0
          ? (
            <DetailRow
              label={t("Filters")}
              value={<ul className="space-y-0.5">{filters.map((filter, index) => <li key={index}>{describeFillFilter(filter)}</li>)}</ul>}
            />
          )
          : null}
        {transforms.length > 0
          ? (
            <DetailRow
              label={t("Transforms")}
              value={<ul className="space-y-0.5">{transforms.map((transform, index) => <li key={index}>{describeFillTransform(transform)}</li>)}</ul>}
            />
          )
          : null}
      </dl>
    </div>
  );
}

/** A `label : value` row inside a rule card's detail list. */
function DetailRow({
  label, value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div
      className="
        grid gap-1
        sm:grid-cols-[8rem_1fr]
      "
    >
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0">{value}</dd>
    </div>
  );
}
