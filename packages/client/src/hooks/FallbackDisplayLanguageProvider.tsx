import type { ReactNode } from "react";

import { FallbackDisplayLanguageContext } from "./fallbackDisplayLanguage";
import { useFallbackDisplayLanguage } from "./useAppSettings";

/**
 * Resolve the configured Fallback display language once (from the server-persisted display
 * preferences) and provide it to the tree via {@link FallbackDisplayLanguageContext}. Mounted at the
 * app root, beneath `QueryClientProvider`, so the combobox/title primitives can read the value
 * without each touching react-query (which would throw in unit tests / Storybook that render them in
 * isolation).
 */
export function FallbackDisplayLanguageProvider({
  children,
}: { children: ReactNode }) {
  const fallbackLanguage = useFallbackDisplayLanguage();
  return (
    <FallbackDisplayLanguageContext.Provider value={fallbackLanguage}>
      {children}
    </FallbackDisplayLanguageContext.Provider>
  );
}
