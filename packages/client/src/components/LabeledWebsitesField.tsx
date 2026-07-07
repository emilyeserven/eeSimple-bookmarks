import type { LabeledWebsite, Website } from "@eesimple/types";

import { useState } from "react";

import { Globe, Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Combobox } from "./Combobox";
import { useWebsites } from "../hooks/useWebsites";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  labeledWebsites: LabeledWebsite[];
  onChange: (websites: LabeledWebsite[]) => void;
}

/** Build the site's homepage URL from its stored host (the taxonomy stores only the domain). */
function websiteUrl(website: Website): string {
  return `https://${website.domain}`;
}

/**
 * Controlled, variable-length list of labeled websites — each row is a freeform label + URL, with an
 * optional link to a Websites-taxonomy entry (picking one fills the URL from that site and records
 * `websiteId`; editing the URL by hand clears the link and keeps it freeform). Each row renders on
 * its own lines. Commits the whole array on blur / add / remove / website pick, mirroring
 * `SocialLinksField`.
 */
export function LabeledWebsitesField({
  labeledWebsites,
  onChange,
}: Props) {
  const {
    t,
  } = useTranslation();
  const {
    data: websites,
  } = useWebsites();
  const [draft, setDraft] = useState<LabeledWebsite[]>(() => labeledWebsites);

  const websiteOptions = (websites ?? []).map(website => ({
    value: website.id,
    label: website.siteName,
    icon: (
      <Globe className="size-4 shrink-0 text-muted-foreground" />
    ),
  }));

  /** Replace the draft and push the change up (dropping fully-empty rows on commit). */
  function commit(next: LabeledWebsite[]) {
    setDraft(next);
    onChange(next.filter(row => row.label.trim().length > 0 || row.url.trim().length > 0));
  }

  function updateRow(index: number, patch: Partial<LabeledWebsite>) {
    setDraft(prev => prev.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }

  function commitRow(index: number, patch: Partial<LabeledWebsite>) {
    commit(draft.map((row, i) => (i === index
      ? {
        ...row,
        ...patch,
      }
      : row)));
  }

  function addRow() {
    setDraft(prev => [...prev, {
      label: "",
      url: "",
      websiteId: null,
    }]);
  }

  function removeRow(index: number) {
    commit(draft.filter((_, i) => i !== index));
  }

  function pickWebsite(index: number, websiteId: string | undefined) {
    const website = (websites ?? []).find(w => w.id === websiteId);
    if (!website) {
      commitRow(index, {
        websiteId: null,
      });
      return;
    }
    commit(draft.map((r, i) => (i === index
      ? {
        label: r.label.trim().length > 0 ? r.label : website.siteName,
        url: websiteUrl(website),
        websiteId: website.id,
      }
      : r)));
  }

  return (
    <div className="space-y-3">
      <Label>{t("Websites")}</Label>
      {draft.map((row, index) => (
        <div

          key={index}
          className="flex flex-col gap-2 rounded-md border p-3"
        >
          <div className="flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <Input
                aria-label={t("Label")}
                placeholder={t("Label (e.g. Homepage)")}
                value={row.label}
                onChange={e => updateRow(index, {
                  label: e.target.value,
                })}
                onBlur={e => commitRow(index, {
                  label: e.target.value.trim(),
                })}
              />
              <Input
                type="url"
                aria-label={t("URL")}
                placeholder="https://example.com"
                value={row.url}
                // Typing a URL by hand detaches the row from any linked taxonomy website.
                onChange={e => updateRow(index, {
                  url: e.target.value,
                  websiteId: null,
                })}
                onBlur={e => commitRow(index, {
                  url: e.target.value.trim(),
                })}
              />
              <Combobox
                aria-label={t("Link to a saved website")}
                placeholder={t("Link to a saved website (optional)")}
                searchPlaceholder={t("Search websites…")}
                emptyText={t("No websites found.")}
                options={websiteOptions}
                value={row.websiteId ?? undefined}
                onValueChange={value => pickWebsite(index, value)}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("Remove website")}
              onClick={() => removeRow(index)}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addRow}
      >
        <Plus className="size-4" />
        {t("Add website")}
      </Button>
    </div>
  );
}
