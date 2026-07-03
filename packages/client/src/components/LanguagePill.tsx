import type { BookmarkLanguage } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Globe } from "lucide-react";

import { useViewPanelClick } from "./panel/useEditPanelClick";
import { useSidebarOpenModifier } from "../hooks/useAppSettings";

import { Badge } from "@/components/ui/badge";
import { entityLinkTitle } from "@/lib/sidebarModifier";

/** A clickable pill showing a bookmark's primary language. Navigates to the language page; hold the modifier key to open in the sidebar. */
export function LanguagePill({
  language,
}: { language: BookmarkLanguage }) {
  const viewClick = useViewPanelClick();
  const modifier = useSidebarOpenModifier();
  return (
    <Link
      to="/taxonomies/languages/$languageSlug"
      params={{
        languageSlug: language.slug,
      }}
      title={entityLinkTitle(modifier)}
      onClick={event => viewClick(event, "language", language.id, language.slug)}
    >
      <Badge
        variant="secondary"
        className="inline-flex items-center gap-1"
      >
        <Globe className="size-3 shrink-0" />
        {language.name}
      </Badge>
    </Link>
  );
}
