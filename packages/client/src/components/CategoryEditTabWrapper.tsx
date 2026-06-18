import type { Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { useCategoryBySlug } from "@/hooks/useCategories";

interface Props {
  categorySlug: string;
  title: string;
  description: string;
  children: (category: Category) => ReactNode;
}

export function CategoryEditTabWrapper({
  categorySlug,
  title,
  description,
  children,
}: Props) {
  const {
    category, isLoading,
  } = useCategoryBySlug(categorySlug);
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!category) return <p className="text-destructive">Category not found.</p>;
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children(category)}
    </section>
  );
}
