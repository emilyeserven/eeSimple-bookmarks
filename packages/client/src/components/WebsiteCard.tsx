import type { Website } from "@eesimple/types";

import { useState } from "react";

import { Link } from "@tanstack/react-router";
import { ExternalLink, Globe } from "lucide-react";

import { LabeledSection } from "./LabeledSection";
import { useEditPanelClick } from "./panel/useEditPanelClick";
import { ParamRulesList } from "./ParamRulesList";
import { ShortenedLinksList } from "./ShortenedLinksList";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SIDEBAR_MODIFIER_LABELS } from "@/lib/sidebarModifier";
import { useUiStore } from "@/stores/uiStore";

/** Read-only display card for a single website. Shared by the view page and the right panel's View body. */
export function WebsiteCard({
  website,
}: { website: Website }) {
  const editClick = useEditPanelClick();
  const modifier = useUiStore(state => state.sidebarOpenModifier);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = website.imageUrl != null && !imageFailed;
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="
              flex size-12 shrink-0 items-center justify-center overflow-hidden
              rounded-sm bg-muted text-muted-foreground
            "
          >
            {showImage
              ? (
                <img
                  src={website.imageUrl ?? undefined}
                  alt=""
                  className="size-full object-contain"
                  onError={() => setImageFailed(true)}
                />
              )
              : <Globe className="size-6" />}
          </span>
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-semibold">{website.siteName}</h2>
            <a
              href={`https://${website.domain}`}
              target="_blank"
              rel="noreferrer"
              className="
                inline-flex items-center gap-1 text-sm text-muted-foreground
                hover:text-foreground hover:underline
              "
            >
              {website.domain}
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          size="sm"
        >
          <Link
            to="/taxonomies/websites/$websiteSlug/edit"
            params={{
              websiteSlug: website.slug,
            }}
            title={`Edit (hold ${SIDEBAR_MODIFIER_LABELS[modifier]} to open in the sidebar)`}
            onClick={event => editClick(event, "website", website.id)}
          >
            Edit
          </Link>
        </Button>
      </div>

      <Separator />

      <LabeledSection title="Details">
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Added</dt>
          <dd>{new Date(website.createdAt).toLocaleDateString()}</dd>
          <dt className="text-muted-foreground">Slug</dt>
          <dd className="font-mono">{website.slug}</dd>
          <dt className="text-muted-foreground">Built-in</dt>
          <dd>{website.builtIn ? "Yes — name & domain are fixed" : "No"}</dd>
          {website.bookmarkCount != null
            ? (
              <>
                <dt className="text-muted-foreground">Bookmarks</dt>
                <dd>{website.bookmarkCount}</dd>
              </>
            )
            : null}
        </dl>
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Verified shortened links"
        description="Short domains that resolve to this site and how they expand."
      >
        <ShortenedLinksList
          links={website.shortenedLinks}
          emptyText="None"
        />
      </LabeledSection>

      <Separator />

      <LabeledSection
        title="Keep-param rules"
        description="For matching paths, only these query params are kept; the rest are stripped."
      >
        <ParamRulesList
          rules={website.paramRules}
          emptyText="None"
        />
      </LabeledSection>
    </div>
  );
}
