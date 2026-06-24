import type { RedirectFailureBookmark, RedirectFailureWebsite } from "@eesimple/types";

import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Loader2, Pencil } from "lucide-react";

import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useFetchMetadata } from "../hooks/useFetchMetadata";
import { useRedirectFailureWebsites, REDIRECT_FAILURES_KEY } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookmarksApi } from "@/lib/api/bookmarks";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface BookmarkRowProps {
  bookmark: RedirectFailureBookmark;
  siteName: string;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onFixed: () => void;
}

function BookmarkUrlFixRow({
  bookmark,
  siteName,
  expanded,
  onExpand,
  onCollapse,
  onFixed,
}: BookmarkRowProps) {
  const [urlInput, setUrlInput] = useState(bookmark.url ?? "");
  const [fetchedTitle, setFetchedTitle] = useState("");
  const [fetchedDescription, setFetchedDescription] = useState("");
  const [hasFetched, setHasFetched] = useState(false);
  const fetchMetadata = useFetchMetadata();
  const updateBookmark = useUpdateBookmark();

  async function handleFetch() {
    const url = urlInput.trim();
    if (!url) return;
    try {
      const result = await fetchMetadata.mutateAsync({
        url,
        siteName,
      });
      setFetchedTitle(result.title ?? bookmark.title);
      setFetchedDescription(result.description ?? bookmark.description ?? "");
      setHasFetched(true);
    }
    catch {
      notifyError("Could not fetch metadata for that URL.");
    }
  }

  async function handleSave() {
    const url = urlInput.trim();
    if (!url) return;
    try {
      await updateBookmark.mutateAsync({
        id: bookmark.id,
        input: {
          url,
          title: fetchedTitle.trim() || bookmark.title,
          description: fetchedDescription.trim() || null,
        },
      });
      void bookmarksApi.autoImage(bookmark.id).catch(() => undefined);
      notifySuccess("Bookmark updated");
      onFixed();
    }
    catch {
      notifyError("Could not update the bookmark.");
    }
  }

  if (!expanded) {
    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{bookmark.title}</p>
          {bookmark.url
            ? (
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  flex items-center gap-1 truncate text-xs text-muted-foreground
                  hover:underline
                "
              >
                <ExternalLink className="size-3 shrink-0" />
                {bookmark.url}
              </a>
            )
            : <p className="text-xs text-muted-foreground">No URL</p>}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onExpand}
        >
          <Pencil className="mr-1.5 size-3.5" />
          Update URL
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 py-3">
      <div className="space-y-1.5">
        <Label>New URL</Label>
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            placeholder="https://example.com/real-url"
            className="flex-1"
          />
          {bookmark.url
            ? (
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Open current URL"
                >
                  <ExternalLink className="size-4" />
                </Button>
              </a>
            )
            : null}
        </div>
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!urlInput.trim() || fetchMetadata.isPending}
        onClick={() => void handleFetch()}
      >
        {fetchMetadata.isPending
          ? <Loader2 className="mr-1.5 size-3.5 animate-spin" />
          : null}
        Fetch Metadata
      </Button>

      {hasFetched
        ? (
          <div className="space-y-3 rounded-md border bg-muted/40 p-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={fetchedTitle}
                onChange={e => setFetchedTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={fetchedDescription}
                onChange={e => setFetchedDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )
        : null}

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={!urlInput.trim() || !hasFetched || updateBookmark.isPending}
          onClick={() => void handleSave()}
        >
          {updateBookmark.isPending
            ? <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            : null}
          Save
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onCollapse}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface SiteGroupProps {
  site: RedirectFailureWebsite;
  expandedBookmarkId: string | null;
  onExpand: (id: string) => void;
  onCollapse: () => void;
  onFixed: () => void;
}

function SiteGroup({
  site,
  expandedBookmarkId,
  onExpand,
  onCollapse,
  onFixed,
}: SiteGroupProps) {
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
            {site.bookmarks.length === 1 ? "bookmark" : "bookmarks"}
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
          Edit website
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
    data: sites = [], isLoading,
  } = useRedirectFailureWebsites();
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
        Loading…
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No websites are currently flagged for redirect resolution failure. To flag one, open a
        website&apos;s edit page and enable the &quot;Redirect resolution failure&quot; toggle.
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
          onExpand={id => setExpandedBookmarkId(id)}
          onCollapse={() => setExpandedBookmarkId(null)}
          onFixed={handleFixed}
        />
      ))}
    </div>
  );
}
