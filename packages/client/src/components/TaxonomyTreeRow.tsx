import type { ReactNode } from "react";

import { ChevronDown, ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { COLUMN_CLASS } from "@/lib/bookmarkColumns";
import { CategoryIcon } from "@/lib/icons";
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
}

/** Grid wrapper for a collapsible taxonomy tree. Each root node gets its own RowCard. */
export function TaxonomyTreeList({
  tree, expanded, onToggle, columns, renderNameLink, renderEditLink, renderInfoLink, renderIcon,
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
            expanded={expanded}
            onToggle={onToggle}
            renderNameLink={renderNameLink}
            renderEditLink={renderEditLink}
            renderInfoLink={renderInfoLink}
            renderIcon={renderIcon}
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
}

/** Standard hover-revealed ghost button for the edit / info controls in a tree row. */
function HoverGhostButton({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="
        opacity-0 transition-opacity
        group-hover:opacity-100
        focus-visible:opacity-100
      "
    >
      {children}
    </Button>
  );
}

function TaxonomyTreeRow({
  node, depth, expanded, onToggle, renderNameLink, renderEditLink, renderInfoLink, renderIcon,
}: TaxonomyTreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  // Zero-count nodes are de-emphasized (still clickable); each row mutes independently.
  const muted = node.bookmarkCount === 0;

  const rowInner = (
    <>
      {renderIcon
        ? renderIcon(node)
        : (
          <CategoryIcon
            name={node.icon ?? null}
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      {hasChildren
        ? (
          <button
            type="button"
            aria-label={isOpen ? `Collapse ${node.name}` : `Expand ${node.name}`}
            aria-expanded={isOpen}
            onClick={() => onToggle(node.id)}
            className="
              flex size-4 items-center justify-center text-muted-foreground
              hover:text-foreground
            "
          >
            {isOpen
              ? <ChevronDown className="size-4" />
              : <ChevronRight className="size-4" />}
          </button>
        )
        : (
          <span
            className="inline-block size-4"
            aria-hidden="true"
          />
        )}

      {renderNameLink(node)}

      {node.builtIn ? <Badge variant="outline">Built-in</Badge> : null}

      <HoverGhostButton>{renderEditLink(node)}</HoverGhostButton>
      <HoverGhostButton>{renderInfoLink(node)}</HoverGhostButton>

      {node.bookmarkCount != null
        ? <Badge variant="secondary">{node.bookmarkCount}</Badge>
        : null}
    </>
  );

  const noChildRow = (indentDepth: number) =>
    (node.ownBookmarkCount ?? 0) > 0
      ? (
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
          <span className="flex-1 truncate">No Child</span>
          <Badge variant="outline">{node.ownBookmarkCount}</Badge>
        </li>
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
        {hasChildren && isOpen
          ? (
            <ul className="divide-y border-t">
              {noChildRow(1)}
              {node.children.map(child => (
                <TaxonomyTreeRow
                  key={child.id}
                  node={child}
                  depth={1}
                  expanded={expanded}
                  onToggle={onToggle}
                  renderNameLink={renderNameLink}
                  renderEditLink={renderEditLink}
                  renderInfoLink={renderInfoLink}
                  renderIcon={renderIcon}
                />
              ))}
            </ul>
          )
          : null}
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
      {hasChildren && isOpen
        ? (
          <>
            {noChildRow(depth + 1)}
            {node.children.map(child => (
              <TaxonomyTreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                renderNameLink={renderNameLink}
                renderEditLink={renderEditLink}
                renderInfoLink={renderInfoLink}
                renderIcon={renderIcon}
              />
            ))}
          </>
        )
        : null}
    </>
  );
}
