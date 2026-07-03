import type { useLocationGeneralForm } from "../components/useLocationGeneralForm";
import type { LocationSyncField } from "../lib/syncSources/locationDiff";
import type { SyncFieldDiff, SyncProvider } from "../lib/syncSources/syncSourceTypes";
import type { LocationNode } from "@eesimple/types";

import { useCallback, useMemo, useRef } from "react";

import { useRegisterSyncProvider } from "./useRegisterSyncProvider";
import { LOCATION_COORD_FIELDS } from "../lib/syncSources/locationDiff";

type LocationForm = ReturnType<typeof useLocationGeneralForm>["form"];
type LocationSaveField = ReturnType<typeof useLocationGeneralForm>["saveField"];

/** The `{ field, value }` a location diff row carries in its `payload`. */
interface LocationSyncPayload {
  field: LocationSyncField;
  value: string | number;
}

/** Reflects one geocoded field into the form and persists it via the per-field auto-save (own toast). */
function applyLocationField(
  form: LocationForm,
  saveField: LocationSaveField,
  field: LocationSyncField,
  value: string | number,
): void {
  switch (field) {
    case "latitude": {
      const next = Number(value);
      form.setFieldValue("latitude", next);
      saveField("latitude", next);
      break;
    }
    case "longitude": {
      const next = Number(value);
      form.setFieldValue("longitude", next);
      saveField("longitude", next);
      break;
    }
    case "mapUrl": {
      const next = String(value);
      form.setFieldValue("mapUrl", next);
      saveField("mapUrl", next);
      break;
    }
    case "placeType": {
      const next = String(value);
      form.setFieldValue("placeType", next);
      saveField("placeType", next);
      break;
    }
    case "countryCode": {
      const next = String(value);
      form.setFieldValue("countryCode", next);
      saveField("countryCode", next);
      break;
    }
  }
}

interface LocationSyncRegistrationParams {
  node: LocationNode;
  form: LocationForm;
  saveField: LocationSaveField;
  /** The form's force re-geocode (overwrites lat/lon/mapUrl/boundary server-side and reflects). */
  repullCoordinates: () => void;
  usesWikidataCoordinates: boolean;
}

/**
 * Registers the location edit form's {@link SyncProvider} so the header Sync button can re-geocode.
 * `applyStaged` stages each selected field via the per-field auto-save (fill-empty by default); when
 * the re-geocode toggle is on it additionally runs the form's force `repullCoordinates` for the
 * coordinate/boundary rows (the only way to refresh the server-side GeoJSON boundary). Kept out of
 * `useLocationGeneralForm` so that hook's cognitive complexity doesn't rise.
 */
export function useLocationSyncRegistration({
  node, form, saveField, repullCoordinates, usesWikidataCoordinates,
}: LocationSyncRegistrationParams) {
  // Latest deps behind a ref so applyStaged (and thus the provider) stays referentially stable —
  // otherwise the register-on-mount effect would thrash the store every render.
  const ctxRef = useRef<LocationSyncRegistrationParams>({
    node,
    form,
    saveField,
    repullCoordinates,
    usesWikidataCoordinates,
  });
  ctxRef.current = {
    node,
    form,
    saveField,
    repullCoordinates,
    usesWikidataCoordinates,
  };

  const applyStaged = useCallback((selected: SyncFieldDiff[], opts: { regeocode: boolean }) => {
    const ctx = ctxRef.current;
    const forceCoords = opts.regeocode
      && selected.some(row => LOCATION_COORD_FIELDS.has(row.key as LocationSyncField));
    if (forceCoords) ctx.repullCoordinates();

    for (const row of selected) {
      const field = row.key as LocationSyncField;
      // The force re-geocode already handled the coordinate/map rows.
      if (forceCoords && LOCATION_COORD_FIELDS.has(field)) continue;
      const payload = row.payload as LocationSyncPayload | undefined;
      if (!payload) continue;
      applyLocationField(ctx.form, ctx.saveField, payload.field, payload.value);
    }
  }, []);

  const provider = useMemo<SyncProvider>(() => ({
    descriptorKind: "location",
    entityLabel: node.name,
    entityId: node.id,
    supportsRegeocode: true,
    refs: {
      name: node.name,
      source: usesWikidataCoordinates ? "wikidata" : null,
      currentLatitude: node.latitude,
      currentLongitude: node.longitude,
      currentMapUrl: node.mapUrl,
      currentPlaceType: node.placeType,
      currentCountryCode: node.countryCode,
    },
    applyStaged,
  }), [
    node.id, node.name, node.latitude, node.longitude, node.mapUrl, node.placeType,
    node.countryCode, usesWikidataCoordinates, applyStaged,
  ]);

  useRegisterSyncProvider(provider);
}
