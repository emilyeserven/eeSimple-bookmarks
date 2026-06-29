import type { CardDisplayRule } from "@eesimple/types";

import { CardDisplayRulePreview } from "./CardDisplayRulePreview";
import { conditionsSummaryLabel } from "./conditions/summarizeConditions";
import { PreviewBookmarksSection } from "./PreviewBookmarksSection";
import { ruleToDisplay } from "../lib/cardDisplayRuleForm";

import { LabeledSection } from "@/components/LabeledSection";
import { Separator } from "@/components/ui/separator";

interface ViewProps {
  entity: CardDisplayRule;
}

/** General view tab: description + metadata (name lives in the page header). */
export function CardDisplayRuleGeneralView({
  entity: rule,
}: ViewProps) {
  return (
    <div className="space-y-3 text-sm">
      {rule.description
        ? <p>{rule.description}</p>
        : <p className="text-muted-foreground">No description.</p>}
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">Priority</dt>
        <dd>{rule.isDefault ? "Baseline (lowest)" : rule.sortOrder}</dd>
        <dt className="text-muted-foreground">Slug</dt>
        <dd className="font-mono">{rule.slug}</dd>
        <dt className="text-muted-foreground">Added</dt>
        <dd>{new Date(rule.createdAt).toLocaleDateString()}</dd>
      </dl>
    </div>
  );
}

/** Conditions view tab: a summary of the match tree + which existing bookmarks it matches. */
export function CardDisplayRuleConditionsView({
  entity: rule,
}: ViewProps) {
  if (rule.isDefault) {
    return <p className="text-sm text-muted-foreground">The Default rule matches every bookmark card.</p>;
  }
  return (
    <div className="space-y-6">
      <p className="text-sm">{conditionsSummaryLabel(rule.conditions)}</p>

      <Separator />

      <LabeledSection
        title="Matching bookmarks"
        description="Existing bookmarks this rule currently applies to."
      >
        <PreviewBookmarksSection conditions={rule.conditions} />
      </LabeledSection>
    </div>
  );
}

/** Display view tab: a read-only preview of how a matching card looks under this rule. */
export function CardDisplayRuleDisplayView({
  entity: rule,
}: ViewProps) {
  return (
    <CardDisplayRulePreview
      display={ruleToDisplay(rule)}
      conditions={rule.conditions}
      isDefault={rule.isDefault}
      currentRuleId={rule.id}
    />
  );
}
