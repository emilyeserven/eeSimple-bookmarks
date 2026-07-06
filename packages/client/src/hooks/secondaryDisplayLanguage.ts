import type { PreferredLanguage } from "@eesimple/types";

import { createContext, useContext } from "react";

/**
 * App-wide "Secondary display language" value, resolved once at the app root
 * (`SecondaryDisplayLanguageProvider`) and read by the combobox primitives (and any other
 * broadly-reused component) to show an entity's secondary-language name de-emphasized after its
 * primary — WITHOUT each low-level component calling the react-query-backed
 * `useSecondaryDisplayLanguage()` hook itself.
 *
 * Deliberately a plain context with a `null` default: the primitives are rendered in isolation by
 * unit tests and Storybook where no `QueryClientProvider` exists, so calling the query hook directly
 * from them would throw "No QueryClient set". Reading the context instead degrades to `null` (the
 * "auto" fallback — English-tagged name, else the first other name), matching the pre-existing
 * behavior, and lights up the real setting only under the provider.
 */
export const SecondaryDisplayLanguageContext = createContext<PreferredLanguage | null>(null);

/**
 * The active Secondary display language, or `null` when unset / outside the provider (tests,
 * Storybook). Safe to call from any component — never touches react-query.
 */
export function useSecondaryDisplayLanguageValue(): PreferredLanguage | null {
  return useContext(SecondaryDisplayLanguageContext);
}
