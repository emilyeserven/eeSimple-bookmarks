import type { GroupType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Library, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";
import { HideToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";
import { useUpdateGroupType } from "../hooks/useGroupTypes";

import { Badge } from "@/components/ui/badge";
import { notifyError, notifySuccess } from "@/lib/notifications";
import { SIDEBAR_MODIFIER_LABELS, entityLinkTitle } from "@/lib/sidebarModifier";

/**
 * A single row in the group-type listing. A group type has no "filtered bookmarks" page, so
 * the card body links to its detail page and the badge counts member groups. The standard hover Edit +
 * Info buttons still apply.
 */
export function GroupTypeListItem({
  groupType,
  selectable,
  selected,
  onSelectToggle,
  inSelectionMode,
}: {
  groupType: GroupType;
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
  const update = useUpdateGroupType();

  const toggleHidden = () => {
    const nextHidden = !groupType.hidden;
    update.mutate({
      id: groupType.id,
      input: {
        hidden: nextHidden,
      },
    }, {
      onSuccess: () =>
        notifySuccess(nextHidden
          ? t("Hid \"{{name}}\" from pickers", {
            name: groupType.name,
          })
          : t("Showing \"{{name}}\" in pickers", {
            name: groupType.name,
          })),
      onError: () => notifyError(t("Couldn't update \"{{name}}\"", {
        name: groupType.name,
      })),
    });
  };

  return (
    <StandardListingCard
      selectable={selectable}
      selected={selected}
      onSelectToggle={onSelectToggle}
      inSelectionMode={inSelectionMode}
      icon={<Library className="size-5 shrink-0 text-muted-foreground" />}
      title={groupType.name}
      titleAdornment={
        <>
          {groupType.builtIn ? <Badge variant="secondary">{t("Built-in")}</Badge> : null}
          {groupType.hidden ? <Badge variant="outline">{t("Hidden")}</Badge> : null}
        </>
      }
      count={groupType.groupCount}
      renderExtra={() => (
        <HideToggleButton
          hidden={groupType.hidden}
          name={groupType.name}
          onToggle={toggleHidden}
        />
      )}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/group-types/$groupTypeSlug/info"
          params={{
            groupTypeSlug: groupType.slug,
          }}
          title={entityLinkTitle(modifier)}
          onClick={event => viewClick(event, "group-type", groupType.id, groupType.slug)}
          className={className}
        >
          {children}
        </Link>
      )}
      renderEdit={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/group-types/$groupTypeSlug/edit"
            params={{
              groupTypeSlug: groupType.slug,
            }}
            title={t("Edit (hold {{modifier}} to open in the sidebar)", {
              modifier: SIDEBAR_MODIFIER_LABELS[modifier],
            })}
            onClick={event => editClick(event, "group-type", groupType.id)}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: groupType.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
      renderInfo={() => (
        <HoverIconButton>
          <Link
            to="/taxonomies/group-types/$groupTypeSlug/info"
            params={{
              groupTypeSlug: groupType.slug,
            }}
            title={entityLinkTitle(modifier)}
            onClick={event => viewClick(event, "group-type", groupType.id, groupType.slug)}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: groupType.name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
