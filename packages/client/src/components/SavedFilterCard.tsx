import type { SavedFilter } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, Info, ListFilter, Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useUpdateSavedFilter } from "../hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "../lib/bookmarkSearch";
import { notifySuccess } from "../lib/notifications";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "../lib/sidebarModifier";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SavedFilterCardProps {
  filter: SavedFilter;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the saved-filter listing: name, filter summary, "viewable online", hover Edit / Info. */
export function SavedFilterCard({
  filter,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: SavedFilterCardProps) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  const updateMutation = useUpdateSavedFilter();

  const checkboxId = `viewable-online-${filter.id}`;
  const slug = filter.slug;

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          <ListFilter className="size-4" />
        </span>
      )}
      title={filter.name}
      subtitle={summarizeBookmarkSearch(filter.filters)}
      renderPrimaryLink={(className, children) => (slug
        ? (
          <Link
            to="/saved-filters/$filterSlug/general"
            params={{
              filterSlug: slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "saved-filter", filter.id, slug)}
            className={className}
          >
            {children}
          </Link>
        )
        : <div className={className}>{children}</div>)}
      renderEdit={() => (slug
        ? (
          <HoverIconButton>
            <Link
              to="/saved-filters/$filterSlug/edit/general"
              params={{
                filterSlug: slug,
              }}
              title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
              onClick={event => editClick(event, "saved-filter", filter.id)}
            >
              <Pencil className="size-4" />
              <span className="sr-only">Edit {filter.name}</span>
            </Link>
          </HoverIconButton>
        )
        : null)}
      renderInfo={() => (slug
        ? (
          <HoverIconButton>
            <Link
              to="/saved-filters/$filterSlug/general"
              params={{
                filterSlug: slug,
              }}
              title={entityLinkTitle(modifier)}
              onClick={event => viewClick(event, "saved-filter", filter.id, slug)}
            >
              <Info className="size-4" />
              <span className="sr-only">View {filter.name}</span>
            </Link>
          </HoverIconButton>
        )
        : null)}
      footer={(
        <div className="space-y-1.5">
          {filter.description
            ? <p className="truncate text-sm text-muted-foreground">{filter.description}</p>
            : null}
          <div className="flex items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={filter.viewableOnline}
              disabled={updateMutation.isPending}
              onCheckedChange={(checked) => {
                const viewableOnline = checked === true;
                updateMutation.mutate(
                  {
                    id: filter.id,
                    input: {
                      viewableOnline,
                    },
                  },
                  {
                    onSuccess: () =>
                      notifySuccess(
                        viewableOnline
                          ? `"${filter.name}" is now a sidebar shortcut`
                          : `"${filter.name}" is no longer a sidebar shortcut`,
                      ),
                  },
                );
              }}
            />
            <Label
              htmlFor={checkboxId}
              className="
                flex items-center gap-1.5 text-sm font-normal
                text-muted-foreground
              "
            >
              <Globe className="size-3.5" />
              Viewable online
            </Label>
          </div>
        </div>
      )}
    />
  );
}
