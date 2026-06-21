import type { ParamRuleDraft } from "../lib/websiteForm";
import type { UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { ParamRulesEditor } from "./WebsiteEditors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import { normalizeRules } from "../lib/websiteForm";

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  paramRules: "Param Rules",
};

interface Props {
  website: Website;
}

/** Edit a website's path-scoped query-param whitelist rules. Auto-saves on change. */
export function WebsiteParamRulesForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const [rules, setRules] = useState<ParamRuleDraft[]>(() =>
    website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    })));

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      paramRules: normalizeRules(
        website.paramRules.map(rule => ({
          pathSuffix: rule.pathSuffix,
          paramsText: rule.params.join(", "),
        })),
      ),
    },
  });

  function handleChange(next: ParamRuleDraft[]): void {
    setRules(next);
    autoSave.saveField("paramRules", normalizeRules(next));
  }

  return (
    <div className="space-y-6">
      <ParamRulesEditor
        idBase={website.id}
        rules={rules}
        onChange={handleChange}
      />
    </div>
  );
}
