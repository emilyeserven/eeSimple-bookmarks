import * as React from "react";

import { Check, ChevronsUpDown, Plus } from "lucide-react";

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

interface ComboboxProps {
  "options": ComboboxOption[];
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

/**
 * Searchable single-select built from shadcn `Popover` + `Command`. Selecting the
 * active option again clears it. Shadcn-style API: `value` / `onValueChange`.
 */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  className,
  id,
  "aria-label": ariaLabel,
  createOption,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(option => option.value === value);

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
                : placeholder}
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
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
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
              ))}
            </CommandGroup>
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
