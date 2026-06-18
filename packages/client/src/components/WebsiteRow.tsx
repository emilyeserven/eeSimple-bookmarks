import type { ParamRuleDraft } from "../lib/websiteForm";
import type { ShortenedLink, UpdateWebsiteInput, Website } from "@eesimple/types";

import { useState } from "react";

import { BulkExpandSection } from "./BulkExpandSection";
import { ParamRulesEditor, ShortenedLinksEditor } from "./WebsiteEditors";
import { WebsiteIdentityFields } from "./WebsiteIdentityFields";
import { WebsitePreviewSection } from "./WebsitePreviewSection";
import { useUpdateWebsite } from "../hooks/useWebsites";
import { normalizeRules, normalizeShortLinks } from "../lib/websiteForm";

import { Separator } from "@/components/ui/separator";

/** A single editable website row: name/domain plus shortened-link and param-cleanup rules. */
export function WebsiteRow({
  website,
  onSaved,
}: { website: Website;
  onSaved?: () => void; }) {
  const updateWebsite = useUpdateWebsite();
  const [siteName, setSiteName] = useState(website.siteName);
  const [domain, setDomain] = useState(website.domain);
  const [shortLinks, setShortLinks] = useState<ShortenedLink[]>(website.shortenedLinks);
  const [rules, setRules] = useState<ParamRuleDraft[]>(() =>
    website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    })));

  const payloadShortLinks = normalizeShortLinks(shortLinks);
  const payloadRules = normalizeRules(rules);
  const stored = {
    shortLinks: normalizeShortLinks(website.shortenedLinks),
    rules: normalizeRules(website.paramRules.map(rule => ({
      pathSuffix: rule.pathSuffix,
      paramsText: rule.params.join(", "),
    }))),
  };

  const dirty
    = (!website.builtIn && (siteName.trim() !== website.siteName || domain.trim() !== website.domain))
      || JSON.stringify(payloadShortLinks) !== JSON.stringify(stored.shortLinks)
      || JSON.stringify(payloadRules) !== JSON.stringify(stored.rules);
  const valid = siteName.trim().length > 0 && domain.trim().length > 0;

  // A live website built from the current (unsaved) edits, used to preview canonicalization.
  const editedWebsite: Website = {
    ...website,
    siteName: siteName.trim() || website.siteName,
    domain: domain.trim() || website.domain,
    shortenedLinks: payloadShortLinks,
    paramRules: payloadRules,
  };

  function save(): void {
    if (!dirty || !valid) return;
    const input: UpdateWebsiteInput = {
      shortenedLinks: payloadShortLinks,
      paramRules: payloadRules,
    };
    if (!website.builtIn) {
      input.siteName = siteName.trim();
      input.domain = domain.trim();
    }
    updateWebsite.mutate(
      {
        id: website.id,
        input,
      },
      {
        onSuccess: () => onSaved?.(),
      },
    );
  }

  const expandableLinks = website.shortenedLinks.filter(link => link.expandTo && !link.keepShortened);

  return (
    <div className="space-y-6">
      <WebsiteIdentityFields
        websiteId={website.id}
        builtIn={website.builtIn}
        siteName={siteName}
        domain={domain}
        onSiteNameChange={setSiteName}
        onDomainChange={setDomain}
        canSave={dirty && valid}
        isPending={updateWebsite.isPending}
        onSave={save}
      />

      <Separator />

      <ShortenedLinksEditor
        idBase={website.id}
        links={shortLinks}
        onChange={setShortLinks}
      />

      <Separator />

      <ParamRulesEditor
        idBase={website.id}
        rules={rules}
        onChange={setRules}
      />

      <Separator />

      <WebsitePreviewSection website={editedWebsite} />

      {expandableLinks.length > 0
        ? (
          <>
            <Separator />
            <BulkExpandSection website={website} />
          </>
        )
        : null}

      {updateWebsite.isError
        ? <p className="text-sm text-destructive">{updateWebsite.error.message}</p>
        : null}
    </div>
  );
}
