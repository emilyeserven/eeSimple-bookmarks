import type { WebsiteExtensionFillRule } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { CopyJsonButton } from "@/components/CopyJsonButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Edit a whole rule as raw JSON — the fast path for tweaking filters, transforms, and the `sections`
 * target (`nameParts`, `container`, `sectionMatch`, …) without clicking through the field UI. Parses on
 * Apply and hands the object to `onChange`; the rule's own `id` is preserved so it stays the same rule.
 */
export function RuleJsonEditor({
  rule, onChange,
}: {
  rule: WebsiteExtensionFillRule;
  onChange: (rule: WebsiteExtensionFillRule) => void;
}) {
  const {
    t,
  } = useTranslation();
  // Seeded from the current rule each time the panel mounts (Radix unmounts collapsed content).
  const [text, setText] = useState(() => JSON.stringify(rule, null, 2));
  const [error, setError] = useState<string | null>(null);

  function apply(): void {
    let parsed: WebsiteExtensionFillRule;
    try {
      parsed = JSON.parse(text) as WebsiteExtensionFillRule;
    }
    catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
      return;
    }
    setError(null);
    // Keep the original id so JSON edits never fork the rule's identity.
    onChange({
      ...parsed,
      id: rule.id,
    });
  }

  return (
    <div className="space-y-2">
      <Textarea
        className="font-mono text-xs"
        rows={12}
        value={text}
        onChange={event => setText(event.target.value)}
      />
      {error
        ? (
          <p className="text-xs text-destructive">
            {t("Invalid JSON")}
            {": "}
            <span className="font-mono">{error}</span>
          </p>
        )
        : null}
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          onClick={apply}
        >
          {t("Apply JSON")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setText(JSON.stringify(rule, null, 2));
            setError(null);
          }}
        >
          {t("Reset")}
        </Button>
        <CopyJsonButton data={rule} />
      </div>
    </div>
  );
}
