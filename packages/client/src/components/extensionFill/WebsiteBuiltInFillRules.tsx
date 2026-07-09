import type { BuiltInFillRule } from "@/lib/builtInFillRules";
import type { Website } from "@eesimple/types";

import { useMemo } from "react";

import { useTranslation } from "react-i18next";

import { LabeledSection } from "../LabeledSection";

import { Badge } from "@/components/ui/badge";
import { useMediaTypes } from "@/hooks/useMediaTypes";
import { useTags } from "@/hooks/useTags";
import { buildBuiltInFillRules } from "@/lib/builtInFillRules";

/**
 * Read-only companion to {@link ExtensionFillRulesEditor}: lists the **site-specific** fill treatments
 * that are currently active for this website (its ISBN scanning, default category/tags/media type, and
 * title-suffix removal), reflecting the site's live config. Renders **nothing** when no built-in rule
 * applies to the site. Global scan behaviors live on Settings → Connectors, not here.
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

  if (rules.length === 0) return null;

  return (
    <LabeledSection
      title={t("Built-in rules")}
      description={t(
        "These run automatically when a bookmark is created from this site — no browser extension needed. They can't be edited.",
      )}
    >
      <div className="space-y-2">
        {rules.map(rule => (
          <BuiltInFillRuleRow
            key={rule.id}
            rule={rule}
          />
        ))}
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
          {rule.detail
            ? <span className="truncate text-sm text-muted-foreground">{`→ ${rule.detail}`}</span>
            : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge variant="secondary">{t("Built-in")}</Badge>
          <Badge variant="outline">{t("On creation")}</Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t(rule.source)}</p>
    </div>
  );
}
