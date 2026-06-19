import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/**
 * Hover-revealed Edit / See All button group with an always-visible bookmark count to its right.
 * Shared by every `CategoryPreviewCard` variant so the listing rows and the single view page match.
 */
function CategoryControls({
  category,
}: {
  category: Category;
}) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <div className="flex items-center gap-2">
      <div
        className="
          flex items-center gap-1 opacity-0 transition-opacity
          group-hover:opacity-100
          focus-within:opacity-100
        "
      >
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/categories/$categorySlug/edit/general"
            params={{
              categorySlug: category.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "category", category.id)}
          >
            Edit
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/categories/$categorySlug"
            params={{
              categorySlug: category.slug,
            }}
          >
            See All
          </Link>
        </Button>
      </div>
      <Badge variant="secondary">{category.bookmarkCount ?? 0}</Badge>
    </div>
  );
}

interface CategoryPreviewCardProps {
  category: Category;
  /**
   * `row` — a clickable listing row that links to the category's view page.
   * `full` — the standalone view page body (no self-link), with read-only detail.
   */
  variant?: "row" | "full";
}

/**
 * A category's preview: icon, name, description and built-in badge, plus a hover Edit / See All
 * group and an always-visible bookmark count. The single read-only view component for both the
 * listing (`row`) and the single category page (`full`), and reused by the right panel's View body.
 */
export function CategoryPreviewCard({
  category, variant = "full",
}: CategoryPreviewCardProps) {
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  if (variant === "row") {
    return (
      <li>
        <RowCard
          className="
            group relative transition-colors
            hover:bg-accent
          "
        >
          <Link
            to="/categories/$categorySlug/general"
            params={{
              categorySlug: category.slug,
            }}
            title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => viewClick(event, "category", category.id)}
            className="flex items-center gap-3 p-4 pr-44"
          >
            <CategoryIcon
              name={category.icon}
              className="size-5 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                {category.name}
                {category.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
              </p>
              {category.description
                ? <p className="truncate text-sm text-muted-foreground">{category.description}</p>
                : null}
            </div>
          </Link>
          <div className="absolute top-1/2 right-3 -translate-y-1/2">
            <CategoryControls category={category} />
          </div>
        </RowCard>
      </li>
    );
  }

  return (
    <div className="group space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <CategoryIcon
            name={category.icon}
            className="size-6 shrink-0"
          />
          <div className="min-w-0 space-y-1">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              {category.name}
              {category.builtIn ? <Badge variant="secondary">Built-in</Badge> : null}
            </h2>
            {category.description
              ? <p className="text-sm text-muted-foreground">{category.description}</p>
              : null}
          </div>
        </div>
        <CategoryControls category={category} />
      </div>

      <Separator />

      <LabeledSection title="Details">
        <CategoryGeneralFields category={category} />
      </LabeledSection>
    </div>
  );
}

export function CategoryGeneralFields({
  category,
}: {
  category: Category;
}) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">Slug</dt>
      <dd className="font-mono">{category.slug}</dd>
      <dt className="text-muted-foreground">Bookmarks</dt>
      <dd>{category.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">Added</dt>
      <dd>{new Date(category.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">Built-in</dt>
      <dd>{category.builtIn ? "Yes — name is fixed" : "No"}</dd>
      <dt className="text-muted-foreground">On homepage</dt>
      <dd>{category.isHomepage ? "Yes" : "No"}</dd>
    </dl>
  );
}
