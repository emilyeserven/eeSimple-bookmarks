import type { BulkUrlUpdateResult, Website } from "@eesimple/types";

import { useEffect, useState } from "react";

import { ExternalLink } from "lucide-react";

import { LabeledSection } from "./LabeledSection";
import { useBookmarksOnHost, useBulkExpandBookmarkUrls } from "../hooks/useBookmarks";
import { canonicalize } from "../lib/urlCleanup";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

/** Lists the website's saved shortened links that have an expansion rule, each with a bulk-expander. */
export function BulkExpandSection({
  website,
}: { website: Website }) {
  const expandable = website.shortenedLinks.filter(link => link.expandTo && !link.keepShortened);
  if (expandable.length === 0) return null;
  return (
    <LabeledSection title="Expand existing bookmarks">
      {expandable.map(link => (
        <BulkExpandShortened
          key={link.domain}
          website={website}
          domain={link.domain}
        />
      ))}
    </LabeledSection>
  );
}

/** Review + bulk-apply the expansion of bookmarks saved on one shortened domain. */
function BulkExpandShortened({
  website, domain,
}: { website: Website;
  domain: string; }) {
  const [open, setOpen] = useState(false);
  const {
    data: bookmarks = [], isLoading,
  } = useBookmarksOnHost(open ? domain : null);
  const bulk = useBulkExpandBookmarkUrls();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<BulkUrlUpdateResult[] | null>(null);

  // Compute the expanded form for each bookmark and keep only those that actually change.
  const items = bookmarks
    .map(bookmark => ({
      ...bookmark,
      after: canonicalize(bookmark.url ?? "", {
        mode: "none",
        websites: [website],
        ignoreList: [],
      }).url,
    }))
    .filter(item => item.after !== item.url);

  // Default every changed bookmark to selected once the list loads.
  useEffect(() => {
    setSelected(new Set(items.map(item => item.id)));
    setResults(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks]);

  function toggle(id: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function apply(): void {
    const payload = items
      .filter(item => selected.has(item.id))
      .map(item => ({
        id: item.id,
        url: item.after,
      }));
    if (payload.length === 0) return;
    bulk.mutate(payload, {
      onSuccess: setResults,
    });
  }

  return (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">
          Review
          {" "}
          <span className="font-mono">{domain}</span>
          {" "}
          links to expand
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(value => !value)}
        >
          {open ? "Hide" : "Review"}
        </Button>
      </div>

      {open
        ? (
          <div className="mt-3 space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
            {!isLoading && items.length === 0
              ? <p className="text-sm text-muted-foreground">No bookmarks to expand.</p>
              : null}
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-2 rounded-md border p-2 text-sm"
              >
                <Checkbox
                  checked={selected.has(item.id)}
                  onCheckedChange={() => toggle(item.id)}
                  aria-label={`Expand ${item.title}`}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.title}</p>
                  <p
                    className="truncate font-mono text-xs text-muted-foreground"
                  >{item.url}
                  </p>
                  <p className="truncate font-mono text-xs">→ {item.after}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  asChild
                  aria-label="Open expanded link in new tab"
                >
                  <a
                    href={item.after}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              </div>
            ))}

            {items.length > 0
              ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={selected.size === 0 || bulk.isPending}
                  onClick={apply}
                >
                  {bulk.isPending ? "Applying…" : `Apply ${selected.size} selected`}
                </Button>
              )
              : null}

            {results
              ? (
                <p className="text-sm text-muted-foreground">
                  Applied
                  {" "}
                  {results.filter(result => result.status === "applied").length}
                  {", skipped "}
                  {results.filter(result => result.status !== "applied").length}
                  .
                </p>
              )
              : null}
          </div>
        )
        : null}
    </div>
  );
}
