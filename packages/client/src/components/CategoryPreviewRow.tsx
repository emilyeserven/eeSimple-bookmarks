import type { Category } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "@/lib/icons";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

interface CategoryPreviewRowProps {
  category: Category;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/**
 * The `row` variant of `CategoryPreviewCard`: a clickable listing row linking to the category's
 * view page, with hover Edit / Info icon buttons and an always-visible bookmark count.
 */
export function CategoryPreviewRow({
  category, selectable, selected, onSelectToggle, inSelectionMode,
}: CategoryPreviewRowProps) {
  const viewClick = useViewPanelClick();
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
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
          to="/categories/$categorySlug"
          params={{
            categorySlug: category.slug,
          }}
          title={`View ${category.name}`}
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
  );
}
