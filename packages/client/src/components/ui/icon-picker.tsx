import * as React from "react";

import { ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CategoryIcon, ICON_NAMES } from "@/lib/icons";
import { cn } from "@/lib/utils";

/** Cap how many icons render at once so opening the popover stays snappy. */
const MAX_RESULTS = 60;

interface IconPickerProps {
  "value": string | null | undefined;
  "onChange": (icon: string) => void;
  "className"?: string;
  "aria-label"?: string;
}

/**
 * A searchable Lucide icon picker built from shadcn `Popover` + `Command`. We filter
 * the (large) icon list ourselves and cap the rendered results for performance.
 */
export function IconPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Icon",
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const results = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = needle
      ? ICON_NAMES.filter(name => name.toLowerCase().includes(needle))
      : ICON_NAMES;
    return matches.slice(0, MAX_RESULTS);
  }, [query]);

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
            <span className={cn("truncate", !value && "text-muted-foreground")}>
              {value ?? "Pick an icon"}
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
            <CommandEmpty>No matching icons.</CommandEmpty>
            <div className="grid grid-cols-6 gap-1 p-1">
              {results.map(name => (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
