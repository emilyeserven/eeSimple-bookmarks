import type { FillEngineResult } from "@/lib/fillEnginePreview";

import { AlertTriangle, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { previewActual, previewMatchesExpected } from "@/lib/fillEnginePreview";

/**
 * Renders what the fill engine captured for one rule against pasted HTML: the error (if the rule
 * threw), else the structured `entries` (the `sections` case) or the flat `values`, pretty-printed.
 * When `expected` (raw JSON) is supplied, shows a match/mismatch badge against the captured value.
 */
export function CaptureResultView({
  result, expected,
}: {
  result: FillEngineResult;
  expected?: string;
}) {
  const {
    t,
  } = useTranslation();
  if (result.error) {
    return (
      <p className="text-xs text-destructive">
        {t("Error")}
        {": "}
        <span className="font-mono">{result.error}</span>
      </p>
    );
  }
  const captured = previewActual(result);
  const isEmpty = Array.isArray(captured) && captured.length === 0;
  const match = expected !== undefined ? previewMatchesExpected(result, expected) : null;
  return (
    <div className="space-y-1">
      {isEmpty
        ? <p className="text-xs text-muted-foreground">{t("No matches captured.")}</p>
        : (
          <pre
            className="
              max-h-64 overflow-auto rounded-md bg-muted p-2 font-mono text-xs
            "
          >
            {JSON.stringify(captured, null, 2)}
          </pre>
        )}
      {match === "match"
        ? (
          <p
            className="
              flex items-center gap-1 text-xs text-emerald-600
              dark:text-emerald-400
            "
          >
            <Check className="size-3" />
            {t("Matches expected")}
          </p>
        )
        : null}
      {match === "mismatch"
        ? (
          <p className="flex items-center gap-1 text-xs text-destructive">
            <X className="size-3" />
            {t("Does not match expected")}
          </p>
        )
        : null}
      {match === "invalid"
        ? (
          <p
            className="
              flex items-center gap-1 text-xs text-amber-600
              dark:text-amber-400
            "
          >
            <AlertTriangle className="size-3" />
            {t("Expected value is not valid JSON")}
          </p>
        )
        : null}
    </div>
  );
}
