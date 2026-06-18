import type { CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

import { TabWrapper } from "./TabWrapper";

import { usePropertyBySlug } from "@/hooks/useCustomProperties";

interface Props {
  propertySlug: string;
  title: string;
  description: string;
  children: (property: CustomProperty) => ReactNode;
}

/**
 * Loads a custom property by slug and renders a tab's `title` + `description` header above its content.
 * Shared by the tabbed View and Edit pages so each tab stays a thin wrapper (mirrors
 * `CategoryEditTabWrapper`).
 */
export function PropertyTabWrapper({
  propertySlug,
  title,
  description,
  children,
}: Props) {
  const {
    property, isLoading,
  } = usePropertyBySlug(propertySlug);
  return (
    <TabWrapper
      entity={property}
      isLoading={isLoading}
      notFoundMessage="Custom property not found."
      title={title}
      description={description}
    >
      {children}
    </TabWrapper>
  );
}
