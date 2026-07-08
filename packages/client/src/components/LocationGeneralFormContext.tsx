/* eslint-disable react-refresh/only-export-components -- this file pairs the provider component with
   its `useLocationGeneralFormContext` reader hook + the shared value type, the standard React context
   module shape */
import type { useLocationGeneralForm } from "./useLocationGeneralForm";
import type { usePrimaryLanguageField } from "../hooks/usePrimaryLanguageField";
import type { LocationNode } from "@eesimple/types";
import type { ReactNode } from "react";

import { createContext, useContext } from "react";

import { useLocationGeneralForm as useLocationGeneralFormHook } from "./useLocationGeneralForm";
import { useLocationSyncRegistration } from "../hooks/useLocationSyncRegistration";
import { usePrimaryLanguageField as usePrimaryLanguageFieldHook } from "../hooks/usePrimaryLanguageField";

/**
 * Shares the **one** `useLocationGeneralForm` controller across the location General tab's now-granular
 * edit fields (#1191 field extraction). The layout render seam (`LayoutDrivenTabBody`) invokes each
 * field's `edit` renderer as a plain call, so N independent field components would each spin up N
 * separate `useAppForm` instances and lose the form's cross-field coordination (name-blur primary-
 * language sync, geocode lookup → coordinates/place-type, force re-geocode, Wikidata source flag).
 * Instead the shared controller — plus the react-query-backed primary-language field and the header
 * "Sync from source" re-geocode registration — is instantiated **once** here and read by every
 * granular edit field via {@link useLocationGeneralFormContext}. View fields need no context (they read
 * the entity directly).
 *
 * Mounted by the generic `EntityEditView` seam (`EditFormProvider` + `sharedFormFieldKeys` on the
 * workbench descriptor) around the edit body only when the active tab hosts a shared-form field, so the
 * controller + sync registration keep mounting exactly where `LocationGeneralForm` used to (the General
 * tab by default), while staying correct if an operator relocates the fields via Page Layouts. This is
 * the reusable pattern for extracting a shared-`useAppForm` composite — see the `surface-entity-field`
 * skill ("Extraction (reverse direction)").
 */
export interface LocationGeneralFormContextValue {
  ctrl: ReturnType<typeof useLocationGeneralForm>;
  primaryLanguage: ReturnType<typeof usePrimaryLanguageField>;
}

const LocationGeneralFormContext = createContext<LocationGeneralFormContextValue | null>(null);

export function LocationGeneralFormProvider({
  node,
  children,
}: {
  node: LocationNode;
  children: ReactNode;
}) {
  const ctrl = useLocationGeneralFormHook(node);
  const primaryLanguage = usePrimaryLanguageFieldHook("location", node.id);

  // Register the header "Sync from source" button for this location (re-geocode). Selected fields
  // stage through the same per-field auto-save the form's fields use; the re-geocode toggle runs the
  // form's force `repullCoordinates`.
  useLocationSyncRegistration({
    node,
    form: ctrl.form,
    saveField: ctrl.saveField,
    repullCoordinates: ctrl.repullCoordinates,
    usesWikidataCoordinates: ctrl.usesWikidataCoordinates,
  });

  return (
    <LocationGeneralFormContext.Provider
      value={{
        ctrl,
        primaryLanguage,
      }}
    >
      {children}
    </LocationGeneralFormContext.Provider>
  );
}

export function useLocationGeneralFormContext(): LocationGeneralFormContextValue {
  const value = useContext(LocationGeneralFormContext);
  if (!value) {
    throw new Error("useLocationGeneralFormContext must be used within a LocationGeneralFormProvider");
  }
  return value;
}
