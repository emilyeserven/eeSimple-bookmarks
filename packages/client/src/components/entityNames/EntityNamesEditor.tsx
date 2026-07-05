import type { DraftEntityName } from "./draftEntityName";

import { useState } from "react";

import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useLanguages } from "../../hooks/useLanguages";
import { languageComboboxGroups } from "../../lib/languageOptions";
import { AddLanguageModal } from "../AddLanguageModal";
import { Combobox } from "../Combobox";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface EntityNamesEditorProps {
  value: DraftEntityName[];
  onChange: (rows: DraftEntityName[]) => void;
}

/**
 * A repeatable editor for an owner's *additional* (non-primary) multilingual names: each row picks a
 * language + the name text in that language. The primary name's language is set separately, next to
 * the owner's main Name field (see `PrimaryLanguageField`) — this list never shows or edits that row.
 * Controlled over {@link DraftEntityName}[] — the parent persists the complete rows via
 * {@link entriesFromDrafts}. Languages are inline-creatable via `AddLanguageModal` directly (not the shared
 * `useEntityCreateOption` registry) — this editor is imported by several `Add*Form`-wrapped create
 * forms (Tag/Location/Book/Plex-title), and that registry itself imports every `Add*Modal`,
 * including the ones wrapping those forms; going through it here would create an import cycle
 * (mirrors the same manual-modal workaround already used by `LocationForm`/`BookForm` for their own
 * pickers).
 */
export function EntityNamesEditor({
  value, onChange,
}: EntityNamesEditorProps) {
  const {
    t,
  } = useTranslation();
  const {
    data: languages = [],
  } = useLanguages();

  // Which row a just-created language should be applied to.
  const [createTarget, setCreateTarget] = useState<number | null>(null);
  const [addLanguageOpen, setAddLanguageOpen] = useState(false);

  function updateRow(index: number, patch: Partial<DraftEntityName>) {
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
      value: "",
    }]);
  }

  const languageGroups = languageComboboxGroups(languages, t);

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("No additional names added yet.")}</p>
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
              groups={languageGroups}
              value={row.languageId || undefined}
              onValueChange={v => updateRow(index, {
                languageId: v ?? "",
              })}
              createOption={{
                label: t("Create language"),
                onSelect: () => {
                  setCreateTarget(index);
                  setAddLanguageOpen(true);
                },
              }}
            />
          </div>
          <Input
            className="sm:flex-1"
            placeholder={t("Name in this language")}
            value={row.value}
            onChange={e => updateRow(index, {
              value: e.target.value,
            })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("Remove name")}
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
        {t("Add name")}
      </Button>
      <AddLanguageModal
        open={addLanguageOpen}
        onOpenChange={setAddLanguageOpen}
        onCreated={(language) => {
          if (createTarget !== null) updateRow(createTarget, {
            languageId: language.id,
          });
          setCreateTarget(null);
        }}
      />
    </div>
  );
}
