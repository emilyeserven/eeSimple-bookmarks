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
  PHOSPHOR_CATEGORY_NAMES,
  PHOSPHOR_ICON_NAMES,
  PHOSPHOR_ICONS_BY_CATEGORY,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface IconPickerProps {
  "value": string | null | undefined;
  "onChange": (icon: string) => void;
  "className"?: string;
  "aria-label"?: string;
}

/** A category tab. `id` is unique across both libraries (Lucide and Phosphor share
 * some labels, e.g. "Food & Drink"); `label` is the human-visible name. */
interface CategoryTab {
  id: string;
  label: string;
  source: "lucide" | "phosphor";
}

const ALL_TAB_ID = "all";

const LUCIDE_TABS: CategoryTab[] = LUCIDE_CATEGORY_NAMES.map(label => ({
  id: `lucide:${label}`,
  label,
  source: "lucide",
}));

const PHOSPHOR_TABS: CategoryTab[] = PHOSPHOR_CATEGORY_NAMES.map(label => ({
  id: `ph:${label}`,
  label,
  source: "phosphor",
}));

/**
 * A searchable icon picker built from shadcn `Popover` + `Command`. Shows icons
 * in named category tabs (Arrows, Files & Docs, etc.) or a flat search across all
 * icons. Lucide and Phosphor each contribute their own category tabs; Phosphor
 * names are stored with a `"ph:"` prefix, Lucide names are stored as-is.
 */
export function IconPicker({
  value,
  onChange,
  className,
  "aria-label": ariaLabel = "Icon",
}: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedTabId, setSelectedTabId] = React.useState<string>(ALL_TAB_ID);

  const isSearching = query.trim().length > 0;

  const lucideSearchResults = React.useMemo(() => {
    if (!isSearching) return null;
    const needle = query.trim().toLowerCase();
    return ICON_NAMES.filter(n => n.toLowerCase().includes(needle));
  }, [query, isSearching]);

  const phosphorSearchResults = React.useMemo(() => {
    if (!isSearching) return PHOSPHOR_ICON_NAMES;
    const needle = query.trim().toLowerCase();
    return PHOSPHOR_ICON_NAMES.filter(name => name.slice(3).toLowerCase().includes(needle));
  }, [query, isSearching]);

  const selectedTab = React.useMemo(
    () => [...LUCIDE_TABS, ...PHOSPHOR_TABS].find(t => t.id === selectedTabId) ?? null,
    [selectedTabId],
  );

  const categoryIcons = React.useMemo(() => {
    if (isSearching || selectedTabId === ALL_TAB_ID || !selectedTab) return null;
    return selectedTab.source === "phosphor"
      ? PHOSPHOR_ICONS_BY_CATEGORY[selectedTab.label] ?? []
      : LUCIDE_ICONS_BY_CATEGORY[selectedTab.label] ?? [];
  }, [isSearching, selectedTabId, selectedTab]);

  const displayName = value
    ? (value.startsWith("ph:") ? value.slice(3) : value)
    : null;

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

  function renderTabButton(tab: CategoryTab | { id: string;
    label: string; }) {
    return (
      <button
        key={tab.id}
        type="button"
        onClick={() => {
          setSelectedTabId(tab.id);
          setQuery("");
        }}
        disabled={isSearching}
        className={cn(
          `
            shrink-0 rounded-sm px-2 py-0.5 text-xs whitespace-nowrap
            transition-colors
          `,
          selectedTabId === tab.id && !isSearching
            ? "bg-accent font-medium text-accent-foreground"
            : `
              text-muted-foreground
              hover:bg-accent hover:text-accent-foreground
            `,
          isSearching && "cursor-default opacity-40",
        )}
      >
        {tab.label}
      </button>
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
              if (v.trim()) setSelectedTabId(ALL_TAB_ID);
            }}
          />
          <div
            className="
              flex items-center gap-1 overflow-x-auto border-b px-2 py-1.5
            "
          >
            {renderTabButton({
              id: ALL_TAB_ID,
              label: "All",
            })}
            {LUCIDE_TABS.map(renderTabButton)}
            <span
              className="
                shrink-0 px-1 text-xs font-medium text-muted-foreground/70
              "
            >
              Phosphor
            </span>
            {PHOSPHOR_TABS.map(renderTabButton)}
          </div>
          <CommandList className="max-h-[400px]">
            {/* Search mode: flat results across all icons */}
            {isSearching && (
              <>
                {(lucideSearchResults ?? []).length === 0 && phosphorSearchResults.length === 0 && (
                  <CommandEmpty>No matching icons.</CommandEmpty>
                )}
                {(lucideSearchResults ?? []).length > 0 && (
                  <CommandGroup heading="Lucide Icons">
                    {renderIconGrid(lucideSearchResults ?? [])}
                  </CommandGroup>
                )}
                {phosphorSearchResults.length > 0 && (
                  <CommandGroup heading="Phosphor Icons">
                    {renderIconGrid(phosphorSearchResults, true)}
                  </CommandGroup>
                )}
              </>
            )}

            {/* Specific category tab (Lucide or Phosphor) */}
            {!isSearching && categoryIcons !== null && selectedTab && (
              <>
                {categoryIcons.length === 0 && (
                  <CommandEmpty>No icons in this category.</CommandEmpty>
                )}
                {categoryIcons.length > 0 && (
                  <CommandGroup heading={selectedTab.label}>
                    {renderIconGrid(categoryIcons, selectedTab.source === "phosphor")}
                  </CommandGroup>
                )}
              </>
            )}

            {/* All tab: every Lucide category as a group. Phosphor is reachable via
                its own tabs + search; omitted here to keep this list responsive. */}
            {!isSearching && selectedTabId === ALL_TAB_ID && (
              <>
                {LUCIDE_CATEGORY_NAMES.map(cat => (
                  <CommandGroup
                    key={cat}
                    heading={cat}
                  >
                    {renderIconGrid(LUCIDE_ICONS_BY_CATEGORY[cat] ?? [])}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
