import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { CaptureResultView } from "./CaptureResultView";

import { Textarea } from "@/components/ui/textarea";
import { runFillPreview } from "@/lib/fillEnginePreview";

/**
 * Per-rule capture test: the user pastes sample HTML (and optionally the expected JSON result) and sees
 * exactly what THIS rule extracts — the same engine the extension injects. Ephemeral: nothing is
 * persisted. A `backgroundImage` read only resolves on a live page, not on pasted HTML.
 */
export function RuleTestPanel({
  rule,
}: {
  rule: WebsiteExtensionFillRule;
}) {
  const {
    t,
  } = useTranslation();
  const [html, setHtml] = useState("");
  const [expected, setExpected] = useState("");
  const result = useMemo(() => runFillPreview([rule], html)[0], [rule, html]);
  return (
    <div className="space-y-2 rounded-md border border-dashed p-2">
      <label className="block space-y-1">
        <span className="text-xs font-medium">{t("Sample HTML")}</span>
        <Textarea
          className="font-mono text-xs"
          rows={5}
          placeholder="<ul>…</ul>"
          value={html}
          onChange={event => setHtml(event.target.value)}
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-medium">{t("Expected result (JSON, optional)")}</span>
        <Textarea
          className="font-mono text-xs"
          rows={3}
          placeholder="[ { &quot;name&quot;: &quot;…&quot; } ]"
          value={expected}
          onChange={event => setExpected(event.target.value)}
        />
      </label>
      <div className="space-y-1">
        <span className="text-xs font-medium">{t("Captured")}</span>
        {html.trim()
          ? (result
            ? (
              <CaptureResultView
                result={result}
                expected={expected}
              />
            )
            : <p className="text-xs text-muted-foreground">{t("This rule is incomplete — nothing to run.")}</p>)
          : <p className="text-xs text-muted-foreground">{t("Paste HTML above to see what this rule captures.")}</p>}
      </div>
    </div>
  );
}
