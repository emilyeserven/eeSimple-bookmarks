import type { LanguageUsage } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { Badge } from "../ui/badge";

interface LanguageUsagesViewProps {
  usages: LanguageUsage[];
  /** Text shown when there are no usages. */
  emptyText?: string;
}

/** Read-only display of an owner's language usages as `Language — Level · Source (note)` chips. */
export function LanguageUsagesView({
  usages, emptyText,
}: LanguageUsagesViewProps) {
  const {
    t,
  } = useTranslation();
  if (usages.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyText ?? t("No languages added.")}</p>;
  }
  return (
    <ul className="flex flex-wrap gap-2">
      {usages.map(usage => (
        <li key={usage.id}>
          <Badge
            variant="secondary"
            className="gap-1"
          >
            <span className="font-medium">{usage.language.name}</span>
            <span className="text-muted-foreground">—</span>
            <span>{usage.level.name}</span>
            {usage.translationSource && (
              <span className="text-muted-foreground">· {usage.translationSource.name}</span>
            )}
            {usage.note && <span className="text-muted-foreground">({usage.note})</span>}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
