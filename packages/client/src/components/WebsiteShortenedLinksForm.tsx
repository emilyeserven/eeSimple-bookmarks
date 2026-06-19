import type { ShortenedLink, Website } from "@eesimple/types";

import { useState } from "react";

import { BulkExpandSection } from "./BulkExpandSection";
import { LabeledSection } from "./LabeledSection";
import { LinkPreview } from "./LinkPreview";
import { ShortenedLinksEditor } from "./WebsiteEditors";
import { useUpdateWebsite } from "../hooks/useWebsites";
import { normalizeShortLinks } from "../lib/websiteForm";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface Props {
  website: Website;
}

/** Edit a website's shortened-link domains, with a link preview and bulk-expand tool. */
export function WebsiteShortenedLinksForm({
  website,
}: Props) {
  const updateWebsite = useUpdateWebsite();
  const [shortLinks, setShortLinks] = useState<ShortenedLink[]>(website.shortenedLinks);

  const payloadShortLinks = normalizeShortLinks(shortLinks);
  const storedShortLinks = normalizeShortLinks(website.shortenedLinks);
  const dirty = JSON.stringify(payloadShortLinks) !== JSON.stringify(storedShortLinks);

  const editedWebsite: Website = {
    ...website,
    shortenedLinks: payloadShortLinks,
  };

  function save(): void {
    if (!dirty) return;
    updateWebsite.mutate({
      id: website.id,
      input: {
        shortenedLinks: payloadShortLinks,
      },
    });
  }

  return (
    <div className="space-y-6">
      <ShortenedLinksEditor
        idBase={website.id}
        links={shortLinks}
        onChange={setShortLinks}
      />

      <Separator />

      <LabeledSection
        title="Preview"
        description="Uses the edits above."
      >
        <LinkPreview
          websites={[editedWebsite]}
          ignoreList={[]}
          label=""
          placeholder="Paste a link on this site…"
        />
      </LabeledSection>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          disabled={!dirty || updateWebsite.isPending}
          onClick={save}
        >
          {updateWebsite.isPending ? "Saving…" : "Save changes"}
        </Button>
        {updateWebsite.isError
          ? <p className="text-sm text-destructive">{updateWebsite.error.message}</p>
          : null}
      </div>

      {editedWebsite.shortenedLinks.some(link => link.expandTo && !link.keepShortened)
        ? (
          <>
            <Separator />
            <BulkExpandSection website={website} />
          </>
        )
        : null}
    </div>
  );
}
