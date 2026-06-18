import type { Website } from "@eesimple/types";

import { Link } from "@tanstack/react-router";
import { Pencil } from "lucide-react";

import { useEditPanelClick, useViewPanelClick } from "./panel/useEditPanelClick";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RowCard } from "@/components/ui/card";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** A single row in the website listing: a link to the view page plus a hover edit button. */
export function WebsiteListItem({
  website,
}: { website: Website }) {
  const editClick = useEditPanelClick();
  const viewClick = useViewPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  return (
    <RowCard className="group relative">
      <Link
        to="/taxonomies/websites/$websiteSlug"
        params={{
          websiteSlug: website.slug,
        }}
        title={`Open (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
        onClick={event => viewClick(event, "website", website.id)}
        className="
          flex items-center gap-3 rounded-lg p-4 pr-12 transition-colors
          hover:bg-accent
        "
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium">{website.siteName}</p>
          <p className="truncate text-sm text-muted-foreground">{website.domain}</p>
        </div>
        {website.bookmarkCount !== undefined
          ? <Badge variant="secondary">{website.bookmarkCount}</Badge>
          : null}
      </Link>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="
          absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity
          group-hover:opacity-100
          focus-visible:opacity-100
        "
      >
        <Link
          to="/taxonomies/websites/$websiteSlug/edit"
          params={{
            websiteSlug: website.slug,
          }}
          title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
          onClick={event => editClick(event, "website", website.id)}
        >
          <Pencil className="size-4" />
          <span className="sr-only">Edit {website.siteName}</span>
        </Link>
      </Button>
    </RowCard>
  );
}
