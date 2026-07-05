import { useTranslation } from "react-i18next";

import { useLanguages } from "../../hooks/useLanguages";
import { languageComboboxGroups } from "../../lib/languageOptions";
import { Combobox } from "../Combobox";
import { Label } from "../ui/label";

interface PrimaryLanguageFieldProps {
  value: string | undefined;
  onValueChange: (value: string | undefined) => void;
}

/**
 * Shown under an owner's main Name field: picking a language here is what makes the Name field the
 * entity's primary-language name. Optional and clearable — selecting the active option again clears
 * it, per `Combobox`'s existing behavior.
 */
export function PrimaryLanguageField({
  value, onValueChange,
}: PrimaryLanguageFieldProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();

  return (
    <div className="space-y-1">
      <Label>{t("Primary language")}</Label>
      <Combobox
        aria-label={t("Primary language")}
        placeholder={t("None")}
        searchPlaceholder={t("Search languages…")}
        emptyText={t("No languages found.")}
        groups={languageComboboxGroups(languages, t)}
        value={value}
        onValueChange={onValueChange}
      />
      <p className="text-xs text-muted-foreground">
        {t("The language this name is written in.")}
      </p>
    </div>
  );
}
