import type { TreeComboboxOption } from "./TreeMultiCombobox";
import type { PreferredLanguage } from "@eesimple/types";

import * as React from "react";

import { Check, ChevronRight } from "lucide-react";

import { LocalizedNameLabel } from "./LocalizedNameLabel";

import { Checkbox } from "@/components/ui/checkbox";
import { CommandItem } from "@/components/ui/command";
import i18n from "@/i18n";
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
  /**
   * The configured Secondary display language, forwarded to `LocalizedNameLabel` for nodes carrying
   * structured `names` so the secondary form matches the user's setting. `null`/omitted = auto.
   */
  secondaryLanguage?: PreferredLanguage | null;
  /**
   * The configured Fallback display language, forwarded to `LocalizedNameLabel` so the secondary
   * form falls back to the user's setting (default English) when no preferred/secondary match.
   */
  fallbackLanguage?: PreferredLanguage | null;
  /**
   * When true, a **parent** row (one with children) shows a "match child items" cascade checkbox
   * next to its selection check — the per-item cascade toggle used by the hierarchical condition
   * editors. Leaf rows never show it. The checkbox is only interactive once the row is selected
   * (cascade is meaningful only for a selected item). Requires {@link isCascade}/{@link onToggleCascade}.
   */
  showCascade?: boolean;
  /** Whether a parent row's cascade checkbox is checked (its subtree is matched). */
  isCascade?: (value: string) => boolean;
  /** Toggle a parent row's cascade flag. */
  onToggleCascade?: (value: string) => void;
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
          <span className="flex-1 wrap-break-word">
            {node.names && node.names.length > 0
              ? (
                <LocalizedNameLabel
                  names={node.names}
                  base={node.label}
                  secondaryLanguage={config.secondaryLanguage}
                  fallbackLanguage={config.fallbackLanguage}
                />
              )
              : (
                <>
                  {node.label}
                  {node.searchAlias
                    ? <span className="ml-1.5 text-muted-foreground">{node.searchAlias}</span>
                    : null}
                </>
              )}
          </span>
          <Check
            className={cn(
              "ml-auto size-4 shrink-0",
              isSelected ? "opacity-100" : "opacity-0",
            )}
          />
          {config.showCascade && hasChildren
            ? (
              <label
                className={cn(
                  `
                    flex shrink-0 items-center gap-1 pl-1 text-xs
                    text-muted-foreground
                  `,
                  isSelected
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-40",
                )}
                title={i18n.t("Also match child items (uncheck for an exact match)")}
                onClick={e => e.stopPropagation()}
              >
                <Checkbox
                  checked={config.isCascade?.(node.value) ?? false}
                  disabled={!isSelected}
                  onCheckedChange={() => config.onToggleCascade?.(node.value)}
                  aria-label={i18n.t("Also match child items")}
                  className="size-3.5"
                />
                {i18n.t("+ children")}
              </label>
            )
            : null}
        </CommandItem>
        {hasChildren && isExpanded && renderTreeComboboxRows(node.children ?? [], config, depth + 1)}
      </React.Fragment>
    );
  });
}
