import type { CustomProperty } from "@eesimple/types";
import type { ReactNode } from "react";

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
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!property) return <p className="text-destructive">Custom property not found.</p>;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children(property)}
    </section>
  );
}
