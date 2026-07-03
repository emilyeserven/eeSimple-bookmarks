import * as React from "react";

import { Check, ChevronRight, ChevronsUpDown, Plus } from "lucide-react";

import { ancestorIdsForSelected, filterTreeByTerm } from "./treeExpansion";

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

function flattenOptions(nodes: TreeComboboxOption[]): TreeComboboxOption[] {
  return nodes.flatMap(node => [node, ...flattenOptions(node.children ?? [])]);
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
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No matches.",
  className,
  id,
  "aria-label": ariaLabel,
  createOption,
}: TreeMultiComboboxProps) {
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
      ? placeholder
      : selectedOptions.length <= 2
        ? selectedOptions.map(o => o.label).join(", ")
        : `${selectedOptions.length} selected`;

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

  function renderTreeItems(nodes: TreeComboboxOption[], depth = 0): React.ReactNode {
    return nodes.map((node) => {
      const hasChildren = (node.children?.length ?? 0) > 0;
      const isExpanded = isSearching || expandedIds.has(node.value);
      const isSelected = selectedSet.has(node.value);

      return (
        <React.Fragment key={node.value}>
          <CommandItem
            value={node.value}
            onSelect={() => toggle(node.value)}
            className="flex items-center gap-1.5 pr-2"
            style={{
              paddingLeft: `${0.5 + depth * 1}rem`,
            }}
          >
            {hasChildren
              ? (
                isSearching
                  ? (
                    <ChevronRight className="size-3 shrink-0 rotate-90" />
                  )
                  : (
                    <button
                      type="button"
                      className="
                        shrink-0 rounded-sm p-0.5
                        hover:bg-accent
                      "
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(node.value);
                      }}
                    >
                      <ChevronRight
                        className={cn(
                          "size-3 transition-transform",
                          isExpanded && "rotate-90",
                        )}
                      />
                    </button>
                  )
              )
              : <span className="size-4 shrink-0" />}
            {node.icon != null && <span className="shrink-0">{node.icon}</span>}
            <span className="flex-1 truncate">
              {node.label}
              {node.searchAlias
                ? <span className="ml-1.5 text-muted-foreground">{node.searchAlias}</span>
                : null}
            </span>
            <Check
              className={cn(
                "ml-auto size-4 shrink-0",
                isSelected ? "opacity-100" : "opacity-0",
              )}
            />
          </CommandItem>
          {hasChildren && isExpanded && renderTreeItems(node.children ?? [], depth + 1)}
        </React.Fragment>
      );
    });
  }

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
            placeholder={searchPlaceholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {isEmpty
              ? <p className="py-6 text-center text-sm">{emptyText}</p>
              : (
                <CommandGroup>
                  {renderTreeItems(visibleNodes)}
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
