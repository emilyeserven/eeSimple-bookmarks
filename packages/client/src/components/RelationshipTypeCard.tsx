import type { RelationshipType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Link2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HideToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useUpdateRelationshipType } from "../hooks/useRelationshipTypes";

import { Badge } from "@/components/ui/badge";
import { useBuiltInName } from "@/lib/builtInName";
import { notifyError, notifySuccess } from "@/lib/notifications";

/** A single relationship-type listing card: body → its detail page, with hover Edit / Info. */
export function RelationshipTypeCard({
  relationshipType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  relationshipType: RelationshipType;
  selectable?: boolean;
  selected?: boolean;
  onSelectToggle?: () => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const name = builtInName(relationshipType);
  const update = useUpdateRelationshipType();

  const toggleHidden = () => {
    const nextHidden = !relationshipType.hidden;
    update.mutate({
      id: relationshipType.id,
      input: {
        hidden: nextHidden,
      },
    }, {
      onSuccess: () =>
        notifySuccess(nextHidden
          ? t("Hid \"{{name}}\" from pickers", {
            name: name,
          })
          : t("Showing \"{{name}}\" in pickers", {
            name: name,
          })),
      onError: () => notifyError(t("Couldn't update \"{{name}}\"", {
        name: name,
      })),
    });
  };

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Link2 className="size-5 shrink-0 text-muted-foreground" />}
      title={name}
      titleAdornment={
        <>
          {relationshipType.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
          {relationshipType.hidden ? <Badge variant="outline">{t("Hidden")}</Badge> : null}
        </>
      }
      subtitle={relationshipType.directional ? t("Directional") : t("Symmetric")}
      count={relationshipType.bookmarkCount}
      renderExtra={() => (
        <HideToggleButton
          hidden={relationshipType.hidden}
          name={name}
          onToggle={toggleHidden}
        />
      )}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/relationship-types/$relationshipTypeSlug/info"
          params={{
            relationshipTypeSlug: relationshipType.slug,
          }}
          title={t("View {{name}}", {
            name: name,
          })}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/edit"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={t("Edit {{name}}", {
              name: name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/relationship-types/$relationshipTypeSlug/info"
            params={{
              relationshipTypeSlug: relationshipType.slug,
            }}
            title={t("View {{name}}", {
              name: name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
