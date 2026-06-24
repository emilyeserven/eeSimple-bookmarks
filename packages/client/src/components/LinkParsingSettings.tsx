import { useState } from "react";

import { Plus } from "lucide-react";

import { LinkPreview } from "./LinkPreview";
import { domainListColumns } from "./tables/domainListColumns";
import { paramListColumns } from "./tables/paramListColumns";
import {
  useCustomStripParams,
  useRedirectIgnoreList,
  useShortenerIgnoreList,
  useUpdateCustomStripParams,
  useUpdateRedirectIgnoreList,
  useUpdateShortenerIgnoreList,
} from "../hooks/useAppSettings";
import { useWebsites } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";

/** Settings for URL parsing: the generic-shortener ignore list, redirect ignore list, custom strip params, and a link-preview tool. */
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

  const {
    data: customStripParams = [], isLoading: isLoadingCustomParams,
  } = useCustomStripParams();
  const updateCustomParams = useUpdateCustomStripParams();
  const [newParam, setNewParam] = useState("");

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

  function addParam(): void {
    const param = newParam.trim().toLowerCase();
    if (!param || customStripParams.includes(param)) {
      setNewParam("");
      return;
    }
    updateCustomParams.mutate([...customStripParams, param]);
    setNewParam("");
  }

  function removeParam(param: string): void {
    updateCustomParams.mutate(customStripParams.filter(p => p !== param));
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
                <DataTable<string>
                  columns={domainListColumns(remove)}
                  data={ignoreList}
                  emptyMessage="No shorteners configured."
                />
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
                <DataTable<string>
                  columns={domainListColumns(removeRedirect)}
                  data={redirectIgnoreList}
                  emptyMessage="No domains configured."
                />
              </>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional params to strip</CardTitle>
          <CardDescription>
            Query parameters to remove from every URL regardless of site rules — in addition to
            the built-in tracking params (UTM, fbclid, etc.). Use this for site-specific params
            not already covered (e.g.
            {" "}
            <code className="font-mono text-xs">ref</code>
            ,
            {" "}
            <code className="font-mono text-xs">source</code>
            ). Applies in &ldquo;Just trackers&rdquo; mode
            and when no per-site param rules exist.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingCustomParams
            ? <p className="text-sm text-muted-foreground">Loading…</p>
            : (
              <>
                <div className="flex max-w-sm gap-2">
                  <Input
                    placeholder="e.g. ref"
                    value={newParam}
                    onChange={event => setNewParam(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addParam();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={addParam}
                    disabled={updateCustomParams.isPending}
                  >
                    <Plus className="mr-1 size-4" />
                    Add
                  </Button>
                </div>
                <DataTable<string>
                  columns={paramListColumns(removeParam)}
                  data={customStripParams}
                  emptyMessage="No custom params configured."
                />
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
            customStripParams={customStripParams}
            label="URL"
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </CardContent>
      </Card>
    </>
  );
}
