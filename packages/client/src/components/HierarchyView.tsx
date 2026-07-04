import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

/** Minimal shape of a node in an ancestor chain rendered by {@link HierarchyView}. */
export interface HierarchyAncestor {
  id: string;
  slug: string;
  name: string;
  /** Optional romanized form, shown de-emphasized after the name (e.g. for tags). */
  romanizedName?: string | null;
}

interface HierarchyViewProps {
  /** Strict ancestors from root → parent (the node itself excluded). Empty for a root node. */
  ancestors: HierarchyAncestor[];
  /** Render the link for one ancestor crumb (the typed route differs per entity). */
  renderAncestorLink: (ancestor: HierarchyAncestor) => ReactNode;
  /** Whether the node has children to list (drives the empty-state message). */
  hasChildren: boolean;
  /** Message shown under "Children" when the node has none, e.g. "No child tags.". */
  childrenEmptyLabel: string;
  /** The tree list element rendered under "Children" when {@link hasChildren} is true. */
  childrenList: ReactNode;
}

/**
 * The shared body of a taxonomy "Hierarchy" view tab: a "Parents" ancestor chain and a "Children"
 * subtree. Used by the Tags and Media Types hierarchy tabs, which differ only in the ancestor link's
 * route and the tree-list component they render for children.
 */
export function HierarchyView({
  ancestors,
  renderAncestorLink,
  hasChildren,
  childrenEmptyLabel,
  childrenList,
}: HierarchyViewProps) {
  const {
    t,
  } = useTranslation();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-medium">{t("Parents")}</p>
        {ancestors.length === 0
          ? (
            <p className="text-sm text-muted-foreground">{t("(root — no parent)")}</p>
          )
          : (
            <ol className="flex flex-wrap items-center gap-1 text-sm">
              {ancestors.map((ancestor, i) => (
                <li
                  key={ancestor.id}
                  className="flex items-center gap-1"
                >
                  {i > 0 && <span className="text-muted-foreground">→</span>}
                  {renderAncestorLink(ancestor)}
                </li>
              ))}
            </ol>
          )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{t("Children")}</p>
        {hasChildren
          ? childrenList
          : (
            <p className="text-sm text-muted-foreground">{childrenEmptyLabel}</p>
          )}
      </div>
    </div>
  );
}
