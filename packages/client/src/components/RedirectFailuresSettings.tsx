import type { RedirectFailureWebsite } from "@eesimple/types";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { BookmarkUrlFixRow } from "./BookmarkUrlFixRow";
import { useUrlSanitizer } from "../hooks/useUrlSanitizer";
import { useRedirectFailureWebsites, REDIRECT_FAILURES_KEY } from "../hooks/useWebsites";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SiteGroupProps {
  site: RedirectFailureWebsite;
  expandedBookmarkId: string | null;
  sanitizeUrl: (url: string) => string;
  onExpand: (id: string) => void;
  onCollapse: () => void;
  onFixed: () => void;
}

function SiteGroup({
  site,
  expandedBookmarkId,
  sanitizeUrl,
  onExpand,
  onCollapse,
  onFixed,
}: SiteGroupProps) {
  const {
    t,
  } = useTranslation();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        {site.imageUrl
          ? (
            <img
              src={site.imageUrl}
              alt=""
              className="size-8 shrink-0 rounded-sm object-cover"
            />
          )
          : null}
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{site.siteName}</CardTitle>
          <CardDescription>
            {site.domain}
            {" · "}
            {site.bookmarks.length}
            {" "}
            {site.bookmarks.length === 1 ? t("bookmark") : t("bookmarks")}
          </CardDescription>
        </div>
        <Link
          to="/taxonomies/websites/$websiteSlug/edit/general"
          params={{
            websiteSlug: site.slug,
          }}
          className="
            shrink-0 text-xs text-muted-foreground
            hover:underline
          "
        >
          {t("Edit website")}
        </Link>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">
          {site.bookmarks.map(bm => (
            <BookmarkUrlFixRow
              key={bm.id}
              bookmark={bm}
              siteName={site.siteName}
              expanded={expandedBookmarkId === bm.id}
              sanitizeUrl={sanitizeUrl}
              onExpand={() => onExpand(bm.id)}
              onCollapse={onCollapse}
              onFixed={onFixed}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/** Settings page listing bookmarks whose website is flagged for redirect resolution failure. */
export function RedirectFailuresSettings() {
  const {
    t,
  } = useTranslation();
  const {
    data: sites = [], isLoading,
  } = useRedirectFailureWebsites();
  const sanitizeUrl = useUrlSanitizer();
  const [expandedBookmarkId, setExpandedBookmarkId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  function handleFixed() {
    setExpandedBookmarkId(null);
    void queryClient.invalidateQueries({
      queryKey: REDIRECT_FAILURES_KEY,
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("Loading…")}
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("No websites are currently flagged for redirect resolution failure. To flag one, open a website's edit page and enable the \"Redirect resolution failure\" toggle.")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sites.map(site => (
        <SiteGroup
          key={site.id}
          site={site}
          expandedBookmarkId={expandedBookmarkId}
          sanitizeUrl={sanitizeUrl}
          onExpand={id => setExpandedBookmarkId(id)}
          onCollapse={() => setExpandedBookmarkId(null)}
          onFixed={handleFixed}
        />
      ))}
    </div>
  );
}
