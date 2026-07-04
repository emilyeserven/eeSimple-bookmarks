import type { DraftEntityName } from "./draftEntityName";

import { useState } from "react";

import { Plus, Trash2 } from "lucide-react";

import { useLanguages } from "../../hooks/useLanguages";
import { Combobox } from "../Combobox";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { useEntityCreateOption } from "../useEntityCreateOption";

interface EntityNamesEditorProps {
  value: DraftEntityName[];
  onChange: (rows: DraftEntityName[]) => void;
}

/**
 * A repeatable editor for an owner's multilingual names: each row picks a language + the name text
 * in that language, with a "Primary" marker — at most one row may be primary, since saving mirrors
 * the primary row's value into the owner's base name/title column. Controlled over
 * {@link DraftEntityName}[] — the parent persists the complete rows via {@link entriesFromDrafts}.
 * Languages are inline-creatable.
 */
export function EntityNamesEditor({
  value, onChange,
}: EntityNamesEditorProps) {
  const {
    data: languages = [],
  } = useLanguages();

  // Which row a just-created language should be applied to.
  const [createTarget, setCreateTarget] = useState<number | null>(null);
  const languageCreate = useEntityCreateOption("language", (language) => {
    if (createTarget !== null) updateRow(createTarget, {
      languageId: language.id,
    });
    setCreateTarget(null);
  });

  function updateRow(index: number, patch: Partial<DraftEntityName>) {
    onChange(value.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }
  function setPrimary(index: number) {
    onChange(value.map((row, i) => ({
      ...row,
      isPrimary: i === index,
    })));
  }
  function removeRow(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }
  function addRow() {
    onChange([...value, {
      languageId: "",
      value: "",
      isPrimary: false,
    }]);
  }

  const languageOptions = languages.map(l => ({
    value: l.id,
    label: l.name,
  }));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">No additional names added yet.</p>
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
              aria-label="Language"
              placeholder="Language"
              searchPlaceholder="Search languages…"
              emptyText="No languages found."
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
          <Input
            className="sm:flex-1"
            placeholder="Name in this language"
            value={row.value}
            onChange={e => updateRow(index, {
              value: e.target.value,
            })}
          />
          <label className="flex shrink-0 items-center gap-1.5 text-sm">
            <Checkbox
              checked={row.isPrimary}
              onCheckedChange={checked => (checked ? setPrimary(index) : undefined)}
              aria-label="Primary name"
            />
            Primary
          </label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove name"
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
        Add name
      </Button>
      {languageCreate.modal}
    </div>
  );
}
