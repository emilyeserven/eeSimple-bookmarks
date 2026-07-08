import type { RedirectFailureBookmark } from "@eesimple/types";

import { useState } from "react";

import { ExternalLink, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useUpdateBookmark } from "../hooks/useBookmarks";
import { useFetchMetadata } from "../hooks/useFetchMetadata";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { bookmarksApi } from "@/lib/api/bookmarks";
import { notifySuccess, notifyError } from "@/lib/notifications";

interface BookmarkRowProps {
  bookmark: RedirectFailureBookmark;
  siteName: string;
  expanded: boolean;
  /** Canonicalize a pasted URL on blur (strip trackers, expand verified shortened links). */
  sanitizeUrl: (url: string) => string;
  onExpand: () => void;
  onCollapse: () => void;
  onFixed: () => void;
}

export function BookmarkUrlFixRow({
  bookmark,
  siteName,
  expanded,
  sanitizeUrl,
  onExpand,
  onCollapse,
  onFixed,
}: BookmarkRowProps) {
  const {
    t,
  } = useTranslation();
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
      notifyError(t("Could not fetch metadata for that URL."));
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
      notifySuccess(t("Bookmark updated"));
      onFixed();
    }
    catch {
      notifyError(t("Could not update the bookmark."));
    }
  }

  if (!expanded) {
    return (
      <div className="flex items-center justify-between gap-3 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium wrap-break-word">{bookmark.title}</p>
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
            onBlur={() => {
              const cleaned = sanitizeUrl(urlInput);
              if (cleaned !== urlInput) setUrlInput(cleaned);
            }}
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
