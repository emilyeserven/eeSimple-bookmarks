import type { Group } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { BookOpen, Info, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FavoriteToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

interface GroupListItemProps {
  group: Group;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the group listing: name, website info, bookmark count, and hover Edit / Info. */
export function GroupListItem({
  group,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: GroupListItemProps) {
  const {
    t,
  } = useTranslation();
  const favorite = useFavoriteToggle("group");

  const primaryWebsite = group.labeledWebsites[0];
  const websiteLabel = primaryWebsite
    ? (primaryWebsite.label.trim().length > 0
      ? `${primaryWebsite.label} (${primaryWebsite.url})`
      : primaryWebsite.url)
    : undefined;

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      renderExtra={() => (
        <FavoriteToggleButton
          isFavorite={Boolean(group.isFavorite)}
          name={group.name}
          onToggle={() => favorite.toggle({
            id: group.id,
            name: group.name,
            isFavorite: Boolean(group.isFavorite),
          })}
        />
      )}
      icon={(
        <span
          className="
            flex size-8 shrink-0 items-center justify-center overflow-hidden
            rounded-full bg-muted text-muted-foreground
          "
        >
          <BookOpen className="size-4" />
        </span>
      )}
      title={group.name}
      subtitle={websiteLabel}
      count={group.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/groups/$groupSlug"
          params={{
            groupSlug: group.slug,
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
            to="/taxonomies/groups/$groupSlug/edit"
            params={{
              groupSlug: group.slug,
            }}
            title={t("Edit {{name}}", {
              name: group.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: group.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/groups/$groupSlug/info"
            params={{
              groupSlug: group.slug,
            }}
            title={t("View {{name}}", {
              name: group.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: group.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
