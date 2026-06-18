import { useState } from "react";

import type { MatchCondition } from "@eesimple/types";

import { FIELD_OPTIONS, OPERATOR_OPTIONS } from "./matchOptions";

import { Combobox } from "@/components/Combobox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateWebsite, useWebsites } from "@/hooks/useWebsites";

function normalizeUrl(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^www\./i, "").toLowerCase();
  }
  catch {
    return null;
  }
}

interface MatchConditionEditorProps {
  value: MatchCondition;
  onChange: (next: MatchCondition) => void;
}

/** Controlled editor for a single text-match condition (operator + field + pattern). */
export function MatchConditionEditor({
  value, onChange,
}: MatchConditionEditorProps) {
  const isDomain = value.operator === "domain";

  const { data: websites = [], isLoading } = useWebsites();
  const createWebsite = useCreateWebsite();

  const [addOpen, setAddOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [titleInput, setTitleInput] = useState("");

  return (
    <div
      className="
        grid gap-3
        sm:grid-cols-2
      "
    >
      <div className="space-y-1">
        <Label>Match</Label>
        <Select
          value={value.operator}
          onValueChange={(operator) => {
            const next = operator as MatchCondition["operator"];
            // `domain` always inspects the URL, so pin the field to keep the data coherent.
            onChange({
              ...value,
              operator: next,
              field: next === "domain" ? "url" : value.field,
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPERATOR_OPTIONS.map(option => (
              <SelectItem
                key={option.value}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isDomain
        ? (
          <p className="self-end text-xs text-muted-foreground">
            Matches the bookmark URL's domain (a leading "www." is ignored).
          </p>
        )
        : (
          <div className="space-y-1">
            <Label>Field</Label>
            <Select
              value={value.field}
              onValueChange={field =>
                onChange({
                  ...value,
                  field: field as MatchCondition["field"],
                })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_OPTIONS.map(option => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

      {isDomain
        ? (
          <div
            className="
              space-y-1
              sm:col-span-2
            "
          >
            <Label>Domain</Label>
            <Combobox
              options={websites.map(w => ({
                value: w.domain,
                label: w.siteName ?? w.domain,
              }))}
              value={value.pattern || undefined}
              onValueChange={domain => onChange({ ...value, pattern: domain ?? "" })}
              placeholder={isLoading ? "Loading…" : "Select a website…"}
              searchPlaceholder="Search websites…"
              emptyText="No websites found."
            />
            {!isLoading && websites.length === 0
              ? (
                <p className="text-sm text-muted-foreground">
                  No websites yet.{" "}
                  <button
                    type="button"
                    className="underline hover:no-underline"
                    onClick={() => setAddOpen(true)}
                  >
                    Add one
                  </button>
                </p>
              )
              : (
                <button
                  type="button"
                  className="text-xs text-muted-foreground underline hover:no-underline"
                  onClick={() => setAddOpen(true)}
                >
                  Add new website
                </button>
              )}

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
                      onChange({ ...value, pattern: result.domain });
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
        )
        : (
          <div
            className="
              space-y-1
              sm:col-span-2
            "
          >
            <Label>Pattern</Label>
            <Input
              value={value.pattern}
              placeholder="e.g. Ponzu"
              onChange={event =>
                onChange({
                  ...value,
                  pattern: event.target.value,
                })}
            />
          </div>
        )}
    </div>
  );
}
