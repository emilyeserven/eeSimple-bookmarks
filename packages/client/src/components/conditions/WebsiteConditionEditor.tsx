import type { WebsiteCondition } from "@eesimple/types";

import { Globe } from "lucide-react";

import { MultiCombobox } from "../MultiCombobox";
import { useEntityCreateOption } from "../useEntityCreateOption";

import { useWebsites } from "@/hooks/useWebsites";

interface WebsiteConditionEditorProps {
  value: WebsiteCondition;
  onChange: (next: WebsiteCondition) => void;
}

/**
 * Controlled multi-select editor for a "website is one of …" condition. Websites are matched by
 * domain (a bookmark's host, with a leading `www.` stripped). New websites can be added inline.
 */
export function WebsiteConditionEditor({
  value, onChange,
}: WebsiteConditionEditorProps) {
  const {
    data: websites = [], isLoading,
  } = useWebsites();

  const {
    createOption, modal,
  } = useEntityCreateOption("website", (website) => {
    if (!value.domains.includes(website.domain)) {
      onChange({
        ...value,
        domains: [...value.domains, website.domain],
      });
    }
  });

  // Surface every selected domain even if no website record matches it (e.g. a backfilled legacy
  // domain match), so the editor never silently drops a stored value.
  const knownDomains = new Set(websites.map(w => w.domain));
  const options = [
    ...websites.map(w => ({
      value: w.domain,
      label: w.siteName ?? w.domain,
      icon: w.imageUrl
        ? (
          <img
            src={w.imageUrl}
            alt=""
            className="size-4 shrink-0 rounded-sm object-contain"
          />
        )
        : <Globe className="size-4 shrink-0 text-muted-foreground" />,
    })),
    ...value.domains
      .filter(domain => !knownDomains.has(domain))
      .map(domain => ({
        value: domain,
        label: domain,
      })),
  ];

  return (
    <div className="space-y-2">
      <MultiCombobox
        aria-label="Websites"
        placeholder={isLoading ? "Loading…" : "Any website"}
        searchPlaceholder="Search websites…"
        emptyText="No websites found."
        options={options}
        values={value.domains}
        onValuesChange={domains =>
          onChange({
            ...value,
            domains,
          })}
        createOption={createOption}
      />
      {modal}
    </div>
  );
}
