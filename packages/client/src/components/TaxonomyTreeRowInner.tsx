import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { ReactNode } from "react";

import { ChevronDown, ChevronRight, ChevronsUpDown, Eye, EyeOff, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/lib/icons";
import { cn } from "@/lib/utils";

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

/** Expand/collapse chevron button when the node has children, else an inline spacer. */
function TaxonomyTreeRowExpander({
  node, hasChildren, isOpen, onToggle,
}: {
  node: TaxonomyTreeNode;
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!hasChildren) {
    return (
      <span
        className="inline-block size-4"
        aria-hidden="true"
      />
    );
  }
  const label = isOpen
    ? t("Collapse {{name}}", {
      name: node.name,
    })
    : t("Expand {{name}}", {
      name: node.name,
    });
  return (
    <button
      type="button"
      aria-label={label}
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
  );
}

/** "Expand all under this node" hover button, shown only when a handler and children exist. */
function TaxonomyTreeRowExpandAllButton({
  node, hasChildren, onExpandSubtree,
}: {
  node: TaxonomyTreeNode;
  hasChildren: boolean;
  onExpandSubtree?: (node: TaxonomyTreeNode) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!onExpandSubtree || !hasChildren) return null;
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={t("Expand all under {{name}}", {
        name: node.name,
      })}
      title={t("Expand all")}
      onClick={() => onExpandSubtree(node)}
      className="
        opacity-0 transition-opacity
        group-hover:opacity-100
        focus-visible:opacity-100
      "
    >
      <ChevronsUpDown className="size-4" />
    </Button>
  );
}

/** Map-filter toggle button, shown only when a handler is provided. */
function TaxonomyTreeRowFilterButton({
  node, filtered, onToggleFilter,
}: {
  node: TaxonomyTreeNode;
  filtered: boolean;
  onToggleFilter?: (node: TaxonomyTreeNode) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!onToggleFilter) return null;
  const label = filtered
    ? t("Remove {{name}} from map focus", {
      name: node.name,
    })
    : t("Focus map on {{name}}", {
      name: node.name,
    });
  const title = filtered ? t("Focusing map (click to clear)") : t("Focus on map");
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-pressed={filtered}
      title={title}
      onClick={() => onToggleFilter(node)}
      className={cn(
        "transition-opacity",
        filtered
          ? "text-primary opacity-100"
          : `
            opacity-0
            group-hover:opacity-100
            focus-visible:opacity-100
          `,
      )}
    >
      <MapPin className="size-4" />
    </Button>
  );
}

/**
 * Map-visibility (eye) toggle: show/hide this node's shape on the map entirely. Session-only (resets on
 * reload), seeded from the location's "Hide on Main Map" setting. Shown only when a handler is provided.
 * When hidden the button is always visible (so the location can be un-hidden); when visible it is
 * hover-revealed like the other row actions.
 */
function TaxonomyTreeRowVisibilityButton({
  node, hidden, onToggleVisibility,
}: {
  node: TaxonomyTreeNode;
  hidden: boolean;
  onToggleVisibility?: (node: TaxonomyTreeNode) => void;
}) {
  const {
    t,
  } = useTranslation();
  if (!onToggleVisibility) return null;
  const label = hidden
    ? t("Show {{name}} on map", {
      name: node.name,
    })
    : t("Hide {{name}} on map", {
      name: node.name,
    });
  const title = hidden ? t("Hidden on map (click to show)") : t("Hide on map");
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={label}
      aria-pressed={hidden}
      title={title}
      onClick={() => onToggleVisibility(node)}
      className={cn(
        "transition-opacity",
        hidden
          ? "text-muted-foreground opacity-100"
          : `
            opacity-0
            group-hover:opacity-100
            focus-visible:opacity-100
          `,
      )}
    >
      {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </Button>
  );
}

interface TaxonomyTreeRowInnerProps {
  node: TaxonomyTreeNode;
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  renderNameLink: (node: TaxonomyTreeNode) => ReactNode;
  renderEditLink: (node: TaxonomyTreeNode) => ReactNode;
  renderInfoLink: (node: TaxonomyTreeNode) => ReactNode;
  renderIcon?: (node: TaxonomyTreeNode) => ReactNode;
  onExpandSubtree?: (node: TaxonomyTreeNode) => void;
  onToggleFilter?: (node: TaxonomyTreeNode) => void;
  /** Whether this node is currently the map-focus target (highlights its focus button). */
  filtered: boolean;
  onToggleVisibility?: (node: TaxonomyTreeNode) => void;
  /** Whether this node is currently hidden from the map (drives the eye icon + row de-emphasis). */
  hidden: boolean;
}

/** The single-row content of a taxonomy tree row: icon, expander, name link, badges, hover actions. */
export function TaxonomyTreeRowInner({
  node, hasChildren, isOpen, onToggle, renderNameLink, renderEditLink, renderInfoLink, renderIcon,
  onExpandSubtree, onToggleFilter, filtered, onToggleVisibility, hidden,
}: TaxonomyTreeRowInnerProps) {
  const {
    t,
  } = useTranslation();
  return (
    <>
      {renderIcon
        ? renderIcon(node)
        : (
          <CategoryIcon
            name={node.icon ?? null}
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      <TaxonomyTreeRowExpander
        node={node}
        hasChildren={hasChildren}
        isOpen={isOpen}
        onToggle={onToggle}
      />

      {renderNameLink(node)}

      {node.builtIn ? <Badge variant="outline">{t("Built-in")}</Badge> : null}

      <HoverGhostButton>{renderEditLink(node)}</HoverGhostButton>
      <HoverGhostButton>{renderInfoLink(node)}</HoverGhostButton>

      <TaxonomyTreeRowExpandAllButton
        node={node}
        hasChildren={hasChildren}
        onExpandSubtree={onExpandSubtree}
      />

      <TaxonomyTreeRowFilterButton
        node={node}
        filtered={filtered}
        onToggleFilter={onToggleFilter}
      />

      <TaxonomyTreeRowVisibilityButton
        node={node}
        hidden={hidden}
        onToggleVisibility={onToggleVisibility}
      />

      {node.bookmarkCount != null
        ? <Badge variant="secondary">{node.bookmarkCount}</Badge>
        : null}
    </>
  );
}
