import type { ComboboxOption } from "../../Combobox";
import type { ExtensionFillOverrides, ExtensionFillRuleGroup, OverrideKey } from "@eesimple/types";

import { OVERRIDE_KEYS } from "@eesimple/types";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { OverrideValueEditor } from "./overrideEditors";
import { defaultOverrideValue, OVERRIDE_KEY_LABELS } from "./overrideMeta";
import { Combobox } from "../../Combobox";

import { Button } from "@/components/ui/button";

/**
 * Edit which options a group overrides (and their values). Each set override renders its per-key
 * value editor with a Remove button; an "Add override" picker adds a not-yet-set option. Editing a
 * value flows up to re-materialize the group's member rules (see `useExtensionFillRulesEditor`).
 */
export function GroupOverridesEditor({
  group, propertyOptions, sectionsOptions, onSetOverride, onClearOverride,
}: {
  group: ExtensionFillRuleGroup;
  propertyOptions: ComboboxOption[];
  sectionsOptions: ComboboxOption[];
  onSetOverride: (key: OverrideKey, value: ExtensionFillOverrides[OverrideKey]) => void;
  onClearOverride: (key: OverrideKey) => void;
}) {
  const {
    t,
  } = useTranslation();
  const setKeys = OVERRIDE_KEYS.filter(key => group.overrides[key] !== undefined);
  const unsetKeys = OVERRIDE_KEYS.filter(key => group.overrides[key] === undefined);
  const addOptions: ComboboxOption[] = unsetKeys.map(key => ({
    value: key,
    label: t(OVERRIDE_KEY_LABELS[key]),
  }));

  return (
    <div className="space-y-3">
      {setKeys.length === 0
        ? (
          <p className="text-xs text-muted-foreground">
            {t("This group overrides no options yet. Add one below to lock it across the group's rules.")}
          </p>
        )
        : null}
      {setKeys.map(key => (
        <div
          key={key}
          className="rounded-md border p-2"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{t(OVERRIDE_KEY_LABELS[key])}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6"
              aria-label={t("Remove override")}
              onClick={() => onClearOverride(key)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
          <OverrideValueEditor
            overrideKey={key}
            value={group.overrides[key]}
            onChange={value => onSetOverride(key, value as ExtensionFillOverrides[OverrideKey])}
            overrides={group.overrides}
            propertyOptions={propertyOptions}
            sectionsOptions={sectionsOptions}
          />
        </div>
      ))}
      {addOptions.length > 0
        ? (
          <Combobox
            aria-label={t("Add override")}
            options={addOptions}
            value={undefined}
            placeholder={t("Add an override…")}
            emptyText={t("No more options.")}
            onValueChange={value => value && onSetOverride(value as OverrideKey, defaultOverrideValue(value as OverrideKey))}
          />
        )
        : null}
    </div>
  );
}
