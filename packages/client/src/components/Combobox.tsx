import * as React from "react";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { RomanizedLabel } from "./RomanizedLabel";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/** A selectable option, optionally indented by `depth` to convey hierarchy. */
export interface ComboboxOption {
  value: string;
  label: string;
  depth?: number;
  /** Optional secondary text (e.g. a romanized name) the search also matches against. */
  searchAlias?: string;
  /**
   * Optional romanized form of {@link label}, shown de-emphasized after it (respecting the user's
   * "Show Romanized by default" preference) and also matched by the search. Use this — rather than
   * {@link searchAlias} — when the secondary text should be visible, not just searchable.
   */
  romanized?: string | null;
  /** Optional element rendered at the inline-start of the option (and the trigger when selected). */
  icon?: React.ReactNode;
  /** When true the option is shown but cannot be selected. */
  disabled?: boolean;
}

/** A named group of options rendered under a heading in the dropdown. */
export interface ComboboxGroup {
  heading: string;
  options: ComboboxOption[];
}

interface ComboboxProps {
  /** Flat option list. Use `groups` instead to render options under named headings. */
  "options"?: ComboboxOption[];
  /** Grouped options, each rendered under a `CommandGroup` heading. Overrides `options`. */
  "groups"?: ComboboxGroup[];
  "value"?: string;
  "onValueChange": (value: string | undefined) => void;
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

function renderComboOption(
  option: ComboboxOption,
  value: string | undefined,
  onValueChange: (value: string | undefined) => void,
  setOpen: (open: boolean) => void,
) {
  return (
    <CommandItem
      key={option.value}
      value={option.label}
      keywords={[option.searchAlias, option.romanized].filter(
        (keyword): keyword is string => Boolean(keyword),
      )}
      onSelect={() => {
        onValueChange(option.value === value ? undefined : option.value);
        setOpen(false);
      }}
      style={{
        paddingLeft: `${0.5 + (option.depth ?? 0) * 1}rem`,
      }}
      disabled={option.disabled}
    >
      {option.icon}
      {option.romanized
        ? (
          <RomanizedLabel
            name={option.label}
            romanized={option.romanized}
          />
        )
        : option.label}
      <Check
        className={cn(
          "ml-auto",
          option.value === value ? "opacity-100" : "opacity-0",
        )}
      />
    </CommandItem>
  );
}

/**
 * Searchable single-select built from shadcn `Popover` + `Command`. Selecting the
 * active option again clears it. Shadcn-style API: `value` / `onValueChange`.
 */
export function Combobox({
  options,
  groups,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  id,
  "aria-label": ariaLabel,
  createOption,
}: ComboboxProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const allOptions = groups ? groups.flatMap(g => g.options) : (options ?? []);
  const selected = allOptions.find(option => option.value === value);
  const resolvedPlaceholder = placeholder ?? t("Select…");
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("Search…");
  const resolvedEmptyText = emptyText ?? t("No matches.");

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          aria-expanded={open}
          aria-label={ariaLabel}
          data-slot="combobox"
          className={cn("w-full justify-between font-normal", className)}
        >
          <span
            className={cn("flex min-w-0 items-center gap-2", !selected && `
              text-muted-foreground
            `)}
          >
            {selected?.icon}
            <span className="truncate">
              {selected
                ? selected.romanized
                  ? (
                    <RomanizedLabel
                      name={selected.label}
                      romanized={selected.romanized}
                    />
                  )
                  : selected.label
                : resolvedPlaceholder}
            </span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={resolvedSearchPlaceholder} />
          <CommandList>
            <CommandEmpty>{resolvedEmptyText}</CommandEmpty>
            {groups
              ? groups.map(group => (
                <CommandGroup
                  key={group.heading}
                  heading={group.heading}
                >
                  {group.options.map(option => renderComboOption(option, value, onValueChange, setOpen))}
                </CommandGroup>
              ))
              : (
                <CommandGroup>
                  {(options ?? []).map(option => renderComboOption(option, value, onValueChange, setOpen))}
                </CommandGroup>
              )}
          </CommandList>
          {createOption
            ? (
              <>
                <Separator />
                <button
                  type="button"
                  className="
                    flex w-full items-center gap-2 p-2 text-sm font-medium
                    hover:bg-accent hover:text-accent-foreground
                  "
                  onClick={() => {
                    setOpen(false);
                    createOption.onSelect();
                  }}
                >
                  <Plus className="size-4 shrink-0" />
                  {createOption.label}
                </button>
              </>
            )
            : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
