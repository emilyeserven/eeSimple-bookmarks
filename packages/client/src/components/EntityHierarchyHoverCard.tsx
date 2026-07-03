import type { HierarchyAncestor } from "./HierarchyView";
import type { ReactNode } from "react";

import { cloneElement, isValidElement } from "react";

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface EntityHierarchyHoverCardProps {
  /** The already-computed root→node ancestor path, or `null`/single-element when there's nothing to show. */
  path: HierarchyAncestor[] | null;
  /** Render one ancestor crumb's link (the route differs per entity); never called for the last (current) node. */
  renderLink: (ancestor: HierarchyAncestor) => ReactNode;
  children: ReactNode;
}

/**
 * Wraps a taxonomy pill/link so hovering it shows the entity's ancestor chain (e.g.
 * "Root → Parent → Name") in a popover. Renders `children` unwrapped when there's no ancestor path —
 * a top-level entity has nothing to show. When a popover IS shown, strips a native `title` off the
 * trigger (it would otherwise fire a colliding native browser tooltip); left untouched when there's no
 * popover, so the native tooltip still works normally in that case.
 */
export function EntityHierarchyHoverCard({
  path, renderLink, children,
}: EntityHierarchyHoverCardProps) {
  if (!path || path.length <= 1) return children;

  const trigger = isValidElement<{ title?: string }>(children)
    ? cloneElement(children, {
      title: undefined,
    })
    : children;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>{trigger}</HoverCardTrigger>
      <HoverCardContent className="w-auto max-w-xs p-2 text-sm">
        <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
          {path.map((node, index) => (
            <li
              key={node.id}
              className="flex items-center gap-1"
            >
              {index > 0
                ? <span aria-hidden="true">→</span>
                : null}
              {index === path.length - 1
                ? <span className="font-medium text-foreground">{node.name}</span>
                : renderLink(node)}
            </li>
          ))}
        </ol>
      </HoverCardContent>
    </HoverCard>
  );
}
