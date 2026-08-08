import type { EntityName } from "@eesimple/types";

import * as React from "react";

import { useTranslation } from "react-i18next";

import { LocalizedNameSummary } from "./LocalizedNameLabel";
import { MultiComboboxShell } from "./MultiComboboxShell";
import { renderTreeComboboxRows } from "./treeComboboxRow";
import { ancestorIdsForSelected, filterTreeByTerm, flattenOptions } from "./treeExpansion";

import { CommandGroup } from "@/components/ui/command";
import { useFallbackDisplayLanguageValue } from "@/hooks/fallbackDisplayLanguage";
import { useSecondaryDisplayLanguageValue } from "@/hooks/secondaryDisplayLanguage";
import { cn } from "@/lib/utils";

export interface TreeComboboxOption {
  value: string;
  label: string;
  /** Optional secondary text (e.g. a secondary/English name) — matched by search and shown de-emphasized. */
  searchAlias?: string;
  /**
   * Optional multilingual names for {@link label}, used to resolve a secondary display form shown
   * de-emphasized after it (via `LocalizedNameLabel`, honoring the Secondary display language). Use
   * this — rather than {@link searchAlias} — when the secondary text should reflect the configured
   * secondary language, not just be a flat searchable string.
   */
  names?: EntityName[];
  icon?: React.ReactNode;
  /** When true a filled star is shown after the label, marking a user-starred (favorite) option. */
  isFavorite?: boolean;
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
  /**
   * Per-item "match child items" cascade toggle (used by the hierarchical condition editors). When
   * `cascadeValues`/`onToggleCascade` are provided, each **selected parent** row shows a small
   * checkbox: checked = the item matches its whole subtree, unchecked = exact match. Leaf rows never
   * show it. Omitted → no cascade checkbox (the default for ordinary entity pickers).
   */
  "cascadeValues"?: string[];
  "onToggleCascade"?: (value: string) => void;
}

/**
 * Searchable multi-select built from shadcn `Popover` + `Command`, with collapsible parent groups.
 * In tree mode (no search term) parent nodes show a chevron to expand/collapse their children. In
 * search mode the tree is pruned to matching nodes plus their ancestors (kept for context) and
 * rendered fully expanded, so indentation and parent/child relationships stay visible instead of
 * collapsing into a flat list. Like {@link MultiCombobox}, the trigger lists every selected label.
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
  cascadeValues,
  onToggleCascade,
}: TreeMultiComboboxProps) {
  const {
    t,
  } = useTranslation();
  const secondaryLanguage = useSecondaryDisplayLanguageValue();
  const fallbackLanguage = useFallbackDisplayLanguageValue();
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());

  const selectedSet = new Set(values);
  const cascadeSet = new Set(cascadeValues ?? []);

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

  // Every selected option is listed, however many there are — the trigger grows taller rather than
  // collapsing to a count, so what is selected is never hidden behind a summary.
  const summary
    = selectedOptions.length === 0
      ? (placeholder ?? t("Select…"))
      : (
        <LocalizedNameSummary
          options={selectedOptions}
          secondaryLanguage={secondaryLanguage}
          fallbackLanguage={fallbackLanguage}
        />
      );

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
    <MultiComboboxShell
      open={open}
      onOpenChange={handleOpenChange}
      dataSlot="tree-multi-combobox"
      triggerClassName={cn(`
        h-auto min-h-9 w-full justify-between py-1.5 font-normal
        whitespace-normal
      `, className)}
      labelWrapperClassName="min-w-0 text-left wrap-break-word"
      chevronClassName="ml-2 shrink-0 opacity-50"
      id={id}
      aria-label={ariaLabel}
      isEmpty={selectedOptions.length === 0}
      triggerLabel={summary}
      onClear={() => onValuesChange([])}
      shouldFilter={false}
      searchPlaceholder={searchPlaceholder}
      searchValue={searchTerm}
      onSearchValueChange={setSearchTerm}
      createOption={createOption}
    >
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
              secondaryLanguage,
              fallbackLanguage,
              showCascade: onToggleCascade != null,
              isCascade: value => cascadeSet.has(value),
              onToggleCascade,
            })}
          </CommandGroup>
        )}
    </MultiComboboxShell>
  );
}
