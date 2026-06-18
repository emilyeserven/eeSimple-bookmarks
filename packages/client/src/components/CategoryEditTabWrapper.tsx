import type { Category } from "@eesimple/types";
import type { ReactNode } from "react";

import { TabWrapper } from "./TabWrapper";

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
  return (
    <TabWrapper
      entity={category}
      isLoading={isLoading}
      notFoundMessage="Category not found."
      title={title}
      description={description}
    >
      {children}
    </TabWrapper>
  );
}
