import type { TaxonomyTreeNode } from "./TaxonomyTreeRow";
import type { ReactNode } from "react";

import { ChevronDown, ChevronRight, ChevronsUpDown, MapPin } from "lucide-react";
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
  /** Whether this node is currently in the active map filter (highlights its filter button). */
  filtered: boolean;
}

/** The single-row content of a taxonomy tree row: icon, expander, name link, badges, hover actions. */
export function TaxonomyTreeRowInner({
  node, hasChildren, isOpen, onToggle, renderNameLink, renderEditLink, renderInfoLink, renderIcon,
  onExpandSubtree, onToggleFilter, filtered,
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
      {hasChildren
        ? (
          <button
            type="button"
            aria-label={isOpen
              ? t("Collapse {{name}}", {
                name: node.name,
              })
              : t("Expand {{name}}", {
                name: node.name,
              })}
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

      {node.builtIn ? <Badge variant="outline">{t("Built-in")}</Badge> : null}

      <HoverGhostButton>{renderEditLink(node)}</HoverGhostButton>
      <HoverGhostButton>{renderInfoLink(node)}</HoverGhostButton>

      {onExpandSubtree && hasChildren
        ? (
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
        )
        : null}

      {onToggleFilter
        ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={filtered
              ? t("Remove {{name}} from map filter", {
                name: node.name,
              })
              : t("Filter map to {{name}}", {
                name: node.name,
              })}
            aria-pressed={filtered}
            title={filtered ? t("Filtering map (click to clear)") : t("Filter on map")}
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
        )
        : null}

      {node.bookmarkCount != null
        ? <Badge variant="secondary">{node.bookmarkCount}</Badge>
        : null}
    </>
  );
}
