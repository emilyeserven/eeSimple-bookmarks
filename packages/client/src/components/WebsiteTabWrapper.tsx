import type { Website } from "@eesimple/types";
import type { ReactNode } from "react";

import { TabWrapper } from "./TabWrapper";

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
  return (
    <TabWrapper
      entity={website}
      isLoading={isLoading}
      notFoundMessage="Website not found."
      title={title}
      description={description}
    >
      {children}
    </TabWrapper>
  );
}
