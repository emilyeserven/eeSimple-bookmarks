import type { SavedFilter } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe, Info, ListFilter, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useUpdateSavedFilter } from "../hooks/useSavedFilters";
import { summarizeBookmarkSearch } from "../lib/bookmarkSearch";
import { notifySuccess } from "../lib/notifications";

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
  const {
    t,
  } = useTranslation();
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
            to="/saved-filters/$filterSlug/info"
            params={{
              filterSlug: slug,
            }}
            title={t("View {{name}}", {
              name: filter.name,
            })}
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
              to="/saved-filters/$filterSlug/edit"
              params={{
                filterSlug: slug,
              }}
              title={t("Edit {{name}}", {
                name: filter.name,
              })}
            >
              <Pencil className="size-4" />
              <span className="sr-only">
                {t("Edit {{name}}", {
                  name: filter.name,
                })}
              </span>
            </Link>
          </HoverIconButton>
        )
        : null)}
      renderInfo={() => (slug
        ? (
          <HoverIconButton>
            <Link
              to="/saved-filters/$filterSlug/info"
              params={{
                filterSlug: slug,
              }}
              title={t("View {{name}}", {
                name: filter.name,
              })}
            >
              <Info className="size-4" />
              <span className="sr-only">
                {t("View {{name}}", {
                  name: filter.name,
                })}
              </span>
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
                          ? t("\"{{name}}\" is now a sidebar shortcut", {
                            name: filter.name,
                          })
                          : t("\"{{name}}\" is no longer a sidebar shortcut", {
                            name: filter.name,
                          }),
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
              {t("Viewable online")}
            </Label>
          </div>
        </div>
      )}
    />
  );
}
