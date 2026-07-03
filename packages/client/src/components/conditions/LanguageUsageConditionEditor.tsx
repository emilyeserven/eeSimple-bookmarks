import type { LanguageUsageCondition } from "@eesimple/types";

import { EntityMultiSelectCondition } from "./EntityMultiSelectCondition";

import { useLanguages } from "@/hooks/useLanguages";
import { useLanguageUsageLevels } from "@/hooks/useLanguageUsageLevels";

interface LanguageUsageConditionEditorProps {
  value: LanguageUsageCondition;
  onChange: (next: LanguageUsageCondition) => void;
}

/**
 * Controlled editor for a "has a language usage …" condition: two multi-selects (languages + usage
 * levels). A bookmark matches when a single association row satisfies both non-empty constraints.
 * Usage levels aren't filtered by kind here since a bookmark can carry either kind's level.
 */
export function LanguageUsageConditionEditor({
  value, onChange,
}: LanguageUsageConditionEditorProps) {
  const {
    data: languages = [], isLoading: languagesLoading,
  } = useLanguages();
  const {
    data: levels = [], isLoading: levelsLoading,
  } = useLanguageUsageLevels();

  return (
    <div className="space-y-2">
      <EntityMultiSelectCondition
        ariaLabel="Languages"
        placeholder={languagesLoading ? "Loading…" : "Any language"}
        searchPlaceholder="Search languages…"
        emptyText="No languages found."
        options={languages.map(l => ({
          value: l.id,
          label: l.name,
        }))}
        values={value.languageIds}
        onValuesChange={languageIds =>
          onChange({
            ...value,
            languageIds,
          })}
      />
      <EntityMultiSelectCondition
        ariaLabel="Usage levels"
        placeholder={levelsLoading ? "Loading…" : "Any usage level"}
        searchPlaceholder="Search usage levels…"
        emptyText="No usage levels found."
        options={levels.map(l => ({
          value: l.id,
          label: l.name,
        }))}
        values={value.usageLevelIds}
        onValuesChange={usageLevelIds =>
          onChange({
            ...value,
            usageLevelIds,
          })}
      />
    </div>
  );
}
