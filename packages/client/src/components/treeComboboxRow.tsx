import type { TreeComboboxOption } from "./TreeMultiCombobox";

import * as React from "react";

import { Check, ChevronRight } from "lucide-react";

import { CommandItem } from "@/components/ui/command";
import { cn } from "@/lib/utils";

/**
 * Selection-model-agnostic wiring for one rendered tree of combobox rows. The single-select
 * (`TreeCombobox`) and multi-select (`TreeMultiCombobox`) components differ only in how `onSelect`
 * mutates state and how `isSelected` is computed, so they both drive this shared renderer instead
 * of each duplicating the chevron/icon/label/check markup.
 */
export interface TreeComboboxRowConfig {
  /** When searching, every branch renders expanded and the chevron is a static (non-toggle) glyph. */
  isSearching: boolean;
  isExpanded: (value: string) => boolean;
  isSelected: (value: string) => boolean;
  onSelect: (value: string) => void;
  onToggleExpand: (value: string) => void;
}

/**
 * Recursively render a tree of `CommandItem` rows: an expand chevron (button in tree mode, static
 * glyph while searching), optional icon, label + de-emphasized `searchAlias`, and a selection check.
 * A pure function (no hooks) shared by both tree comboboxes.
 */
export function renderTreeComboboxRows(
  nodes: TreeComboboxOption[],
  config: TreeComboboxRowConfig,
  depth = 0,
): React.ReactNode {
  return nodes.map((node) => {
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = config.isSearching || config.isExpanded(node.value);
    const isSelected = config.isSelected(node.value);

    return (
      <React.Fragment key={node.value}>
        <CommandItem
          value={node.value}
          onSelect={() => config.onSelect(node.value)}
          className="flex items-center gap-1.5 pr-2"
          style={{
            paddingLeft: `${0.5 + depth * 1}rem`,
          }}
        >
          {hasChildren
            ? (
              config.isSearching
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
                      config.onToggleExpand(node.value);
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
        {hasChildren && isExpanded && renderTreeComboboxRows(node.children ?? [], config, depth + 1)}
      </React.Fragment>
    );
  });
}
