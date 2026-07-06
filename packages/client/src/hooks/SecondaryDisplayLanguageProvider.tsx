import type { ReactNode } from "react";

import { SecondaryDisplayLanguageContext } from "./secondaryDisplayLanguage";
import { useSecondaryDisplayLanguage } from "./useAppSettings";

/**
 * Resolve the configured Secondary display language once (from the server-persisted display
 * preferences) and provide it to the tree via {@link SecondaryDisplayLanguageContext}. Mounted at the
 * app root, beneath `QueryClientProvider`, so the combobox primitives can read the value without each
 * touching react-query (which would throw in unit tests / Storybook that render them in isolation).
 */
export function SecondaryDisplayLanguageProvider({
  children,
}: { children: ReactNode }) {
  const secondaryLanguage = useSecondaryDisplayLanguage();
  return (
    <SecondaryDisplayLanguageContext.Provider value={secondaryLanguage}>
      {children}
    </SecondaryDisplayLanguageContext.Provider>
  );
}
