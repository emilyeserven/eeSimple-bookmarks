import type { ReactNode } from "react";

import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { useNewAutofillRule } from "@/hooks/useNewAutofillRule";

/** Minimal shape shared by tree taxonomy nodes (Tags, Genres & Moods) rendered in the stat grid. */
export interface TaxonomyNodeStatsNode {
  parentId: string | null;
  children: readonly unknown[];
  slug: string;
  createdAt: string;
  bookmarkCount?: number;
  ownBookmarkCount?: number;
}

/**
 * Shared "General view" stat grid + New Autofill Rule block for tree taxonomy workbench views
 * (Tags, Genres & Moods). The parent cell is rendered plain by default; pass `renderParent` to
 * customize it (e.g. Tags render a `RomanizedLabel`). The outer wrapper stays at the call site.
 */
export function TaxonomyNodeStats<TParent extends { name: string }>({
  node,
  parent,
  renderParent,
  autofillClassName,
}: {
  node: TaxonomyNodeStatsNode;
  parent: TParent | null | undefined;
  renderParent?: (parent: TParent) => ReactNode;
  autofillClassName?: string;
}) {
  const {
    t,
  } = useTranslation();
  const newRule = useNewAutofillRule();
  return (
    <>
      <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-muted-foreground">{t("Parent")}</dt>
        <dd>{parent
          ? (renderParent ? renderParent(parent) : parent.name)
          : t("(root)")}
        </dd>
        <dt className="text-muted-foreground">{t("Children")}</dt>
        <dd>{node.children.length}</dd>
        <dt className="text-muted-foreground">{t("Slug")}</dt>
        <dd className="font-mono">{node.slug}</dd>
        <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
        <dd>{node.bookmarkCount ?? 0}</dd>
        {node.children.length > 0 && (node.ownBookmarkCount ?? 0) > 0
          ? (
            <>
              <dt className="text-muted-foreground/70 italic">{t("No Child")}</dt>
              <dd className="text-muted-foreground/70 italic">{node.ownBookmarkCount}</dd>
            </>
          )
          : null}
        <dt className="text-muted-foreground">{t("Created")}</dt>
        <dd>{new Date(node.createdAt).toLocaleDateString()}</dd>
      </dl>
      <div className={autofillClassName}>
        <p className="mb-2 text-sm font-medium">{t("Autofill")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={newRule.onClick}
        >
          {t("New Autofill Rule")}
        </Button>
        {newRule.modal}
      </div>
    </>
  );
}
