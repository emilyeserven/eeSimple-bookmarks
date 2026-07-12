import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { TaxonomyTreeRowInner } from "./TaxonomyTreeRowInner";

import { Badge } from "@/components/ui/badge";
import { RowCard } from "@/components/ui/card";
import { COLUMN_CLASS } from "@/lib/bookmarkColumns";
import { cn } from "@/lib/utils";

export interface TaxonomyTreeNode {
  id: string;
  name: string;
  slug: string;
  children: TaxonomyTreeNode[];
  /** Optional Lucide icon name; falls back to the default tag glyph (e.g. flat Tags carry none). */
  icon?: string | null;
  /** When true, the row shows a "Built-in" badge (e.g. seeded media types). */
  builtIn?: boolean;
  bookmarkCount?: number | null;
  ownBookmarkCount?: number | null;
}

interface TaxonomyTreeListProps {
  tree: TaxonomyTreeNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  columns: number;
  /** Caller builds the name Link — the standard card-body link to the filtered `/bookmarks` list. */
  renderNameLink: (node: TaxonomyTreeNode) => ReactNode;
  /** Caller builds the edit Link element (placed inside a hover-revealed ghost Button). */
  renderEditLink: (node: TaxonomyTreeNode) => ReactNode;
  /** Caller builds the info Link element (to the entity's detail page; hover-revealed ghost Button). */
  renderInfoLink: (node: TaxonomyTreeNode) => ReactNode;
  /** Optional icon override; replaces the default `CategoryIcon` when provided. */
  renderIcon?: (node: TaxonomyTreeNode) => ReactNode;
  /**
   * When set, rows with children show a per-row "Expand all" button that expands that node's whole
   * subtree (without collapsing other open branches). Opt-in — omitted on listings that don't want it.
   */
  onExpandSubtree?: (node: TaxonomyTreeNode) => void;
  /**
   * When set, every row shows a "Focus on Map" toggle button calling this with the node. Pair with
   * {@link isFiltered} to show the active state. Opt-in.
   */
  onToggleFilter?: (node: TaxonomyTreeNode) => void;
  /** Whether a node is currently the map-focus target (highlights its focus button). */
  isFiltered?: (node: TaxonomyTreeNode) => boolean;
  /**
   * When set, every row shows an eye toggle calling this with the node — shows/hides the node's shape on
   * the map entirely. Pair with {@link isHidden}. Opt-in, independent of {@link onToggleFilter}.
   */
  onToggleVisibility?: (node: TaxonomyTreeNode) => void;
  /** Whether a node is currently hidden from the map (drives the eye icon + row de-emphasis). */
  isHidden?: (node: TaxonomyTreeNode) => boolean;
}

/** Grid wrapper for a collapsible taxonomy tree. Each root node gets its own RowCard. */
export function TaxonomyTreeList({
  tree, columns, ...rowProps
}: TaxonomyTreeListProps) {
  return (
    <div
      className={`
        grid gap-2
        ${COLUMN_CLASS[columns]}
      `}
    >
      {tree.map(node => (
        <RowCard
          key={node.id}
          className="overflow-hidden"
        >
          <TaxonomyTreeRow
            node={node}
            depth={0}
            {...rowProps}
          />
        </RowCard>
      ))}
    </div>
  );
}

interface TaxonomyTreeRowProps {
  node: TaxonomyTreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  renderNameLink: (node: TaxonomyTreeNode) => ReactNode;
  renderEditLink: (node: TaxonomyTreeNode) => ReactNode;
  renderInfoLink: (node: TaxonomyTreeNode) => ReactNode;
  renderIcon?: (node: TaxonomyTreeNode) => ReactNode;
  onExpandSubtree?: (node: TaxonomyTreeNode) => void;
  onToggleFilter?: (node: TaxonomyTreeNode) => void;
  isFiltered?: (node: TaxonomyTreeNode) => boolean;
  onToggleVisibility?: (node: TaxonomyTreeNode) => void;
  isHidden?: (node: TaxonomyTreeNode) => boolean;
}

/**
 * The italic "No Child" bucket row shown under an expanded node whose own (no-descendant) bookmark
 * count is non-zero.
 */
function NoChildRow({
  node, indentDepth,
}: {
  node: TaxonomyTreeNode;
  indentDepth: number;
}) {
  const {
    t,
  } = useTranslation();
  if ((node.ownBookmarkCount ?? 0) === 0) return null;
  return (
    <li
      className="
        flex items-center gap-2 px-3 py-2 text-muted-foreground/70 italic
      "
      style={{
        paddingLeft: `${0.75 + indentDepth * 1.25}rem`,
      }}
    >
      <span
        className="inline-block size-4"
        aria-hidden="true"
      />
      <span className="flex-1 truncate">{t("No Child")}</span>
      <Badge variant="outline">{node.ownBookmarkCount}</Badge>
    </li>
  );
}

function TaxonomyTreeRow(props: TaxonomyTreeRowProps) {
  const {
    node, depth, expanded, onToggle, isFiltered, isHidden,
  } = props;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const hidden = isHidden?.(node) ?? false;
  // Zero-count nodes, and nodes hidden from the map, are de-emphasized (still clickable); each row mutes independently.
  const muted = node.bookmarkCount === 0 || hidden;

  const rowInner = (
    <TaxonomyTreeRowInner
      {...props}
      hasChildren={hasChildren}
      isOpen={isOpen}
      onToggle={onToggle}
      filtered={isFiltered?.(node) ?? false}
      hidden={hidden}
    />
  );

  const childRows = hasChildren && isOpen
    ? (
      <>
        <NoChildRow
          node={node}
          indentDepth={depth + 1}
        />
        {node.children.map(child => (
          <TaxonomyTreeRow
            key={child.id}
            {...props}
            node={child}
            depth={depth + 1}
          />
        ))}
      </>
    )
    : null;

  if (depth === 0) {
    return (
      <>
        <div
          className={cn("group flex items-center gap-2 px-3 py-2", muted && `
            opacity-60
          `)}
        >
          {rowInner}
        </div>
        {childRows ? <ul className="divide-y border-t">{childRows}</ul> : null}
      </>
    );
  }

  return (
    <>
      <li
        className={cn("group flex items-center gap-2 px-3 py-2", muted && `
          opacity-60
        `)}
        style={{
          paddingLeft: `${0.75 + depth * 1.25}rem`,
        }}
      >
        {rowInner}
      </li>
      {childRows}
    </>
  );
}
