import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { withCategories } from "@/lib/bookmarkSearch";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const modifier = useSidebarOpenModifier();
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
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();
  if (variant === "row") {
    return (
      <li>
        <StandardListingCard
          icon={(
            <CategoryIcon
              name={category.icon}
              className="size-5 shrink-0"
            />
          )}
          title={category.name}
          titleAdornment={category.builtIn
            ? <Badge variant="secondary">Built-in</Badge>
            : undefined}
          subtitle={category.description ?? undefined}
          count={category.bookmarkCount ?? 0}
          renderPrimaryLink={(className, children) => (
            <Link
              to="/bookmarks"
              search={withCategories({}, [category.id])}
              title={`Show bookmarks in ${category.name}`}
              className={className}
            >
              {children}
            </Link>
          )}
          renderEdit={() => (
            <HoverIconButton>
              <Link
                to="/categories/$categorySlug/edit/general"
                params={{
                  categorySlug: category.slug,
                }}
                title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
                onClick={event => editClick(event, "category", category.id)}
              >
                <Pencil className="size-4" />
                <span className="sr-only">Edit {category.name}</span>
              </Link>
            </HoverIconButton>
          )}
          renderInfo={() => (
            <HoverIconButton>
              <Link
                to="/categories/$categorySlug/general"
                params={{
                  categorySlug: category.slug,
                }}
                title={entityLinkTitle(modifier)}
                onClick={event => viewClick(event, "category", category.id, category.slug)}
              >
                <Info className="size-4" />
                <span className="sr-only">View {category.name}</span>
              </Link>
            </HoverIconButton>
          )}
        />
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
