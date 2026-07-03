import type { TreeComboboxOption } from "./TreeMultiCombobox";

import * as React from "react";

import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { renderTreeComboboxRows } from "./treeComboboxRow";
import { ancestorIdsForSelected, filterTreeByTerm, flattenOptions } from "./treeExpansion";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface TreeComboboxProps {
  "options": TreeComboboxOption[];
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
   * Optional non-tree row pinned above the tree that survives search (e.g. autofill's
   * "— Leave unchanged —"). Selecting it sets `value` to its `value`; it is never filtered out.
   */
  "leadingOption"?: {
    value: string;
    label: string;
  };
  /**
   * Optional action pinned to the bottom of the dropdown (e.g. "Create media type…"). Rendered
   * outside the filtered list so it stays visible regardless of the search query; selecting it
   * closes the popover and runs `onSelect`.
   */
  "createOption"?: {
    label: string;
    onSelect: () => void;
  };
}

/**
 * Searchable single-select built from shadcn `Popover` + `Command`, with collapsible parent groups —
 * the single-select sibling of `TreeMultiCombobox`. Selecting the active option again clears it
 * (shadcn-style `value` / `onValueChange`). In tree mode parent nodes show a chevron to
 * expand/collapse; in search mode the tree is pruned to matching nodes plus their ancestors and
 * rendered fully expanded, so the hierarchy stays visible instead of collapsing into a flat list.
 */
export function TreeCombobox({
  options,
  value,
  onValueChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  className,
  id,
  "aria-label": ariaLabel,
  leadingOption,
  createOption,
}: TreeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const allNodes = React.useMemo(() => flattenOptions(options), [options]);
  const selectedNode = value === undefined ? undefined : allNodes.find(node => node.value === value);
  const isLeadingSelected = leadingOption !== undefined && value === leadingOption.value;

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen && value !== undefined) {
      const ancestors = ancestorIdsForSelected(options, new Set([value]));
      if (ancestors.size > 0) {
        setExpandedIds(prev => new Set([...prev, ...ancestors]));
      }
    }
    setOpen(nextOpen);
  }

  function select(nodeValue: string) {
    onValueChange(nodeValue === value ? undefined : nodeValue);
    setOpen(false);
  }

  function toggleExpand(nodeValue: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeValue)) next.delete(nodeValue);
      else next.add(nodeValue);
      return next;
    });
  }

  const isSearching = searchTerm.trim().length > 0;
  // While searching the tree is pruned to matches + their ancestors and rendered fully expanded, so
  // the hierarchy stays visible (see `filterTreeByTerm`); nothing is left to manually expand.
  const visibleNodes = isSearching ? filterTreeByTerm(options, searchTerm) : options;
  const isEmpty = isSearching && visibleNodes.length === 0;

  const triggerLabel = isLeadingSelected
    ? leadingOption.label
    : (selectedNode?.label ?? placeholder);

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
          data-slot="tree-combobox"
          className={cn("w-full justify-between font-normal", className)}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2",
              selectedNode === undefined && !isLeadingSelected && `
                text-muted-foreground
              `,
            )}
          >
            {selectedNode?.icon}
            <span className="truncate">{triggerLabel}</span>
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
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {leadingOption
              ? (
                <CommandItem
                  value={leadingOption.value}
                  onSelect={() => select(leadingOption.value)}
                  className="flex items-center gap-1.5 px-2"
                >
                  <span className="size-4 shrink-0" />
                  <span className="flex-1 truncate">{leadingOption.label}</span>
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      isLeadingSelected ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              )
              : null}
            {isEmpty
              ? <p className="py-6 text-center text-sm">{emptyText}</p>
              : (
                <CommandGroup>
                  {renderTreeComboboxRows(visibleNodes, {
                    isSearching,
                    isExpanded: nodeValue => expandedIds.has(nodeValue),
                    isSelected: nodeValue => nodeValue === value,
                    onSelect: select,
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
