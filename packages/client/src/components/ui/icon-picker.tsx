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
import {
  CategoryIcon,
  ICON_NAMES,
  LUCIDE_CATEGORY_NAMES,
  LUCIDE_ICONS_BY_CATEGORY,
  PHOSPHOR_TRAVEL_ICON_NAMES,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  "value": string | null | undefined;
  "onChange": (icon: string) => void;
  "className"?: string;
  "aria-label"?: string;
}

/**
 * A searchable icon picker built from shadcn `Popover` + `Command`. Shows icons
 * in named category tabs (Arrows, Files & Docs, etc.) or a flat search across all
 * icons. Phosphor names are stored with a `"ph:"` prefix; Lucide names are stored as-is.
 */
export function IconPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Icon",
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");

  const isSearching = query.trim().length > 0;

  const lucideSearchResults = React.useMemo(() => {
    if (!isSearching) return null;
    const needle = query.trim().toLowerCase();
    return ICON_NAMES.filter(n => n.toLowerCase().includes(needle));
  }, [query, isSearching]);

  const categoryIcons = React.useMemo(() => {
    if (isSearching || selectedCategory === "All" || selectedCategory === "Travel & Map") return null;
    return LUCIDE_ICONS_BY_CATEGORY[selectedCategory] ?? [];
  }, [isSearching, selectedCategory]);

  const travelResults = React.useMemo(() => {
    if (!isSearching) return PHOSPHOR_TRAVEL_ICON_NAMES;
    const needle = query.trim().toLowerCase();
    return PHOSPHOR_TRAVEL_ICON_NAMES.filter(name => name.slice(3).toLowerCase().includes(needle));
  }, [query, isSearching]);

  const displayName = value
    ? (value.startsWith("ph:") ? value.slice(3) : value)
    : null;

  const allCategoryTabs = ["All", ...LUCIDE_CATEGORY_NAMES, "Travel & Map"];

  function renderIconGrid(names: string[], isPhosphor = false) {
    return (
      <div className="grid grid-cols-6 gap-1 p-1">
        {names.map(name => (
          <CommandItem
            key={name}
            value={name}
            title={isPhosphor ? name.slice(3) : name}
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
    );
  }

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
            onValueChange={(v) => {
              setQuery(v);
              if (v.trim()) setSelectedCategory("All");
            }}
          />
          <div className="flex gap-1 overflow-x-auto border-b px-2 py-1.5">
            {allCategoryTabs.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat);
                  setQuery("");
                }}
                disabled={isSearching}
                className={cn(
                  `
                    shrink-0 rounded-sm px-2 py-0.5 text-xs whitespace-nowrap
                    transition-colors
                  `,
                  selectedCategory === cat && !isSearching
                    ? "bg-accent font-medium text-accent-foreground"
                    : `
                      text-muted-foreground
                      hover:bg-accent hover:text-accent-foreground
                    `,
                  isSearching && "cursor-default opacity-40",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <CommandList className="max-h-[400px]">
            {/* Search mode: flat results across all icons */}
            {isSearching && (
              <>
                {(lucideSearchResults ?? []).length === 0 && travelResults.length === 0 && (
                  <CommandEmpty>No matching icons.</CommandEmpty>
                )}
                {(lucideSearchResults ?? []).length > 0 && (
                  <CommandGroup heading="Lucide Icons">
                    {renderIconGrid(lucideSearchResults ?? [])}
                  </CommandGroup>
                )}
                {travelResults.length > 0 && (
                  <CommandGroup heading="Travel & Map Icons">
                    {renderIconGrid(travelResults, true)}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Specific Lucide category tab */}
            {!isSearching && categoryIcons !== null && (
              <>
                {categoryIcons.length === 0 && (
                  <CommandEmpty>No icons in this category.</CommandEmpty>
                )}
                {categoryIcons.length > 0 && (
                  <CommandGroup heading={selectedCategory}>
                    {renderIconGrid(categoryIcons)}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Travel & Map tab */}
            {!isSearching && selectedCategory === "Travel & Map" && (
              <CommandGroup heading="Travel & Map Icons">
                {renderIconGrid(PHOSPHOR_TRAVEL_ICON_NAMES, true)}
              </CommandGroup>
            )}

            {/* All tab: every category as a group */}
            {!isSearching && selectedCategory === "All" && (
              <>
                {LUCIDE_CATEGORY_NAMES.map(cat => (
                  <CommandGroup
                    key={cat}
                    heading={cat}
                  >
                    {renderIconGrid(LUCIDE_ICONS_BY_CATEGORY[cat] ?? [])}
                  </CommandGroup>
                ))}
                <CommandGroup heading="Travel & Map Icons">
                  {renderIconGrid(PHOSPHOR_TRAVEL_ICON_NAMES, true)}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
