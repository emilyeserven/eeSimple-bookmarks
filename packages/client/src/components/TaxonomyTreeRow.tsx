import type { ReactNode } from "react";

import { ChevronDown, ChevronRight, Pencil } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { COLUMN_CLASS } from "@/lib/bookmarkColumns";

export interface TaxonomyTreeNode {
  id: string;
  name: string;
  slug: string;
  children: TaxonomyTreeNode[];
  bookmarkCount?: number | null;
  ownBookmarkCount?: number | null;
}

interface TaxonomyTreeListProps {
  tree: TaxonomyTreeNode[];
  expanded: Set<string>;
  onToggle: (id: string) => void;
  columns: number;
  /** Caller builds the name Link with the correct typed route (className already applied by caller). */
  renderNameLink: (node: TaxonomyTreeNode) => ReactNode;
  /** Caller builds the edit Link element (placed inside a hover-revealed ghost Button). */
  renderEditLink: (node: TaxonomyTreeNode) => ReactNode;
}

/** Grid wrapper for a collapsible taxonomy tree. Each root node gets its own RowCard. */
export function TaxonomyTreeList({
  tree, expanded, onToggle, columns, renderNameLink, renderEditLink,
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
}

function TaxonomyTreeRow({
  node, depth, expanded, onToggle, renderNameLink, renderEditLink,
}: TaxonomyTreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);

  const rowInner = (
    <>
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
        {renderEditLink(node)}
      </Button>

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
            flex items-center gap-2 px-3 py-2 text-muted-foreground/70
            italic
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
        <div className="group flex items-center gap-2 px-3 py-2">
          {rowInner}
        </div>
        {hasChildren && isOpen
          ? (
            <ul className="divide-y border-t">
              {node.children.map(child => (
                <TaxonomyTreeRow
                  key={child.id}
                  node={child}
                  depth={1}
                  expanded={expanded}
                  onToggle={onToggle}
                  renderNameLink={renderNameLink}
                  renderEditLink={renderEditLink}
                />
              ))}
              {noChildRow(1)}
            </ul>
          )
          : null}
      </>
    );
  }

  return (
    <>
      <li
        className="group flex items-center gap-2 px-3 py-2"
        style={{
          paddingLeft: `${0.75 + depth * 1.25}rem`,
        }}
      >
        {rowInner}
      </li>
      {hasChildren && isOpen
        ? (
          <>
            {node.children.map(child => (
              <TaxonomyTreeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                onToggle={onToggle}
                renderNameLink={renderNameLink}
                renderEditLink={renderEditLink}
              />
            ))}
            {noChildRow(depth + 1)}
          </>
        )
        : null}
    </>
  );
}
