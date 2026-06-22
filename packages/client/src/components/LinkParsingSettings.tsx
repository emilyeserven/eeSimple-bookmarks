import { useState } from "react";

import { Plus, X } from "lucide-react";

import { LinkPreview } from "./LinkPreview";
import {
  useShortenerIgnoreList,
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
    </>
  );
}
