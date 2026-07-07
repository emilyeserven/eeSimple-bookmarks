import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { CategoryPreviewRow } from "./CategoryPreviewRow";
import { LabeledSection } from "./LabeledSection";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CategoryIcon } from "@/lib/icons";

/**
 * Hover-revealed Edit / See All button group with an always-visible bookmark count to its right.
 * Shared by every `CategoryPreviewCard` variant so the listing rows and the single view page match.
 */
function CategoryControls({
  category,
}: {
  category: Category;
}) {
  const {
    t,
  } = useTranslation();
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
            to="/categories/$categorySlug/edit"
            params={{
              categorySlug: category.slug,
            }}
            title={t("Edit {{name}}", {
              name: category.name,
            })}
          >
            {t("Edit")}
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
            {t("See All")}
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
  /** Row-variant bulk-selection wiring (ignored by `full`). */
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/**
 * A category's preview: icon, name, description and built-in badge, plus a hover Edit / See All
 * group and an always-visible bookmark count. The single read-only view component for both the
 * listing (`row`) and the single category page (`full`), and reused by the right panel's View body.
 */
export function CategoryPreviewCard({
  category, variant = "full", selectable, selected, onSelectToggle, inSelectionMode,
}: CategoryPreviewCardProps) {
  const {
    t,
  } = useTranslation();
  if (variant === "row") {
    return (
      <CategoryPreviewRow
        category={category}
        selectable={selectable}
        selected={selected}
        onSelectToggle={onSelectToggle}
        inSelectionMode={inSelectionMode}
      />
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
              {category.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
            </h2>
            {category.description
              ? <p className="text-sm text-muted-foreground">{category.description}</p>
              : null}
          </div>
        </div>
        <CategoryControls category={category} />
      </div>

      <Separator />

      <LabeledSection title={t("Details")}>
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
  const {
    t,
  } = useTranslation();
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
      <dt className="text-muted-foreground">{t("Slug")}</dt>
      <dd className="font-mono">{category.slug}</dd>
      <dt className="text-muted-foreground">{t("Bookmarks")}</dt>
      <dd>{category.bookmarkCount ?? 0}</dd>
      <dt className="text-muted-foreground">{t("Added")}</dt>
      <dd>{new Date(category.createdAt).toLocaleDateString()}</dd>
      <dt className="text-muted-foreground">{t("Built-in")}</dt>
      <dd>{category.builtIn ? t("Yes — name is fixed") : t("No")}</dd>
      <dt className="text-muted-foreground">{t("On homepage")}</dt>
      <dd>{category.isHomepage ? t("Yes") : t("No")}</dd>
    </dl>
  );
}
