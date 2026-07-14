import type { Newsletter } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Mail, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { CategoryPill } from "./CategoryPill";
import { FavoriteToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";

/** A single row in the newsletter listing: an icon, a body link to its issues, and hover Edit / Info. */
export function NewsletterListItem({
  newsletter,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  newsletter: Newsletter;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const favorite = useFavoriteToggle("newsletter");

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      renderExtra={() => (
        <FavoriteToggleButton
          isFavorite={Boolean(newsletter.isFavorite)}
          name={newsletter.name}
          onToggle={() => favorite.toggle({
            id: newsletter.id,
            name: newsletter.name,
            isFavorite: Boolean(newsletter.isFavorite),
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
          <Mail className="size-4" />
        </span>
      )}
      title={newsletter.name}
      count={newsletter.bookmarkCount}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/newsletters/$newsletterSlug"
          params={{
            newsletterSlug: newsletter.slug,
          }}
          title={t("Show issues of {{name}}", {
            name: newsletter.name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/newsletters/$newsletterSlug/edit"
            params={{
              newsletterSlug: newsletter.slug,
            }}
            title={t("Edit {{name}}", {
              name: newsletter.name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: newsletter.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/newsletters/$newsletterSlug/info"
            params={{
              newsletterSlug: newsletter.slug,
            }}
            title={t("View {{name}}", {
              name: newsletter.name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: newsletter.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      footer={newsletter.category
        ? <CategoryPill category={newsletter.category} />
        : undefined}
    />
  );
}
