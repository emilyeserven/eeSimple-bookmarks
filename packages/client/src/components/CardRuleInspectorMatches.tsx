import type { RuleAttrLabels } from "../lib/cardDisplayRuleAttrFormat";
import type { RuleInspection } from "../lib/cardDisplayRules";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatRuleAttrValue } from "../lib/cardDisplayRuleAttrFormat";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CardRuleInspectorMatchesProps {
  matchedRules: RuleInspection[];
  unmatchedRules: RuleInspection[];
  ruleNameById: Map<string, string>;
  labels: RuleAttrLabels;
}

/**
 * The matched-rule cards (each rule's applied/overridden display attributes) plus the collapsible
 * "don't apply" list. Split out of {@link CardDisplayRuleInspector} so the view stays a thin shell.
 */
export function CardRuleInspectorMatches({
  matchedRules, unmatchedRules, ruleNameById, labels,
}: CardRuleInspectorMatchesProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-3">
      {matchedRules.map(ri => (
        <div
          key={ri.rule.id}
          className="space-y-2 rounded-lg border p-3"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{ri.rule.name}</span>
            {ri.rule.isDefault
              ? <Badge variant="secondary">{t("Default")}</Badge>
              : null}
          </div>
          {ri.attrs.length === 0
            ? (
              <p className="text-sm text-muted-foreground">
                {t("Matches, but sets no display attributes.")}
              </p>
            )
            : (
              <ul className="space-y-1">
                {ri.attrs.map(attr => (
                  <li
                    key={attr.key}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <span
                      className={cn(
                        "min-w-0",
                        attr.status === "overridden" && `
                          text-muted-foreground line-through
                        `,
                      )}
                    >
                      <span className="font-medium">{attr.label}:</span>
                      {" "}
                      {formatRuleAttrValue(attr, labels)}
                    </span>
                    {attr.status === "applied"
                      ? <Badge className="shrink-0 bg-green-600">{t("Applied")}</Badge>
                      : (
                        <Badge
                          variant="outline"
                          className="shrink-0 text-muted-foreground"
                        >
                          {t("Overridden by {{ruleName}}", {
                            ruleName: ruleNameById.get(attr.overriddenBy ?? "") ?? t("a higher rule"),
                          })}
                        </Badge>
                      )}
                  </li>
                ))}
              </ul>
            )}
        </div>
      ))}

      {unmatchedRules.length > 0
        ? (
          <Collapsible>
            <CollapsibleTrigger
              className="
                group flex items-center gap-1 text-sm text-muted-foreground
                hover:text-foreground
              "
            >
              <ChevronDown
                className="
                  size-4 transition-transform
                  group-data-[state=open]:rotate-180
                "
              />
              {unmatchedRules.length === 1
                ? t("{{count}} rule doesn't apply", {
                  count: unmatchedRules.length,
                })
                : t("{{count}} rules don't apply", {
                  count: unmatchedRules.length,
                })}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2 pl-5">
              <ul className="space-y-1 text-sm text-muted-foreground">
                {unmatchedRules.map(ri => <li key={ri.rule.id}>{ri.rule.name}</li>)}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        )
        : null}
    </div>
  );
}
