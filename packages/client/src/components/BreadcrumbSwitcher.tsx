import type { SwitcherSpec } from "@/lib/breadcrumbSwitcherOptions";

import * as React from "react";

import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSwitcherOptions } from "@/lib/breadcrumbSwitcherOptions";
import { cn } from "@/lib/utils";

export type { SwitcherSpec, TaxonomyEntity } from "@/lib/breadcrumbSwitcherOptions";

/**
 * The hover-revealed "switch to a sibling" button beside a switchable breadcrumb crumb. The crumb's
 * label is still rendered by the breadcrumb loop; this renders only the button + the searchable
 * Popover/Command flyout. Selecting a sibling navigates immediately. Renders nothing when there is no
 * sibling to switch to.
 */
export function BreadcrumbSwitcher({
  spec,
}: { spec: SwitcherSpec }) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const {
    options, currentValue, isLoading,
  } = useSwitcherOptions(spec);

  // No point in a switcher with only the current item (count is known eagerly — all lists are cached).
  if (!isLoading && options.length <= 1) return null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          data-slot="breadcrumb-switcher"
          aria-label={t("Switch to a related page")}
          className={cn(`
            ml-0.5 inline-flex items-center rounded-sm p-0.5
            text-muted-foreground opacity-0 transition-opacity
            group-hover/crumb:opacity-100
            hover:text-foreground
            focus-visible:opacity-100
            data-[state=open]:opacity-100
          `)}
        >
          <ChevronsUpDown className="size-3" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder={t("Search…")} />
          <CommandList>
            <CommandEmpty>{isLoading ? t("Loading…") : t("No matches.")}</CommandEmpty>
            <CommandGroup>
              {options.map(option => (
                <CommandItem
                  key={option.value}
                  // Combine label + id so cmdk's value stays unique (bookmark titles can repeat) while
                  // still matching a search on the label. Navigation keys off the closure, not this.
                  value={`${option.label} ${option.value}`}
                  onSelect={() => {
                    setOpen(false);
                    void navigate({
                      to: option.href,
                    });
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  <Check
                    className={cn(
                      "ml-auto",
                      option.value === currentValue
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
