import type { ComboboxOption } from "./Combobox";

import * as React from "react";

import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel, LocalizedNameSummary } from "./LocalizedNameLabel";
import { MultiComboboxShell } from "./MultiComboboxShell";

import { CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { useFallbackDisplayLanguageValue } from "@/hooks/fallbackDisplayLanguage";
import { useSecondaryDisplayLanguageValue } from "@/hooks/secondaryDisplayLanguage";
import { cn } from "@/lib/utils";

interface MultiComboboxProps {
  "options": ComboboxOption[];
  "values": string[];
  "onValuesChange": (values: string[]) => void;
  "placeholder"?: string;
  "searchPlaceholder"?: string;
  "emptyText"?: string;
  "className"?: string;
  /** Id applied to the trigger button so an external `<Label htmlFor>` can target it. */
  "id"?: string;
  "aria-label"?: string;
  /**
   * Optional action pinned to the bottom of the dropdown (e.g. "Create category…"). Rendered outside
   * the filtered list so it stays visible regardless of the search query; selecting it closes the
   * popover and runs `onSelect`.
   */
  "createOption"?: {
    label: string;
    onSelect: () => void;
  };
}

/**
 * Searchable multi-select built from shadcn `Popover` + `Command`, mirroring {@link Combobox}.
 * Selecting an option toggles it; the trigger shows the chosen labels (or a count when many).
 */
export function MultiCombobox({
  options,
  values,
  onValuesChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  id,
  "aria-label": ariaLabel,
  createOption,
}: MultiComboboxProps) {
  const {
    t,
  } = useTranslation();
  const secondaryLanguage = useSecondaryDisplayLanguageValue();
  const fallbackLanguage = useFallbackDisplayLanguageValue();
  const [open, setOpen] = React.useState(false);
  const selectedSet = new Set(values);
  const selectedOptions = options.filter(option => selectedSet.has(option.value));
  const summary
    = selectedOptions.length === 0
      ? (placeholder ?? t("Select…"))
      : (
        <LocalizedNameSummary
          options={selectedOptions}
          secondaryLanguage={secondaryLanguage}
          fallbackLanguage={fallbackLanguage}
        />
      );

  function toggle(value: string, disabled?: boolean) {
    if (disabled) return;
    onValuesChange(selectedSet.has(value)
      ? values.filter(current => current !== value)
      : [...values, value]);
  }

  return (
    <MultiComboboxShell
      open={open}
      onOpenChange={setOpen}
      dataSlot="multi-combobox"
      triggerClassName={cn(`
        h-auto min-h-9 w-full justify-between py-1.5 font-normal
      `, className)}
      labelWrapperClassName="min-w-0 text-left"
      chevronClassName="ml-2 shrink-0 opacity-50"
      id={id}
      aria-label={ariaLabel}
      isEmpty={selectedOptions.length === 0}
      triggerLabel={summary}
      searchPlaceholder={searchPlaceholder}
      createOption={createOption}
    >
      <CommandEmpty>{emptyText ?? t("No matches.")}</CommandEmpty>
      <CommandGroup>
        {options.map(option => (
          <CommandItem
            key={option.value}
            value={option.label}
            keywords={[
              option.searchAlias,
              ...(option.names?.map(name => name.value) ?? []),
            ].filter((keyword): keyword is string => Boolean(keyword))}
            disabled={option.disabled}
            onSelect={() => toggle(option.value, option.disabled)}
            style={{
              paddingLeft: `${0.5 + (option.depth ?? 0) * 1}rem`,
            }}
            className={cn(option.disabled && "cursor-not-allowed opacity-40")}
          >
            {option.icon}
            <LocalizedNameLabel
              names={option.names ?? []}
              base={option.label}
              secondaryLanguage={secondaryLanguage}
              fallbackLanguage={fallbackLanguage}
            />
            <Check
              className={cn(
                "ml-auto",
                selectedSet.has(option.value)
                  ? "opacity-100"
                  : "opacity-0",
              )}
            />
          </CommandItem>
        ))}
      </CommandGroup>
    </MultiComboboxShell>
  );
}
