import type { CustomPropertyInputs } from "./bookmarkFormSchema";
import type { Bookmark } from "@eesimple/types";
import type { Dispatch, MutableRefObject, SetStateAction } from "react";

import { useRef, useState } from "react";

/** The number/boolean/datetime/choices input maps plus a ref mirror, seeded from a bookmark's stored values. */
export interface SeededPropertyInputs {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  setNumberInputs: Dispatch<SetStateAction<Record<string, string>>>;
  setBooleanInputs: Dispatch<SetStateAction<Record<string, boolean>>>;
  setDateTimeInputs: Dispatch<SetStateAction<Record<string, string>>>;
  setChoicesInputs: Dispatch<SetStateAction<Record<string, string[]>>>;
  /** Mirror of the current inputs; read by submit handlers so they always see the latest entries. */
  customRef: MutableRefObject<CustomPropertyInputs>;
}

/**
 * Owns the bookmark form's dynamic custom-property inputs (number/boolean/datetime). They live
 * outside the typed form because they're keyed by property id, so a ref mirrors them for the submit
 * handler. When editing, the maps seed from the bookmark's existing values (calculate results are
 * ignored on submit). Shared by `useBookmarkPropertyPrefill` (which layers autofill/default
 * precedence on top) and `BookmarkPropertiesForm` (which uses the raw maps directly).
 */
export function useSeededPropertyInputs(bookmark?: Bookmark): SeededPropertyInputs {
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((bookmark?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((bookmark?.dateTimeValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [choicesInputs, setChoicesInputs] = useState<Record<string, string[]>>(() =>
    Object.fromEntries((bookmark?.choicesValues ?? []).map(entry => [entry.propertyId, entry.values])));

  const customRef = useRef<CustomPropertyInputs>({
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
  });
  customRef.current = {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
  };

  return {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    setNumberInputs,
    setBooleanInputs,
    setDateTimeInputs,
    setChoicesInputs,
    customRef,
  };
}
