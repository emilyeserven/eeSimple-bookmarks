import { useState } from "react";

import { Plus, X } from "lucide-react";

import { LinkPreview } from "./LinkPreview";
import {
  useRedirectIgnoreList,
  useShortenerIgnoreList,
  useUpdateRedirectIgnoreList,
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

/** Settings for URL parsing: the generic-shortener ignore list, redirect ignore list, and a link-preview tool. */
export function LinkParsingSettings() {
  const {
    data: ignoreList = [], isLoading,
  } = useShortenerIgnoreList();
  const {
    data: websites = [],
  } = useWebsites();
  const updateList = useUpdateShortenerIgnoreList();
  const [newDomain, setNewDomain] = useState("");

  const {
    data: redirectIgnoreList = [], isLoading: isLoadingRedirect,
  } = useRedirectIgnoreList();
  const updateRedirectList = useUpdateRedirectIgnoreList();
  const [newRedirectDomain, setNewRedirectDomain] = useState("");

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

  function addRedirect(): void {
    const domain = newRedirectDomain.trim().replace(/^www\./i, "").toLowerCase();
    if (!domain || redirectIgnoreList.includes(domain)) {
      setNewRedirectDomain("");
      return;
    }
    updateRedirectList.mutate([...redirectIgnoreList, domain]);
    setNewRedirectDomain("");
  }

  function removeRedirect(domain: string): void {
    updateRedirectList.mutate(redirectIgnoreList.filter(d => d !== domain));
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
          <CardTitle>Redirect resolution ignore list</CardTitle>
          <CardDescription>
            Domains whose redirect chains should never be followed when scanning a bookmark URL or
            processing newsletter imports (e.g. docs.google.com). Add a parent domain to cover all
            its subdomains (e.g. google.com covers docs.google.com and sheets.google.com).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingRedirect
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : (
              <>
                {redirectIgnoreList.length > 0
                  ? (
                    <div className="flex flex-wrap gap-2">
                      {redirectIgnoreList.map(domain => (
                        <Badge
                          key={domain}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {domain}
                          <button
                            type="button"
                            onClick={() => removeRedirect(domain)}
                            aria-label={`Remove ${domain}`}
                            className="hover:opacity-70"
                          >
                            <X className="size-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )
                  : <p className="text-sm text-muted-foreground">No domains configured.</p>}
                <div className="flex max-w-sm gap-2">
                  <Input
                    placeholder="e.g. docs.google.com"
                    value={newRedirectDomain}
                    onChange={event => setNewRedirectDomain(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addRedirect();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addRedirect}
                    disabled={updateRedirectList.isPending}
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
    </>
  );
}
