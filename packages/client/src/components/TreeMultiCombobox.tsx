import * as React from "react";

import { ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { renderTreeComboboxRows } from "./treeComboboxRow";
import { ancestorIdsForSelected, filterTreeByTerm, flattenOptions } from "./treeExpansion";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface TreeComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text (e.g. a romanized name) — matched by search and shown de-emphasized. */
  searchAlias?: string;
  icon?: React.ReactNode;
  children?: TreeComboboxOption[];
}

interface TreeMultiComboboxProps {
  "options": TreeComboboxOption[];
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
   * Optional action pinned to the bottom of the dropdown (e.g. "Create tag…"). Rendered outside
   * the filtered list so it stays visible regardless of the search query; selecting it closes the
   * popover and runs `onSelect`.
   */
  "createOption"?: {
    label: string;
    onSelect: () => void;
  };
}

/**
 * Searchable multi-select built from shadcn `Popover` + `Command`, with collapsible parent groups.
 * In tree mode (no search term) parent nodes show a chevron to expand/collapse their children. In
 * search mode the tree is pruned to matching nodes plus their ancestors (kept for context) and
 * rendered fully expanded, so indentation and parent/child relationships stay visible instead of
 * collapsing into a flat list.
 */
export function TreeMultiCombobox({
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
}: TreeMultiComboboxProps) {
  const {
    t,
  } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const selectedSet = new Set(values);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      const ancestors = ancestorIdsForSelected(options, selectedSet);
      if (ancestors.size > 0) {
        setExpandedIds(prev => new Set([...prev, ...ancestors]));
      }
    }
    setOpen(nextOpen);
  }
  const allNodes = React.useMemo(() => flattenOptions(options), [options]);
  const selectedOptions = allNodes.filter(node => selectedSet.has(node.value));

  const summary
    = selectedOptions.length === 0
      ? (placeholder ?? t("Select…"))
      : selectedOptions.length <= 2
        ? selectedOptions.map(o => o.label).join(", ")
        : t("{{count}} selected", {
          count: selectedOptions.length,
        });

  function toggle(value: string) {
    onValuesChange(
      selectedSet.has(value)
        ? values.filter(v => v !== value)
        : [...values, value],
    );
  }

  function toggleExpand(value: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  const isSearching = searchTerm.trim().length > 0;
  // While searching, the tree is already pruned to matches + their ancestors, so every remaining
  // branch renders expanded — the hierarchy (indentation, ancestor labels) stays visible instead
  // of collapsing into a flat list, and there's nothing left to manually expand/collapse.
  const visibleNodes = isSearching ? filterTreeByTerm(options, searchTerm) : options;

  const isEmpty = isSearching && visibleNodes.length === 0;

  return (
    <Popover
      open={open}
      onOpenChange={handleOpenChange}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          id={id}
          aria-expanded={open}
          aria-label={ariaLabel}
          data-slot="tree-multi-combobox"
          className={cn("w-full justify-between font-normal", className)}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2",
              selectedOptions.length === 0 && "text-muted-foreground",
            )}
          >
            <span className="truncate">{summary}</span>
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
            placeholder={searchPlaceholder ?? t("Search…")}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isEmpty
              ? <p className="py-6 text-center text-sm">{emptyText ?? t("No matches.")}</p>
              : (
                <CommandGroup>
                  {renderTreeComboboxRows(visibleNodes, {
                    isSearching,
                    isExpanded: value => expandedIds.has(value),
                    isSelected: value => selectedSet.has(value),
                    onSelect: toggle,
                    onToggleExpand: toggleExpand,
                  })}
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
