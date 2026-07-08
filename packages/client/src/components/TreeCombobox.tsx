import type { TreeComboboxOption } from "./TreeMultiCombobox";

import * as React from "react";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { LocalizedNameLabel } from "./LocalizedNameLabel";
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
import { useFallbackDisplayLanguageValue } from "@/hooks/fallbackDisplayLanguage";
import { useSecondaryDisplayLanguageValue } from "@/hooks/secondaryDisplayLanguage";
import { cn } from "@/lib/utils";

interface LeadingOption {
  value: string;
  label: string;
}

interface CreateOption {
  label: string;
  onSelect: () => void;
}

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
  "leadingOption"?: LeadingOption;
  /**
   * Optional action pinned to the bottom of the dropdown (e.g. "Create media type…"). Rendered
   * outside the filtered list so it stays visible regardless of the search query; selecting it
   * closes the popover and runs `onSelect`.
   */
  "createOption"?: CreateOption;
}

/** True when `value` points at the pinned leading (non-tree) option. */
function isLeadingSelected(leadingOption: LeadingOption | undefined, value: string | undefined): boolean {
  return leadingOption !== undefined && value === leadingOption.value;
}

interface TriggerContentProps {
  options: TreeComboboxOption[];
  value: string | undefined;
  leadingOption?: LeadingOption;
  placeholder?: string;
}

/** The trigger button's inner label + icon — resolves the selected node and its localized name. */
function TreeComboboxTriggerContent({
  options, value, leadingOption, placeholder,
}: TriggerContentProps) {
  const {
    t,
  } = useTranslation();
  const secondaryLanguage = useSecondaryDisplayLanguageValue();
  const fallbackLanguage = useFallbackDisplayLanguageValue();
  const allNodes = React.useMemo(() => flattenOptions(options), [options]);
  const selectedNode = value === undefined ? undefined : allNodes.find(node => node.value === value);
  const leadingSelected = isLeadingSelected(leadingOption, value);

  const triggerLabel = leadingOption && leadingSelected
    ? leadingOption.label
    : selectedNode
      ? (
        <LocalizedNameLabel
          names={selectedNode.names ?? []}
          base={selectedNode.label}
          secondaryLanguage={secondaryLanguage}
          fallbackLanguage={fallbackLanguage}
        />
      )
      : (placeholder ?? t("Select…"));

  return (
    <>
      <span
        className={cn(
          "flex min-w-0 items-center gap-2",
          selectedNode === undefined && !leadingSelected && `
            text-muted-foreground
          `,
        )}
      >
        {selectedNode?.icon}
        <span className="truncate">{triggerLabel}</span>
      </span>
      <ChevronsUpDown className="opacity-50" />
    </>
  );
}

interface DropdownProps {
  options: TreeComboboxOption[];
  value: string | undefined;
  searchPlaceholder?: string;
  emptyText?: string;
  leadingOption?: LeadingOption;
  createOption?: CreateOption;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  expandedIds: Set<string>;
  onSelect: (value: string) => void;
  onToggleExpand: (value: string) => void;
  onCreate: () => void;
}

/** The `<Command>` dropdown body — search input, optional leading row, the pruned tree, create footer. */
function TreeComboboxDropdown({
  options,
  value,
  searchPlaceholder,
  emptyText,
  leadingOption,
  createOption,
  searchTerm,
  onSearchTermChange,
  expandedIds,
  onSelect,
  onToggleExpand,
  onCreate,
}: DropdownProps) {
  const {
    t,
  } = useTranslation();
  const secondaryLanguage = useSecondaryDisplayLanguageValue();
  const fallbackLanguage = useFallbackDisplayLanguageValue();

  const isSearching = searchTerm.trim().length > 0;
  // While searching the tree is pruned to matches + their ancestors and rendered fully expanded, so
  // the hierarchy stays visible (see `filterTreeByTerm`); nothing is left to manually expand.
  const visibleNodes = isSearching ? filterTreeByTerm(options, searchTerm) : options;
  const isEmpty = isSearching && visibleNodes.length === 0;
  const leadingSelected = isLeadingSelected(leadingOption, value);

  return (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={searchPlaceholder ?? t("Search…")}
        value={searchTerm}
        onValueChange={onSearchTermChange}
      />
      <CommandList>
        {leadingOption
          ? (
            <CommandItem
              value={leadingOption.value}
              onSelect={() => onSelect(leadingOption.value)}
              className="flex items-center gap-1.5 px-2"
            >
              <span className="size-4 shrink-0" />
              <span className="flex-1 truncate">{leadingOption.label}</span>
              <Check
                className={cn(
                  "ml-auto size-4 shrink-0",
                  leadingSelected ? "opacity-100" : "opacity-0",
                )}
              />
            </CommandItem>
          )
          : null}
        {isEmpty
          ? <p className="py-6 text-center text-sm">{emptyText ?? t("No matches.")}</p>
          : (
            <CommandGroup>
              {renderTreeComboboxRows(visibleNodes, {
                isSearching,
                isExpanded: nodeValue => expandedIds.has(nodeValue),
                isSelected: nodeValue => nodeValue === value,
                onSelect,
                onToggleExpand,
                secondaryLanguage,
                fallbackLanguage,
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
              onClick={onCreate}
            >
              <Plus className="size-4 shrink-0" />
              {createOption.label}
            </button>
          </>
        )
        : null}
    </Command>
  );
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
  placeholder,
  searchPlaceholder,
  emptyText,
  className,
  id,
  "aria-label": ariaLabel,
  leadingOption,
  createOption,
}: TreeComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

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

  function handleCreate() {
    setOpen(false);
    createOption?.onSelect();
  }

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
          <TreeComboboxTriggerContent
            options={options}
            value={value}
            leadingOption={leadingOption}
            placeholder={placeholder}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
      >
        <TreeComboboxDropdown
          options={options}
          value={value}
          searchPlaceholder={searchPlaceholder}
          emptyText={emptyText}
          leadingOption={leadingOption}
          createOption={createOption}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          expandedIds={expandedIds}
          onSelect={select}
          onToggleExpand={toggleExpand}
          onCreate={handleCreate}
        />
      </PopoverContent>
    </Popover>
  );
}
