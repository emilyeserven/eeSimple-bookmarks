import type { GroupType } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Info, Library, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { HideToggleButton, HoverIconButton, StandardListingCard } from "./StandardListingCard";
import { useUpdateGroupType } from "../hooks/useGroupTypes";

import { Badge } from "@/components/ui/badge";
import { useBuiltInName } from "@/lib/builtInName";
import { notifyError, notifySuccess } from "@/lib/notifications";

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
  onSelectToggle?: (shiftKey?: boolean) => void;
  inSelectionMode?: boolean;
}) {
  const {
    t,
  } = useTranslation();
  const builtInName = useBuiltInName();
  const name = builtInName(groupType);
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
      icon={<Library className="size-5 shrink-0 text-muted-foreground" />}
      title={name}
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
          name={name}
          onToggle={toggleHidden}
        />
      )}
      renderPrimaryLink={(className, children) => (
        <Link
          to="/taxonomies/group-types/$groupTypeSlug/info"
          params={{
            groupTypeSlug: groupType.slug,
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
            to="/taxonomies/group-types/$groupTypeSlug/edit"
            params={{
              groupTypeSlug: groupType.slug,
            }}
            title={t("Edit {{name}}", {
              name: name,
            })}
          >
            <Pencil className="size-4" />
            <span className="sr-only">
              {t("Edit {{name}}", {
                name: name,
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
            title={t("View {{name}}", {
              name: name,
            })}
          >
            <Info className="size-4" />
            <span className="sr-only">
              {t("View {{name}}", {
                name: name,
              })}
            </span>
          </Link>
        </HoverIconButton>
      )}
    />
  );
}
