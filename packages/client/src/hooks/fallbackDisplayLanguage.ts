import type { PreferredLanguage } from "@eesimple/types";

import { createContext, useContext } from "react";

/**
 * App-wide "Fallback display language" value, resolved once at the app root
 * (`FallbackDisplayLanguageProvider`) and read by the combobox/title primitives (and any other
 * broadly-reused component) to choose which language's name shows as the de-emphasized fallback
 * secondary label when no preferred/secondary-language name matches — WITHOUT each low-level
 * component calling the react-query-backed `useFallbackDisplayLanguage()` hook itself.
 *
 * Deliberately a plain context with a `null` default: the primitives are rendered in isolation by
 * unit tests and Storybook where no `QueryClientProvider` exists, so calling the query hook directly
 * from them would throw "No QueryClient set". Reading the context instead degrades to `null`, which
 * the pure `resolveDisplayNames`/`resolveNameSortKey` helpers treat as English (the historical
 * hardcoded fallback), matching the pre-existing behavior, and lights up the real setting only under
 * the provider.
 */
export const FallbackDisplayLanguageContext = createContext<PreferredLanguage | null>(null);

/**
 * The active Fallback display language, or `null` when unset / outside the provider (tests,
 * Storybook). Safe to call from any component — never touches react-query. `null` is treated as
 * English by the display/sort helpers.
 */
export function useFallbackDisplayLanguageValue(): PreferredLanguage | null {
  return useContext(FallbackDisplayLanguageContext);
}
