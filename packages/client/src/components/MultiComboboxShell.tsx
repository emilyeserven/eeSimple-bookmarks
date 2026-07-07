import * as React from "react";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Command, CommandInput, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface MultiComboboxShellProps {
  "open": boolean;
  "onOpenChange": (open: boolean) => void;
  "dataSlot": string;
  /** Fully pre-computed by the caller, e.g. `cn(base, className)`. */
  "triggerClassName": string;
  "labelWrapperClassName": string;
  "chevronClassName": string;
  "id"?: string;
  "aria-label"?: string;
  /** Drives the trigger label's muted-text styling (no selection yet). */
  "isEmpty": boolean;
  "triggerLabel": React.ReactNode;
  /** Omit to use Command's own default (`true`, cmdk's built-in filtering). */
  "shouldFilter"?: boolean;
  "searchPlaceholder"?: string;
  /** Present only for a controlled search input (tree pruning); omit to stay uncontrolled. */
  "searchValue"?: string;
  "onSearchValueChange"?: (value: string) => void;
  /**
   * Optional action pinned to the bottom of the dropdown (e.g. "Create category…"). Rendered
   * outside the filtered list so it stays visible regardless of the search query; selecting it
   * closes the popover and runs `onSelect`.
   */
  "createOption"?: {
    label: string;
    onSelect: () => void;
  };
  /** `CommandList` contents — the flat or tree item rendering owned by the caller. */
  "children": React.ReactNode;
}

/**
 * Shared shell behind `MultiCombobox` and `TreeMultiCombobox`: the `Popover` + trigger `Button` +
 * `Command` + `CommandInput` + `createOption` footer wiring. Controlled and presentation-only — it
 * owns no state, so each caller keeps driving its own open/search/selection state and only differs
 * in how it renders the `CommandList` item list.
 */
export function MultiComboboxShell({
  open,
  onOpenChange,
  dataSlot,
  triggerClassName,
  labelWrapperClassName,
  chevronClassName,
  id,
  "aria-label": ariaLabel,
  isEmpty,
  triggerLabel,
  shouldFilter,
  searchPlaceholder,
  searchValue,
  onSearchValueChange,
  createOption,
  children,
}: MultiComboboxShellProps) {
  const {
    t,
  } = useTranslation();

  return (
    <Popover
      open={open}
      onOpenChange={onOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          aria-expanded={open}
          aria-label={ariaLabel}
          data-slot={dataSlot}
          className={triggerClassName}
        >
          <span
            className={cn(labelWrapperClassName, isEmpty && `
              text-muted-foreground
            `)}
          >
            {triggerLabel}
          </span>
          <ChevronsUpDown className={chevronClassName} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={shouldFilter}>
          <CommandInput
            placeholder={searchPlaceholder ?? t("Search…")}
            {...(onSearchValueChange
              ? {
                value: searchValue,
                onValueChange: onSearchValueChange,
              }
              : {})}
          />
          <CommandList>{children}</CommandList>
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
                    onOpenChange(false);
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
