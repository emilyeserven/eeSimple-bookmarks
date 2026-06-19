import type { ParamRuleDraft } from "../lib/websiteForm";
import type { Website } from "@eesimple/types";

import { useState } from "react";

import { ParamRulesEditor } from "./WebsiteEditors";
import { useUpdateWebsite } from "../hooks/useWebsites";
import { normalizeRules } from "../lib/websiteForm";

import { Button } from "@/components/ui/button";

interface Props {
  website: Website;
}

/** Edit a website's path-scoped query-param whitelist rules. */
export function WebsiteParamRulesForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const [rules, setRules] = useState<ParamRuleDraft[]>(() =>
    website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    })));

  const payloadRules = normalizeRules(rules);
  const storedRules = normalizeRules(
    website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    })),
  );
  const dirty = JSON.stringify(payloadRules) !== JSON.stringify(storedRules);

  function save(): void {
    if (!dirty) return;
    updateWebsite.mutate({
      id: website.id,
      input: {
        paramRules: payloadRules,
      },
    });
  }

  return (
    <div className="space-y-6">
      <ParamRulesEditor
        idBase={website.id}
        rules={rules}
        onChange={setRules}
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || updateWebsite.isPending}
          onClick={save}
        >
          {updateWebsite.isPending ? "Saving…" : "Save changes"}
        </Button>
        {updateWebsite.isError
          ? <p className="text-sm text-destructive">{updateWebsite.error.message}</p>
          : null}
      </div>
    </div>
  );
}
