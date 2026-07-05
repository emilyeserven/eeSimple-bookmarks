/* eslint-disable react-refresh/only-export-components -- registry module pairs view/edit components with a non-component content-type def */
import type { PanelContentTypeDef, PanelListItem } from "./types";

import { useMemo } from "react";

import { Languages } from "lucide-react";

import { useLanguages } from "../../../hooks/useLanguages";
import i18n from "../../../i18n";
import { languageWorkbench } from "../../workbench/language";
import { EntityWorkbenchPanel } from "../EntityWorkbenchPanel";

function useLanguageList() {
  const {
    data, isLoading, error,
  } = useLanguages();
  const items = useMemo<PanelListItem[]>(
    () => (data ?? []).map(language => ({
      id: language.id,
      label: language.name,
      sublabel: language.builtIn ? i18n.t("Built-in") : i18n.t("Custom"),
    })),
    [data],
  );
  return {
    items,
    isLoading,
    error,
  };
}

/** Read-only language view — the same body + shell the main-app pages render. */
function LanguageView({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={languageWorkbench}
      id={id}
      mode="view"
      contentType="language"
    />
  );
}

/** Language editor — the same auto-save form the main-app edit tab renders. */
function LanguageEdit({
  id,
}: {
  id: string;
}) {
  return (
    <EntityWorkbenchPanel
      workbench={languageWorkbench}
      id={id}
      mode="edit"
      contentType="language"
    />
  );
}

export const languageContentType: PanelContentTypeDef = {
  type: "language",
  label: i18n.t("Languages"),
  singular: i18n.t("Language"),
  icon: Languages,
  useList: useLanguageList,
  View: LanguageView,
  Edit: LanguageEdit,
};
