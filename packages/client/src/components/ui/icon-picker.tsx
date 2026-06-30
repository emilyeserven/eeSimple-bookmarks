import * as React from "react";

import { ChevronsUpDown } from "lucide-react";

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
import { CategoryIcon, ICON_NAMES, PHOSPHOR_TRAVEL_ICON_NAMES } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Cap how many Lucide icons render at once so opening the popover stays snappy. */
const MAX_LUCIDE_RESULTS = 60;

interface IconPickerProps {
  "value": string | null | undefined;
  "onChange": (icon: string) => void;
  "className"?: string;
  "aria-label"?: string;
}

/**
 * A searchable icon picker built from shadcn `Popover` + `Command`. Shows two
 * sections: Lucide Icons (general purpose, capped at 60 per search) and Travel &
 * Map Icons (Phosphor, ~80 curated travel/international icons). Phosphor names are
 * stored with a `"ph:"` prefix; Lucide names are stored as-is.
 */
export function IconPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Icon",
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const lucideResults = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? ICON_NAMES.filter(name => name.toLowerCase().includes(needle))
      : ICON_NAMES;
    return matches.slice(0, MAX_LUCIDE_RESULTS);
  }, [query]);

  const travelResults = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PHOSPHOR_TRAVEL_ICON_NAMES;
    return PHOSPHOR_TRAVEL_ICON_NAMES.filter(name =>
      name.slice(3).toLowerCase().includes(needle));
  }, [query]);

  const displayName = value
    ? (value.startsWith("ph:") ? value.slice(3) : value)
    : null;

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
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2">
            <CategoryIcon
              name={value}
              className="size-4"
            />
            <span
              className={cn("truncate", !displayName && "text-muted-foreground")}
            >
              {displayName ?? "Pick an icon"}
            </span>
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search icons…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {lucideResults.length === 0 && travelResults.length === 0 && (
              <CommandEmpty>No matching icons.</CommandEmpty>
            )}
            {lucideResults.length > 0 && (
              <CommandGroup heading="Lucide Icons">
                <div className="grid grid-cols-6 gap-1 p-1">
                  {lucideResults.map(name => (
                    <CommandItem
                      key={name}
                      value={name}
                      title={name}
                      onSelect={() => {
                        onChange(name);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex aspect-square items-center justify-center p-0",
                        value === name && "bg-accent text-accent-foreground",
                      )}
                    >
                      <CategoryIcon
                        name={name}
                        className="size-4"
                      />
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}
            {travelResults.length > 0 && (
              <CommandGroup heading="Travel & Map Icons">
                <div className="grid grid-cols-6 gap-1 p-1">
                  {travelResults.map(name => (
                    <CommandItem
                      key={name}
                      value={name}
                      title={name.slice(3)}
                      onSelect={() => {
                        onChange(name);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex aspect-square items-center justify-center p-0",
                        value === name && "bg-accent text-accent-foreground",
                      )}
                    >
                      <CategoryIcon
                        name={name}
                        className="size-4"
                      />
                    </CommandItem>
                  ))}
                </div>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
