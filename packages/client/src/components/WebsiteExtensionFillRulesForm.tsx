import type { UpdateWebsiteInput, Website, WebsiteExtensionFillRule } from "@eesimple/types";

import { useState } from "react";

import { ExtensionFillRulesEditor } from "./extensionFill/ExtensionFillRulesEditor";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import i18n from "../i18n";
import { normalizeExtensionFillRules } from "../lib/extensionFillForm";

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  extensionFillRules: i18n.t("Extension Fill Rules"),
};

interface Props {
  website: Website;
}

/** Edit a website's browser-extension "check & fill" extraction rules. Auto-saves on change. */
export function WebsiteExtensionFillRulesForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const [rules, setRules] = useState<WebsiteExtensionFillRule[]>(() => website.extensionFillRules);

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      extensionFillRules: normalizeExtensionFillRules(website.extensionFillRules),
    },
  });

  function handleChange(next: WebsiteExtensionFillRule[]): void {
    setRules(next);
    autoSave.saveField("extensionFillRules", normalizeExtensionFillRules(next));
  }

  return (
    <div className="space-y-6">
      <ExtensionFillRulesEditor
        rules={rules}
        onChange={handleChange}
      />
    </div>
  );
}
