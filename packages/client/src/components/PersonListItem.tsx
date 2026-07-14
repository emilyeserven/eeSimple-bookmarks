import type { Person } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Pencil, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FavoriteToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useEntityImage } from "../hooks/useEntityImage";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

interface PersonListItemProps {
  person: Person;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}

/** A single row in the person listing: name, bookmark count, and hover Edit / Info. */
export function PersonListItem({
  person,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: PersonListItemProps) {
  const {
    t,
  } = useTranslation();
  const {
    showImage,
    onError,
  } = useEntityImage(person.imageUrl);
  const favorite = useFavoriteToggle("person");

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      renderExtra={() => (
        <FavoriteToggleButton
          isFavorite={Boolean(person.isFavorite)}
          name={person.name}
          onToggle={() => favorite.toggle({
            id: person.id,
            name: person.name,
            isFavorite: Boolean(person.isFavorite),
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
          {showImage
            ? (
              <img
                src={person.imageUrl ?? undefined}
                alt=""
                className="size-full object-cover"
                onError={onError}
              />
            )
            : <UserRound className="size-4" />}
        </span>
      )}
      title={person.name}
      count={person.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/people/$personSlug"
          params={{
            personSlug: person.slug,
          }}
          title={t("View {{name}}", {
            name: person.name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/people/$personSlug/edit"
            params={{
              personSlug: person.slug,
            }}
            title={t("Edit {{name}}", {
              name: person.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: person.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/people/$personSlug/info"
            params={{
              personSlug: person.slug,
            }}
            title={t("View {{name}}", {
              name: person.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: person.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
