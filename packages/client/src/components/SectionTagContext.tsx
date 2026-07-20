/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its accessor hook, the same convention as the other *Context.tsx files. */
import type { SectionDisplayMode } from "../lib/bookmarkColumns";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

/**
 * The active section-tag scope: which tag subtree the surrounding page resolves bookmark section
 * tags against. Provided by any tag listing page (the tag's own subtree) — the "Tagged sections"
 * card field reads this and renders nowhere else (homepage, /bookmarks, other entity listings), even
 * when placed in the card display config.
 */
export interface SectionTagScope {
  /** The scoped tag's id plus all descendant ids (the subtree the filter matches against). */
  tagIds: ReadonlySet<string>;
  /** The scoped tag's display name (for labels/tooltips). */
  tagName: string;
  /**
   * How each card renders: full card + chips ("both"), full card with chips suppressed
   * ("bookmarks"), or only the title + chips ("sections"). Chosen by the View Options toggle.
   */
  mode: SectionDisplayMode;
}

const SectionTagContext = createContext<SectionTagScope | null>(null);

export function SectionTagProvider({
  value, children,
}: {
  value: SectionTagScope;
  children: ReactNode;
}) {
  return <SectionTagContext.Provider value={value}>{children}</SectionTagContext.Provider>;
}

/** The active section-tag scope, or `null` outside a tag listing page. */
export function useSectionTagScope(): SectionTagScope | null {
  return useContext(SectionTagContext);
}
