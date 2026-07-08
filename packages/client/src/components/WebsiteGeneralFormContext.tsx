/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useWebsiteGeneralFormContext` reader hook + the shared value type, the standard React context
   module shape */
import type { useWebsiteGeneralForm } from "./useWebsiteGeneralForm";
import type { Website } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useTranslation } from "react-i18next";

import { useWebsiteGeneralForm as useWebsiteGeneralFormHook } from "./useWebsiteGeneralForm";
import { useImageTaxonomySyncRegistration } from "../hooks/useImageTaxonomySyncRegistration";

/**
 * Shares the **one** `useWebsiteGeneralForm` controller across the website General tab's now-granular
 * edit fields (#1188 field extraction). The layout render seam (`LayoutDrivenTabBody`) invokes each
 * field's `edit` renderer as a plain call, so N independent field components would each spin up N
 * separate `useAppForm` instances (and separate auto-save engines, favicon mutations, and local
 * tag/alternate-name state), losing the shared per-field auto-save + slug-follow-on-rename. Instead the
 * controller — plus the header "Sync from source" registration — is instantiated **once** here and read
 * by every granular edit field via {@link useWebsiteGeneralFormContext}. View fields need no context
 * (they read the entity directly).
 *
 * Mounted by the generic `EntityEditView` around the edit body only when the active tab hosts a
 * shared-form field (the descriptor's `editFormProvider`/`sharedFormFieldKeys` seam), so the controller
 * + sync registration keep mounting exactly where `WebsiteGeneralForm` used to (the General tab by
 * default), while staying correct if an operator relocates the fields via Page Layouts. This is the
 * slug-routed analogue of `BookmarkGeneralFormContext` — see the `surface-entity-field` skill
 * ("Extraction (reverse direction)").
 */
export interface WebsiteGeneralFormContextValue {
  ctrl: ReturnType<typeof useWebsiteGeneralForm>;
}

const WebsiteGeneralFormContext = createContext<WebsiteGeneralFormContextValue | null>(null);

export function WebsiteGeneralFormProvider({
  website,
  children,
}: {
  website: Website;
  children: ReactNode;
}) {
  const {
    t,
  } = useTranslation();
  const ctrl = useWebsiteGeneralFormHook(website);

  // Register the header "Sync from source" button (preview + re-fetch the site favicon). Built-in
  // sites can't re-fetch, so `applyImage` is null for them.
  useImageTaxonomySyncRegistration({
    entityId: website.id,
    entityLabel: website.siteName ?? website.domain,
    sourceLabel: t("Website"),
    previewKind: "website",
    currentImageUrl: website.imageUrl ?? null,
    applyImage: website.builtIn
      ? null
      : () => ctrl.autoFavicon.mutate({
        id: website.id,
        sourceUrl: `https://${website.domain}`,
      }),
  });

  return (
    <WebsiteGeneralFormContext.Provider
      value={{
        ctrl,
      }}
    >
      {children}
    </WebsiteGeneralFormContext.Provider>
  );
}

export function useWebsiteGeneralFormContext(): WebsiteGeneralFormContextValue {
  const value = useContext(WebsiteGeneralFormContext);
  if (!value) {
    throw new Error("useWebsiteGeneralFormContext must be used within a WebsiteGeneralFormProvider");
  }
  return value;
}
