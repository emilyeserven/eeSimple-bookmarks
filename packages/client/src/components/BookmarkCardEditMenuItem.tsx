import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { useEditPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";

/** The "Edit" entry of a bookmark card's "More" menu — links to the edit page or opens the sidebar. */
export function BookmarkCardEditMenuItem({
  bookmarkId,
}: {
  bookmarkId: string;
}) {
  const {
    t,
  } = useTranslation();
  const editClick = useEditPanelClick();
  const modifier = useSidebarOpenModifier();

  return (
    <DropdownMenuItem asChild>
      <Link
        to="/bookmarks/$bookmarkId/edit"
        params={{
          bookmarkId,
        }}
        title={t("Edit (hold {{modifier}} to open in the sidebar)", {
          modifier: SIDEBAR_MODIFIER_LABELS[modifier],
        })}
        onClick={event => editClick(event, "bookmark", bookmarkId)}
      >
        {t("Edit")}
      </Link>
    </DropdownMenuItem>
  );
}
