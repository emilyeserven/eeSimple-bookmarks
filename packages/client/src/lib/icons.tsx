import type { LucideProps } from "lucide-react";

import { Tag, icons } from "lucide-react";

/** Every available Lucide icon name (PascalCase), e.g. `"Star"`, `"BookOpen"`. */
export const ICON_NAMES = Object.keys(icons) as (keyof typeof icons)[];

/** The icon rendered when a category has no icon set or an unknown name. */
const DEFAULT_ICON = Tag;

interface CategoryIconProps extends Omit<LucideProps, "name"> {
  /** A Lucide icon name; falls back to a default icon when null/unknown. */
  name: string | null | undefined;
}

/** Render a Lucide icon by its stored name, with a sensible fallback. */
export function CategoryIcon({
  name, ...props
}: CategoryIconProps) {
  const Icon = (name && icons[name as keyof typeof icons]) || DEFAULT_ICON;
  return <Icon {...props} />;
}
