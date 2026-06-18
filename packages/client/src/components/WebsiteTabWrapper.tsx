import type { Website } from "@eesimple/types";
import type { ReactNode } from "react";

import { useWebsiteBySlug } from "@/hooks/useWebsites";

interface Props {
  websiteSlug: string;
  title: string;
  description: string;
  children: (website: Website) => ReactNode;
}

/** Loads a website by slug and renders a tab's title + description header above its content. */
export function WebsiteTabWrapper({
  websiteSlug,
  title,
  description,
  children,
}: Props) {
  const {
    website, isLoading,
  } = useWebsiteBySlug(websiteSlug);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!website) return <p className="text-destructive">Website not found.</p>;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children(website)}
    </section>
  );
}
