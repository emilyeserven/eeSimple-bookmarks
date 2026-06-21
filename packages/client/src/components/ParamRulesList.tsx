import type { WebsiteParamRule } from "@eesimple/types";

interface ParamRulesListProps {
  rules: WebsiteParamRule[];
  /** Text shown when there are no rules (the card and the tab word this differently). */
  emptyText: string;
}

/**
 * Read-only list of a website's keep-param rules — each path suffix and the query params kept for it.
 * Shared by `WebsiteCard` and the Param Rules view tab.
 */
export function ParamRulesList({
  rules, emptyText,
}: ParamRulesListProps) {
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
          <span className="font-mono">{rule.pathSuffix || "any path"}</span>
          <span className="text-muted-foreground"> → </span>
          <span className="font-mono">
            {rule.params.length > 0 ? rule.params.join(", ") : "(none kept)"}
          </span>
        </li>
      ))}
    </ul>
  );
}
