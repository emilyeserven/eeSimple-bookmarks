import type { DraftLanguageUsage } from "./draftLanguageUsage";
import type { LanguageUsageKind } from "@eesimple/types";

import { useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLanguages } from "../../hooks/useLanguages";
import { useLanguageUsageLevels } from "../../hooks/useLanguageUsageLevels";
import { Combobox } from "../Combobox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useEntityCreateOption } from "../useEntityCreateOption";

interface LanguageUsagesEditorProps {
  value: DraftLanguageUsage[];
  onChange: (rows: DraftLanguageUsage[]) => void;
  /** Which usage-level group to offer — content owners pass `availability`, People pass `proficiency`. */
  kind: LanguageUsageKind;
}

/**
 * A repeatable editor for an owner's language usages: each row picks a language + a usage level (of
 * the given `kind`) and an optional note. Controlled over {@link DraftLanguageUsage}[] — the parent
 * persists the complete rows via {@link entriesFromDrafts}. Languages are inline-creatable; usage
 * levels are managed on Settings → Language Usage Levels.
 */
export function LanguageUsagesEditor({
  value, onChange, kind,
}: LanguageUsagesEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();
  const {
    data: levels = [],
  } = useLanguageUsageLevels(kind);

  // Which row a just-created language should be applied to.
  const [createTarget, setCreateTarget] = useState<number | null>(null);
  const languageCreate = useEntityCreateOption("language", (language) => {
    if (createTarget !== null) updateRow(createTarget, {
      languageId: language.id,
    });
    setCreateTarget(null);
  });

  function updateRow(index: number, patch: Partial<DraftLanguageUsage>) {
    onChange(value.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...value, {
      languageId: "",
      usageLevelId: "",
      note: "",
    }]);
  }

  const languageOptions = languages.map(l => ({
    value: l.id,
    label: l.name,
  }));
  const levelOptions = levels.map(l => ({
    value: l.id,
    label: l.name,
  }));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("No languages added yet.")}</p>
      )}
      {value.map((row, index) => (
        <div
          key={index}
          className="
            flex flex-col gap-2
            sm:flex-row sm:items-center
          "
        >
          <div className="sm:w-1/3">
            <Combobox
              aria-label={t("Language")}
              placeholder={t("Language")}
              searchPlaceholder={t("Search languages…")}
              emptyText={t("No languages found.")}
              options={languageOptions}
              value={row.languageId || undefined}
              onValueChange={v => updateRow(index, {
                languageId: v ?? "",
              })}
              createOption={{
                label: languageCreate.createOption.label,
                onSelect: () => {
                  setCreateTarget(index);
                  languageCreate.createOption.onSelect();
                },
              }}
            />
          </div>
          <div className="sm:w-1/3">
            <Combobox
              aria-label={t("Usage level")}
              placeholder={t("Usage level")}
              searchPlaceholder={t("Search levels…")}
              emptyText={t("No usage levels found.")}
              options={levelOptions}
              value={row.usageLevelId || undefined}
              onValueChange={v => updateRow(index, {
                usageLevelId: v ?? "",
              })}
            />
          </div>
          <Input
            className="sm:flex-1"
            placeholder={t("Note (optional)")}
            value={row.note}
            onChange={e => updateRow(index, {
              note: e.target.value,
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Remove language")}
            onClick={() => removeRow(index)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
      >
        <Plus className="size-4" />
        {t("Add language")}
      </Button>
      {languageCreate.modal}
    </div>
  );
}
