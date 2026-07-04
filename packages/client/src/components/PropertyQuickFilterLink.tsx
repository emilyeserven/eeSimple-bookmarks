import type { BookmarkSearch } from "@/lib/bookmarkSearch";

import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

interface PropertyQuickFilterLinkProps {
  /** The pre-built Bookmarks-page filter to apply when clicked. */
  search: BookmarkSearch;
  /** Property name, used for the button's accessible label. */
  name: string;
}

/**
 * A hover-revealed magnifying-glass button shown at the right of a custom-property row on the
 * bookmark detail page. Navigates to the Bookmarks listing pre-filtered to bookmarks sharing this
 * property's value.
 */
export function PropertyQuickFilterLink({
  search, name,
}: PropertyQuickFilterLinkProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className="
        ml-auto size-6 shrink-0 self-center opacity-0 transition-opacity
        group-hover:opacity-100
        focus-visible:opacity-100
      "
    >
      <Link
        to="/bookmarks"
        search={search}
        aria-label={t("Filter bookmarks by {{name}}", {
          name,
        })}
        title={t("Filter bookmarks by {{name}}", {
          name,
        })}
      >
        <Search className="size-4" />
      </Link>
    </Button>
  );
}
