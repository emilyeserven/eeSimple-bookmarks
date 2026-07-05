import type { LanguageUsageCondition } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { EntityMultiSelectCondition } from "./EntityMultiSelectCondition";

import { useLanguages } from "@/hooks/useLanguages";
import { useLanguageUsageLevels } from "@/hooks/useLanguageUsageLevels";
import { sortLanguagesFavoritesFirst } from "@/lib/languageOptions";

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
    t,
  } = useTranslation();
  const {
    data: languages = [], isLoading: languagesLoading,
  } = useLanguages();
  const {
    data: levels = [], isLoading: levelsLoading,
  } = useLanguageUsageLevels();

  return (
    <div className="space-y-2">
      <EntityMultiSelectCondition
        ariaLabel={t("Languages")}
        placeholder={languagesLoading ? t("Loading…") : t("Any language")}
        searchPlaceholder={t("Search languages…")}
        emptyText={t("No languages found.")}
        options={sortLanguagesFavoritesFirst(languages).map(l => ({
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
        ariaLabel={t("Usage levels")}
        placeholder={levelsLoading ? t("Loading…") : t("Any usage level")}
        searchPlaceholder={t("Search usage levels…")}
        emptyText={t("No usage levels found.")}
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
