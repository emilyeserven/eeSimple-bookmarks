import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** The "Edit" entry of a bookmark card's "More" menu — links to the edit page or opens the sidebar. */
export function BookmarkCardEditMenuItem({
  bookmarkId,
}: {
  bookmarkId: string;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <DropdownMenuItem asChild>
      <Link
        to="/bookmarks/$bookmarkId/edit"
        params={{
          bookmarkId,
        }}
      >
        {t("Edit")}
      </Link>
    </DropdownMenuItem>
  );
}
