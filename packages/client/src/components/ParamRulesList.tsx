import type { WebsiteParamRule } from "@eesimple/types";

import { useTranslation } from "react-i18next";

interface ParamRulesListProps {
  rules: WebsiteParamRule[];
  /** Text shown when there are no rules. */
  emptyText: string;
}

/**
 * Read-only list of a website's keep-param rules — each path suffix and the query params kept for it.
 * Rendered by the website workbench's Param Rules view tab.
 */
export function ParamRulesList({
  rules, emptyText,
}: ParamRulesListProps) {
  const {
    t,
  } = useTranslation();
  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2 text-sm">
      {rules.map((rule, index) => (
        <li
          key={index}
          className="rounded-md border p-2"
        >
          <span className="font-mono">{rule.pathSuffix || t("any path")}</span>
          <span className="text-muted-foreground"> → </span>
          <span className="font-mono">
            {rule.params.length > 0 ? rule.params.join(", ") : t("(none kept)")}
          </span>
        </li>
      ))}
    </ul>
  );
}
