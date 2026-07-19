/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its accessor hook, the same convention as the other *Context.tsx files. */
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

const NumberBoundsContext = createContext<Record<string, [number, number]> | null>(null);

/**
 * Publishes the server-reported per-property `[min, max]` number bounds (from
 * `POST /api/bookmarks/search`) to the filter UI below it. Under server-side pagination the client
 * only holds one page, so the range sliders can no longer derive data bounds from the loaded set —
 * this context restores the whole-scope bounds without threading a prop through every filter layer.
 */
export function NumberBoundsProvider({
  value, children,
}: {
  value: Record<string, [number, number]> | undefined;
  children: ReactNode;
}) {
  return (
    <NumberBoundsContext.Provider value={value ?? null}>
      {children}
    </NumberBoundsContext.Provider>
  );
}

/** The server-reported `[min, max]` for one number property, or `undefined` outside the provider / for an unvalued property. */
export function useServerNumberBounds(propertyId: string): [number, number] | undefined {
  return useContext(NumberBoundsContext)?.[propertyId];
}
