import type { WebsiteCondition } from "@eesimple/types";

import { useState } from "react";

import { MultiCombobox } from "../MultiCombobox";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWebsite, useWebsites } from "@/hooks/useWebsites";

function normalizeUrl(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  }
  catch {
    return null;
  }
}

interface WebsiteConditionEditorProps {
  value: WebsiteCondition;
  onChange: (next: WebsiteCondition) => void;
}

/**
 * Controlled multi-select editor for a "website is one of …" condition. Websites are matched by
 * domain (a bookmark's host, with a leading `www.` stripped). New websites can be added inline.
 */
export function WebsiteConditionEditor({
  value, onChange,
}: WebsiteConditionEditorProps) {
  const {
    data: websites = [], isLoading,
  } = useWebsites();
  const createWebsite = useCreateWebsite();

  const [addOpen, setAddOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  // Surface every selected domain even if no website record matches it (e.g. a backfilled legacy
  // domain match), so the editor never silently drops a stored value.
  const knownDomains = new Set(websites.map(w => w.domain));
  const options = [
    ...websites.map(w => ({
      value: w.domain,
      label: w.siteName ?? w.domain,
    })),
    ...value.domains
      .filter(domain => !knownDomains.has(domain))
      .map(domain => ({
        value: domain,
        label: domain,
      })),
  ];

  return (
    <div className="space-y-2">
      <MultiCombobox
        aria-label="Websites"
        placeholder={isLoading ? "Loading…" : "Any website"}
        searchPlaceholder="Search websites…"
        emptyText="No websites found."
        options={options}
        values={value.domains}
        onValuesChange={domains =>
          onChange({
            ...value,
            domains,
          })}
      />

      <button
        type="button"
        className="
          text-xs text-muted-foreground underline
          hover:no-underline
        "
        onClick={() => setAddOpen(true)}
      >
        Add new website
      </button>

      <Dialog
        open={addOpen}
        onOpenChange={setAddOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Website</DialogTitle>
            <DialogDescription>
              Enter a URL from the site. The domain will be saved and selected automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="add-website-url">URL</Label>
              <Input
                id="add-website-url"
                placeholder="https://example.com"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-website-title">Title (optional)</Label>
              <Input
                id="add-website-title"
                placeholder="Example"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={createWebsite.isPending || !urlInput.trim()}
              onClick={async () => {
                const domain = normalizeUrl(urlInput.trim());
                if (!domain) return;
                const result = await createWebsite.mutateAsync({
                  domain,
                  siteName: titleInput.trim() || undefined,
                });
                if (!value.domains.includes(result.domain)) {
                  onChange({
                    ...value,
                    domains: [...value.domains, result.domain],
                  });
                }
                setAddOpen(false);
                setUrlInput("");
                setTitleInput("");
              }}
            >
              {createWebsite.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
