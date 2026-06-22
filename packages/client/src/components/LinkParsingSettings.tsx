import type { NewsletterBlacklistEntry, NewsletterBlacklistKind } from "@eesimple/types";

import { useState } from "react";

import { blacklistPatternsFor } from "@eesimple/types";
import { Plus, X } from "lucide-react";

import { LinkPreview } from "./LinkPreview";
import {
  useNewsletterBlacklist,
  useShortenerIgnoreList,
  useUpdateNewsletterBlacklist,
  useUpdateShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { useWebsites } from "../hooks/useWebsites";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Human label for each blacklist match kind, shown on the entry badges + kind picker. */
const KIND_LABEL: Record<NewsletterBlacklistKind, string> = {
  "exact": "url",
  "domain": "domain",
  "path-prefix": "path",
};

/** Derive a normalized blacklist entry from free text (a URL or bare host) for the chosen kind. */
function entryFromInput(kind: NewsletterBlacklistKind, raw: string): NewsletterBlacklistEntry {
  const trimmed = raw.trim();
  try {
    const url = trimmed.includes("://") ? trimmed : `https://${trimmed}`;
    const patterns = blacklistPatternsFor(url);
    if (kind === "domain") return patterns.domain;
    if (kind === "exact") return patterns.exact;
    return patterns.pathPrefix;
  }
  catch {
    return {
      kind,
      value: trimmed.toLowerCase(),
    };
  }
}

/** Editor for the newsletter scan blacklist: links matching these are dropped from future scans. */
function NewsletterBlacklistCard() {
  const {
    data: entries = [], isLoading,
  } = useNewsletterBlacklist();
  const update = useUpdateNewsletterBlacklist();
  const [kind, setKind] = useState<NewsletterBlacklistKind>("domain");
  const [value, setValue] = useState("");

  function add(): void {
    const entry = entryFromInput(kind, value);
    if (entry.value.length === 0) {
      setValue("");
      return;
    }
    if (entries.some(e => e.kind === entry.kind && e.value === entry.value)) {
      setValue("");
      return;
    }
    update.mutate([...entries, entry]);
    setValue("");
  }

  function remove(entry: NewsletterBlacklistEntry): void {
    update.mutate(entries.filter(e => !(e.kind === entry.kind && e.value === entry.value)));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter scan blacklist</CardTitle>
        <CardDescription>
          Links matching these are skipped on future newsletter scans. Block a single URL, a whole
          domain, or a page-path prefix (e.g.
          {" "}
          <code>example.com/sponsored</code>
          {" "}
          blocks everything
          under that path). You can also add an entry straight from a rejected link in the review queue.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading
          ? <p className="text-sm text-muted-foreground">Loading…</p>
          : (
            <>
              {entries.length > 0
                ? (
                  <div className="flex flex-wrap gap-2">
                    {entries.map(entry => (
                      <Badge
                        key={`${entry.kind}:${entry.value}`}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <span className="text-muted-foreground">{KIND_LABEL[entry.kind]}:</span>
                        {entry.value}
                        <button
                          type="button"
                          onClick={() => remove(entry)}
                          aria-label={`Remove ${entry.value}`}
                          className="hover:opacity-70"
                        >
                          <X className="size-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )
                : <p className="text-sm text-muted-foreground">No blocked links yet.</p>}
              <div className="flex max-w-xl flex-wrap gap-2">
                <Select
                  value={kind}
                  onValueChange={v => setKind(v as NewsletterBlacklistKind)}
                >
                  <SelectTrigger
                    aria-label="Block type"
                    className="w-32"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="path-prefix">Page path</SelectItem>
                    <SelectItem value="exact">Exact URL</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="min-w-48 flex-1"
                  placeholder={kind === "domain" ? "e.g. example.com" : "e.g. example.com/sponsored"}
                  value={value}
                  onChange={event => setValue(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      add();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={add}
                  disabled={update.isPending}
                >
                  <Plus className="mr-1 size-4" />
                  Add
                </Button>
              </div>
            </>
          )}
      </CardContent>
    </Card>
  );
}

/** Settings for URL parsing: the generic-shortener ignore list and a link-preview tool. */
export function LinkParsingSettings() {
  const {
    data: ignoreList = [], isLoading,
  } = useShortenerIgnoreList();
  const {
    data: websites = [],
  } = useWebsites();
  const updateList = useUpdateShortenerIgnoreList();
  const [newDomain, setNewDomain] = useState("");

  function add(): void {
    const domain = newDomain.trim().replace(/^www\./i, "").toLowerCase();
    if (!domain || ignoreList.includes(domain)) {
      setNewDomain("");
      return;
    }
    updateList.mutate([...ignoreList, domain]);
    setNewDomain("");
  }

  function remove(domain: string): void {
    updateList.mutate(ignoreList.filter(d => d !== domain));
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Generic shortener ignore list</CardTitle>
          <CardDescription>
            Domains of URL shorteners that can’t be tied to a specific site (e.g. bit.ly, t.co). When
            you add a link on one of these, the form nudges you to paste the full URL instead.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : (
              <>
                {ignoreList.length > 0
                  ? (
                    <div className="flex flex-wrap gap-2">
                      {ignoreList.map(domain => (
                        <Badge
                          key={domain}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {domain}
                          <button
                            type="button"
                            onClick={() => remove(domain)}
                            aria-label={`Remove ${domain}`}
                            className="hover:opacity-70"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )
                  : <p className="text-sm text-muted-foreground">No shorteners configured.</p>}
                <div className="flex max-w-sm gap-2">
                  <Input
                    placeholder="e.g. bit.ly"
                    value={newDomain}
                    onChange={event => setNewDomain(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        add();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={add}
                    disabled={updateList.isPending}
                  >
                    <Plus className="mr-1 size-4" />
                    Add
                  </Button>
                </div>
              </>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check a link</CardTitle>
          <CardDescription>
            Paste any URL to see which site it resolves to and how it would be canonicalized when
            saved — including verified short-link expansion and shortener nudges.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LinkPreview
            websites={websites}
            ignoreList={ignoreList}
            label="URL"
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </CardContent>
      </Card>

      <NewsletterBlacklistCard />
    </>
  );
}
