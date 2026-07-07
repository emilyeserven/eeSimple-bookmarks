import type { PropertyGroup } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Layers, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HoverIconButton, StandardListingCard } from "./StandardListingCard";

/**
 * A single row in the property-group listing. Exception to the standard: a property group has no
 * "filtered bookmarks" page, so the card body links to the group's detail page and the badge counts
 * member properties rather than bookmarks. The standard hover Edit + Info buttons still apply.
 */
export function PropertyGroupListItem({
  group,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  group: PropertyGroup;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Layers className="size-5 shrink-0 text-muted-foreground" />}
      title={group.name}
      subtitle={group.description || t("Priority {{priority}}", {
        priority: group.priority,
      })}
      count={group.propertyCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/property-groups/$propertyGroupSlug/info"
          params={{
            propertyGroupSlug: group.slug,
          }}
          title={t("View {{name}}", {
            name: group.name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/edit"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={t("Edit {{name}}", {
              name: group.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: group.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/property-groups/$propertyGroupSlug/info"
            params={{
              propertyGroupSlug: group.slug,
            }}
            title={t("View {{name}}", {
              name: group.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: group.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
