import type {
  ConditionMatchOperator,
  ConditionNode,
  ConditionTree,
  ImportRule,
  ImportRuleAction,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { DetailField } from "@/components/DetailField";
import i18n from "@/i18n";

function operatorVerb(operator: ConditionMatchOperator): string {
  switch (operator) {
    case "contains": return i18n.t("contains");
    case "starts_with": return i18n.t("starts with");
    case "regex": return i18n.t("matches");
    case "domain": return i18n.t("domain is");
  }
}

function actionLabel(action: ImportRuleAction): string {
  switch (action) {
    case "approve": return i18n.t("Approve");
    case "reject": return i18n.t("Reject");
    case "block": return i18n.t("Block");
  }
}

function describeImportConditionNode(node: ConditionNode): string {
  switch (node.type) {
    case "group": {
      if (node.children.length === 0) return i18n.t("(empty group)");
      const combLabel = node.combinator === "and" ? i18n.t("ALL") : i18n.t("ANY");
      const inner = node.children.map(describeImportConditionNode).join(node.combinator === "and" ? ` ${i18n.t("AND")} ` : ` ${i18n.t("OR")} `);
      return i18n.t("{{combLabel}} of: ({{inner}})", {
        combLabel,
        inner,
      });
    }
    case "match":
      return node.operator === "domain"
        ? i18n.t("Domain is \"{{pattern}}\"", {
          pattern: node.pattern,
        })
        : i18n.t("{{field}} {{verb}} \"{{pattern}}\"", {
          field: node.field === "url" ? i18n.t("URL") : i18n.t("Title"),
          verb: operatorVerb(node.operator),
          pattern: node.pattern,
        });
    case "website":
      return node.domains.length === 1
        ? i18n.t("Website is: {{domain}}", {
          domain: node.domains[0],
        })
        : i18n.t("Website is one of: {{domains}}", {
          domains: node.domains.join(", "),
        });
    default:
      return i18n.t("(unsupported condition type)");
  }
}

interface ImportRuleViewProps {
  rule: ImportRule;
}

/** "Action" row (bold value). */
export function ImportRuleActionView({
  rule,
}: ImportRuleViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Action")}>
      <span className="font-medium">{actionLabel(rule.action)}</span>
    </DetailField>
  );
}

/** "Priority" (sort order) row. */
export function ImportRulePriorityView({
  rule,
}: ImportRuleViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Priority")}>{rule.sortOrder}</DetailField>;
}

/** "Slug" row (monospace). */
export function ImportRuleSlugView({
  rule,
}: ImportRuleViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <DetailField label={t("Slug")}>
      <span className="font-mono">{rule.slug}</span>
    </DetailField>
  );
}

/** "Added" (created date) row. */
export function ImportRuleAddedView({
  rule,
}: ImportRuleViewProps) {
  const {
    t,
  } = useTranslation();
  return <DetailField label={t("Added")}>{new Date(rule.createdAt).toLocaleDateString()}</DetailField>;
}

/** The description paragraph — falls back to a muted "No description." so the field always shows. */
export function ImportRuleDescriptionView({
  rule,
}: ImportRuleViewProps) {
  const {
    t,
  } = useTranslation();
  return rule.description
    ? <p className="text-sm">{rule.description}</p>
    : <p className="text-sm text-muted-foreground">{t("No description.")}</p>;
}

/**
 * Body of the General view tab, recomposed from the same placeable per-field components the import-rule
 * workbench registry uses — so this whole-view shell (used by `ImportRuleDetail.stories.tsx`) stays in
 * lockstep with the layout-driven General tab.
 */
export function ImportRuleGeneralFields({
  rule,
}: { rule: ImportRule }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-2">
        <ImportRuleActionView rule={rule} />
        <ImportRulePriorityView rule={rule} />
        <ImportRuleSlugView rule={rule} />
        <ImportRuleAddedView rule={rule} />
      </div>
      <ImportRuleDescriptionView rule={rule} />
    </div>
  );
}

/** Body of the Conditions view tab: detailed breakdown of the condition tree. */
export function ImportRuleConditionsFields({
  rule,
}: { rule: ImportRule }) {
  const {
    t,
  } = useTranslation();
  const tree: ConditionTree = rule.conditions;
  if (tree.children.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("Always matches (no conditions set.)")}</p>;
  }
  const combinatorLabel = tree.combinator === "and" ? t("ALL") : t("ANY");
  return (
    <div className="space-y-2 text-sm">
      <p className="text-muted-foreground">
        {t("Matches")}
        {" "}
        {combinatorLabel}
        {" "}
        {t("of:")}
      </p>
      <ul className="space-y-1">
        {tree.children.map((child, index) => (
          <li
            key={index}
            className="flex gap-2"
          >
            <span className="text-muted-foreground">•</span>
            <span>{describeImportConditionNode(child)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
