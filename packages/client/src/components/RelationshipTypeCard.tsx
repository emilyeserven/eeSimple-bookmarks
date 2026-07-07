import type { RelationshipType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Link2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HideToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useUpdateRelationshipType } from "../hooks/useRelationshipTypes";

import { Badge } from "@/components/ui/badge";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

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
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
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
            name: relationshipType.name,
          })
          : t("Showing \"{{name}}\" in pickers", {
            name: relationshipType.name,
          })),
      onError: () => notifyError(t("Couldn't update \"{{name}}\"", {
        name: relationshipType.name,
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
      title={relationshipType.name}
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
          name={relationshipType.name}
          onToggle={toggleHidden}
        />
      )}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/relationship-types/$relationshipTypeSlug/info"
          params={{
            relationshipTypeSlug: relationshipType.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "relationship-type", relationshipType.id, relationshipType.slug)}
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
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "relationship-type", relationshipType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">{t("Edit {{name}}", {
              name: relationshipType.name,
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
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "relationship-type", relationshipType.id, relationshipType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">{t("View {{name}}", {
              name: relationshipType.name,
            })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
