import type {
  ConditionMatchOperator,
  ConditionNode,
  ConditionTree,
  ImportRule,
  ImportRuleAction,
} from "@eesimple/types";

import { useTranslation } from "react-i18next";

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

/** Body of the General view tab: action badge, description, and metadata. */
export function ImportRuleGeneralFields({
  rule,
}: { rule: ImportRule }) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-3 text-sm">
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2">
        <dt className="text-muted-foreground">{t("Action")}</dt>
        <dd className="font-medium">{actionLabel(rule.action)}</dd>
        <dt className="text-muted-foreground">{t("Priority")}</dt>
        <dd>{rule.sortOrder}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{rule.slug}</dd>
        <dt className="text-muted-foreground">{t("Added")}</dt>
        <dd>{new Date(rule.createdAt).toLocaleDateString()}</dd>
      </dl>
      {rule.description
        ? <p className="mt-2">{rule.description}</p>
        : <p className="text-muted-foreground">{t("No description.")}</p>}
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
