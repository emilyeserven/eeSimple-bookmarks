import type { ShortenedLink, UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { useTranslation } from "react-i18next";

import { BulkExpandSection } from "./BulkExpandSection";
import { LabeledSection } from "./LabeledSection";
import { LinkPreview } from "./LinkPreview";
import { ShortenedLinksEditor } from "./WebsiteEditors";
import { useFieldAutoSave } from "../hooks/useFieldAutoSave";
import { useUpdateWebsite } from "../hooks/useWebsites";
import { normalizeShortLinks } from "../lib/websiteForm";

import { Separator } from "@/components/ui/separator";

const LABELS: Partial<Record<keyof UpdateWebsiteInput, string>> = {
  shortenedLinks: "Shortened Links",
};

interface Props {
  website: Website;
}

/** Edit a website's shortened-link domains, with a link preview and bulk-expand tool. Auto-saves on change. */
export function WebsiteShortenedLinksForm({
  website,
}: Props) {
  const {
    t,
  } = useTranslation();
  const updateWebsite = useUpdateWebsite();
  const [shortLinks, setShortLinks] = useState<ShortenedLink[]>(website.shortenedLinks);

  const autoSave = useFieldAutoSave<UpdateWebsiteInput>({
    id: website.id,
    update: updateWebsite,
    labels: LABELS,
    initial: {
      shortenedLinks: normalizeShortLinks(website.shortenedLinks),
    },
  });

  const payloadShortLinks = normalizeShortLinks(shortLinks);

  const editedWebsite: Website = {
    ...website,
    shortenedLinks: payloadShortLinks,
  };

  function handleChange(next: ShortenedLink[]): void {
    setShortLinks(next);
    autoSave.saveField("shortenedLinks", normalizeShortLinks(next));
  }

  return (
    <div className="space-y-6">
      <ShortenedLinksEditor
        idBase={website.id}
        links={shortLinks}
        onChange={handleChange}
      />

      <Separator />

      <LabeledSection
        title={t("Preview")}
        description={t("Uses the edits above.")}
      >
        <LinkPreview
          websites={[editedWebsite]}
          ignoreList={[]}
          label=""
          placeholder={t("Paste a link on this site…")}
        />
      </LabeledSection>

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
