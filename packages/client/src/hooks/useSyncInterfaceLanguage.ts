import { useEffect } from "react";

import i18n from "../i18n";
import { useInterfaceLanguage } from "./useAppSettings";

/**
 * Keeps i18next and the document's `lang` attribute in sync with the persisted interface-language
 * setting. Mount once, globally (see {@link RootLayout}). Until the setting query resolves,
 * {@link useInterfaceLanguage} falls back to `"en"` — i18next's own initial language — so there is
 * no flash of the wrong language.
 */
export function useSyncInterfaceLanguage(): void {
  const language = useInterfaceLanguage();
  useEffect(() => {
    void i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);
}
