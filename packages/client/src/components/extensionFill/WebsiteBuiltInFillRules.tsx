import type { BuiltInFillGroup, BuiltInFillRule } from "@/lib/builtInFillRules";
import type { Website } from "@eesimple/types";

import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "../LabeledSection";

import { Badge } from "@/components/ui/badge";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTags } from "@/hooks/useTags";
import { buildBuiltInFillRules } from "@/lib/builtInFillRules";

/** Ordered groups + their sub-header labels (English natural keys). */
const GROUPS: { group: BuiltInFillGroup;
  label: string; }[] = [
  {
    group: "scan",
    label: "From the page",
  },
  {
    group: "isbn",
    label: "ISBN",
  },
  {
    group: "defaults",
    label: "Site defaults",
  },
  {
    group: "oembed",
    label: "oEmbed",
  },
];

/**
 * Read-only companion to {@link ExtensionFillRulesEditor}: lists the fill treatments the app performs
 * automatically when a bookmark is created from this site — without the browser extension — reflecting
 * the site's live config for the per-site rules. See {@link buildBuiltInFillRules}.
 */
export function WebsiteBuiltInFillRules({
  website,
}: {
  website: Website;
}) {
  const {
    t,
  } = useTranslation();
  const tags = useTags();
  const mediaTypes = useMediaTypes();

  const rules = useMemo(() => {
    const tagNames = new Map((tags.data ?? []).map(tag => [tag.id, tag.name]));
    const mediaTypeNames = new Map((mediaTypes.data ?? []).map(type => [type.id, type.name]));
    return buildBuiltInFillRules(website, {
      tagNameById: id => tagNames.get(id),
      mediaTypeNameById: id => mediaTypeNames.get(id),
    });
  }, [website, tags.data, mediaTypes.data]);

  return (
    <LabeledSection
      title={t("Built-in rules")}
      description={t(
        "These run automatically when a bookmark is created from this site — no browser extension needed. They can't be edited.",
      )}
    >
      <div className="space-y-4">
        {GROUPS.map(({
          group, label,
        }) => {
          const groupRules = rules.filter(rule => rule.group === group);
          if (groupRules.length === 0) return null;
          return (
            <div
              key={group}
              className="space-y-2"
            >
              <p
                className="
                  text-xs font-semibold tracking-wide text-muted-foreground
                  uppercase
                "
              >
                {t(label)}
              </p>
              {groupRules.map(rule => (
                <BuiltInFillRuleRow
                  key={rule.id}
                  rule={rule}
                />
              ))}
            </div>
          );
        })}
      </div>
    </LabeledSection>
  );
}

/** One read-only built-in rule, styled to match a collapsed extension-fill rule card. */
function BuiltInFillRuleRow({
  rule,
}: {
  rule: BuiltInFillRule;
}) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-1 rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium">{t(rule.label)}</span>
          {rule.state?.kind === "value" && rule.state.detail
            ? <span className="truncate text-sm text-muted-foreground">{`→ ${rule.state.detail}`}</span>
            : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="secondary">{t("Built-in")}</Badge>
          <Badge variant="outline">{t("On creation")}</Badge>
          <StateBadge rule={rule} />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t(rule.source)}</p>
      {rule.state?.kind === "off"
        ? (
          <p className="text-xs text-muted-foreground">
            {t("Enable “Scan URL for ISBN” on the General tab to turn this on.")}
          </p>
        )
        : null}
      {rule.providers
        ? (
          <div className="flex flex-wrap gap-1 pt-1">
            {rule.providers.map(provider => (
              <Badge
                key={provider}
                variant="outline"
              >
                {provider}
              </Badge>
            ))}
          </div>
        )
        : null}
    </div>
  );
}

/** The per-site state pill (On / Off / Not set); `value`-state rules show the value inline instead. */
function StateBadge({
  rule,
}: {
  rule: BuiltInFillRule;
}) {
  const {
    t,
  } = useTranslation();
  switch (rule.state?.kind) {
    case "on":
      return <Badge>{t("On")}</Badge>;
    case "off":
      return <Badge variant="outline">{t("Off")}</Badge>;
    case "unset":
      return <Badge variant="outline">{t("Not set")}</Badge>;
    default:
      return null;
  }
}
