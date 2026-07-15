import type { ExtensionFillRuleGroup, WebsiteExtensionFillRule } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { CaptureResultView } from "./CaptureResultView";

import { CopyJsonButton } from "@/components/CopyJsonButton";
import { Textarea } from "@/components/ui/textarea";
import { normalizeExtensionFillRules } from "@/lib/extensionFillForm";
import { materializeAll } from "@/lib/extensionFillGroups";
import { runFillPreview } from "@/lib/fillEnginePreview";

/**
 * Website-wide debug: run ALL of this site's rules (with group overrides materialized, then
 * normalized) against pasted HTML and show what each captures — the closest in-app mirror of what the
 * extension popup would offer. Ephemeral; nothing is persisted.
 */
export function ExtensionFillDebugTab({
  rules, groups,
}: {
  rules: WebsiteExtensionFillRule[];
  groups: ExtensionFillRuleGroup[];
}) {
  const {
    t,
  } = useTranslation();
  const [html, setHtml] = useState("");
  // Materialize group overrides, then normalize — the exact rule set the extension would run and ship.
  const runnable = useMemo(() => materializeAll(groups, rules), [groups, rules]);
  const normalized = useMemo(() => normalizeExtensionFillRules(runnable), [runnable]);
  const results = useMemo(() => runFillPreview(runnable, html), [runnable, html]);

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold">{t("Debug")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("Paste a page's HTML to see what every rule on this site captures — the same extraction the browser extension runs.")}
        </p>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-medium">{t("Sample HTML")}</span>
        <Textarea
          className="font-mono text-xs"
          rows={8}
          placeholder="<html>…</html>"
          value={html}
          onChange={event => setHtml(event.target.value)}
        />
      </label>
      <div>
        <CopyJsonButton
          data={normalized}
          label={t("Copy all rules as JSON")}
        />
      </div>
      {!html.trim()
        ? <p className="text-sm text-muted-foreground">{t("Paste HTML above to run every rule.")}</p>
        : normalized.length === 0
          ? <p className="text-sm text-muted-foreground">{t("No complete rules to run yet.")}</p>
          : (
            <ul className="space-y-3">
              {results.map((result, index) => (
                <li
                  key={result.ruleId}
                  className="space-y-1 rounded-lg border p-3"
                >
                  <p className="text-sm font-medium">
                    {normalized[index]?.label.trim() || t("Untitled rule")}
                  </p>
                  <CaptureResultView result={result} />
                </li>
              ))}
            </ul>
          )}
    </div>
  );
}
