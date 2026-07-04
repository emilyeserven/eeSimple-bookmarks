import type { BookmarkFormApi, CustomPropertyInputs } from "./bookmarkFormSchema";
import type {
  AutofillRule,
  Bookmark,
  BookmarkBooleanValue,
  BookmarkDateTimeValue,
  BookmarkNumberValue,
  Category,
} from "@eesimple/types";

import { useEffect, useRef } from "react";

import { computeAutofill } from "./bookmarkFormSchema";
import { useSeededPropertyInputs } from "./useSeededPropertyInputs";
import { mergeAutofillIds } from "../lib/autofillPrefill";

interface UseBookmarkPropertyPrefillArgs {
  /** When editing, the bookmark whose stored values seed the inputs. */
  bookmark?: Bookmark;
  /** The live form instance, read/written for the URL/title/category/tag fields. */
  form: BookmarkFormApi;
  /** Autofill rules evaluated against the current URL/title. */
  autofillRules: AutofillRule[] | undefined;
  /** Categories, used to default the category once they load. */
  categories: Category[] | undefined;
}

/** Everything the bookmark form needs to drive custom-property prefill. */
export interface BookmarkPropertyPrefill {
  numberInputs: Record<string, string>;
  booleanInputs: Record<string, boolean>;
  dateTimeInputs: Record<string, string>;
  choicesInputs: Record<string, string[]>;
  progressInputs: Record<string, { current: string;
    total: string; }>;
  sectionsInputs: Record<string, { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }>;
  textInputs: Record<string, string>;
  /** Mirror of the current inputs; read by the submit handler (stale-closure-safe). */
  customRef: React.MutableRefObject<CustomPropertyInputs>;
  handleNumberChange: (id: string, value: string) => void;
  handleBooleanChange: (id: string, value: boolean) => void;
  handleDateTimeChange: (id: string, value: string) => void;
  handleChoicesChange: (id: string, values: string[]) => void;
  handleProgressChange: (id: string, field: "current" | "total", value: string) => void;
  handleSectionsChange: (id: string, value: { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }) => void;
  handleTextChange: (id: string, value: string) => void;
  /** Run the autofill rules against the current URL/Title and prefill the form. */
  runAutofill: () => void;
  /** Apply a category's default property values (rules and user edits win). */
  applyCategoryDefaults: (
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ) => void;
  /** Mark the tags field as user-touched so autofill won't union into it again. */
  markTagsTouched: () => void;
  /** Reset all prefill state and precedence tracking (used by the form's Reset). */
  resetPrefill: () => void;
}

/**
 * Owns the bookmark form's custom-property prefill: the number/boolean/datetime input maps and the
 * precedence machinery that decides whether autofill rules or a category's defaults may write into
 * them. Precedence is user input > autofill rule > category default — tracked via three refs:
 * `touchedRef` (fields the user edited), `ruleSetRef` (property ids an autofill rule most recently
 * set, so category defaults don't clobber them), and `lastAutoCategoryRef` (the category set
 * programmatically, so a manual pick is never overwritten). Editing seeds the inputs from the
 * bookmark's existing values; calculate results are ignored on submit.
 */
export function useBookmarkPropertyPrefill({
  bookmark,
  form,
  autofillRules,
  categories,
}: UseBookmarkPropertyPrefillArgs): BookmarkPropertyPrefill {
  // Custom-property values live outside the typed form (they're dynamic). The shared hook owns the
  // seeded input maps + the submit-time ref mirror; this hook layers prefill precedence on top.
  const {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    setNumberInputs,
    setBooleanInputs,
    setDateTimeInputs,
    setChoicesInputs,
    setProgressInputs,
    setSectionsInputs,
    setTextInputs,
    customRef,
  } = useSeededPropertyInputs(bookmark);

  // Precedence when prefilling: user input > autofill rule > category default.
  // `touchedRef` tracks fields the user edited; `ruleSetRef` tracks property ids an autofill rule
  // most recently set (so category defaults don't clobber them); `lastAutoCategoryRef` holds the
  // category we set programmatically so a user's manual pick is never overwritten.
  const touchedRef = useRef<Set<string>>(new Set());
  const ruleSetRef = useRef<{ numbers: Set<string>;
    booleans: Set<string>;
    dateTimes: Set<string>; }>({
    numbers: new Set(),
    booleans: new Set(),
    dateTimes: new Set(),
  });
  const lastAutoCategoryRef = useRef<string>("");

  // Run the autofill rules against the current URL/Title and prefill the form, never overwriting
  // a value the user has already touched. Called when the URL or Title field loses focus.
  function runAutofill(): void {
    const url = form.getFieldValue("url");
    const title = form.getFieldValue("title");
    if (!url && !title) return;

    const result = computeAutofill({
      url,
      title,
    }, autofillRules ?? []);

    if (result.categoryId) {
      const current = form.getFieldValue("categoryId");
      if (current === "" || current === lastAutoCategoryRef.current) {
        lastAutoCategoryRef.current = result.categoryId;
        form.setFieldValue("categoryId", result.categoryId);
      }
    }

    const mergedTagIds = mergeAutofillIds(
      result.tagIds,
      form.getFieldValue("tagIds"),
      touchedRef.current.has("tags"),
    );
    if (mergedTagIds) form.setFieldValue("tagIds", mergedTagIds);

    const mergedLocationIds = mergeAutofillIds(
      result.locationIds,
      form.getFieldValue("locationIds"),
      touchedRef.current.has("locations"),
    );
    if (mergedLocationIds) form.setFieldValue("locationIds", mergedLocationIds);

    ruleSetRef.current = {
      numbers: new Set(result.numberValues.map(entry => entry.propertyId)),
      booleans: new Set(result.booleanValues.map(entry => entry.propertyId)),
      dateTimes: new Set(result.dateTimeValues.map(entry => entry.propertyId)),
    };
    if (result.numberValues.length > 0) {
      setNumberInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.numberValues) {
          if (!touchedRef.current.has(`number:${entry.propertyId}`)) {
            next[entry.propertyId] = String(entry.value);
          }
        }
        return next;
      });
    }
    if (result.booleanValues.length > 0) {
      setBooleanInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.booleanValues) {
          if (!touchedRef.current.has(`boolean:${entry.propertyId}`)) {
            next[entry.propertyId] = entry.value;
          }
        }
        return next;
      });
    }
    if (result.dateTimeValues.length > 0) {
      setDateTimeInputs((current) => {
        const next = {
          ...current,
        };
        for (const entry of result.dateTimeValues) {
          if (!touchedRef.current.has(`datetime:${entry.propertyId}`)) {
            next[entry.propertyId] = entry.value;
          }
        }
        return next;
      });
    }
  }

  // Apply a category's default property values, skipping anything the user touched or an autofill
  // rule already set (rules win over defaults), and never overwriting a non-empty number input.
  function applyCategoryDefaults(
    numberValues: BookmarkNumberValue[],
    booleanValues: BookmarkBooleanValue[],
    dateTimeValues: BookmarkDateTimeValue[],
  ): void {
    setNumberInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of numberValues) {
        const existing = next[entry.propertyId];
        if (
          !touchedRef.current.has(`number:${entry.propertyId}`)
          && !ruleSetRef.current.numbers.has(entry.propertyId)
          && (existing === undefined || existing === "")
        ) {
          next[entry.propertyId] = String(entry.value);
        }
      }
      return next;
    });
    setBooleanInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of booleanValues) {
        if (
          !touchedRef.current.has(`boolean:${entry.propertyId}`)
          && !ruleSetRef.current.booleans.has(entry.propertyId)
        ) {
          next[entry.propertyId] = entry.value;
        }
      }
      return next;
    });
    setDateTimeInputs((current) => {
      const next = {
        ...current,
      };
      for (const entry of dateTimeValues) {
        const existing = next[entry.propertyId];
        if (
          !touchedRef.current.has(`datetime:${entry.propertyId}`)
          && !ruleSetRef.current.dateTimes.has(entry.propertyId)
          && (existing === undefined || existing === "")
        ) {
          next[entry.propertyId] = entry.value;
        }
      }
      return next;
    });
  }

  // Custom-property change handlers, shared by the main-form and Advanced field groups. Marking the
  // field touched stops autofill/category-defaults from later overwriting the user's entry.
  function handleNumberChange(id: string, value: string): void {
    touchedRef.current.add(`number:${id}`);
    setNumberInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleBooleanChange(id: string, value: boolean): void {
    touchedRef.current.add(`boolean:${id}`);
    setBooleanInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleDateTimeChange(id: string, value: string): void {
    touchedRef.current.add(`datetime:${id}`);
    setDateTimeInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleChoicesChange(id: string, values: string[]): void {
    touchedRef.current.add(`choices:${id}`);
    setChoicesInputs(current => ({
      ...current,
      [id]: values,
    }));
  }
  function handleProgressChange(id: string, field: "current" | "total", value: string): void {
    touchedRef.current.add(`progress:${id}`);
    setProgressInputs(current => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          current: "",
          total: "",
        }),
        [field]: value,
      },
    }));
  }
  function handleSectionsChange(id: string, value: { exhaustive: boolean;
    sections: import("@eesimple/types").SectionEntry[]; }): void {
    setSectionsInputs(current => ({
      ...current,
      [id]: value,
    }));
  }
  function handleTextChange(id: string, value: string): void {
    touchedRef.current.add(`text:${id}`);
    setTextInputs(current => ({
      ...current,
      [id]: value,
    }));
  }

  function markTagsTouched(): void {
    touchedRef.current.add("tags");
  }

  function resetPrefill(): void {
    setNumberInputs({});
    setBooleanInputs({});
    setDateTimeInputs({});
    setChoicesInputs({});
    setProgressInputs({});
    setTextInputs({});
    touchedRef.current = new Set();
    ruleSetRef.current = {
      numbers: new Set(),
      booleans: new Set(),
      dateTimes: new Set(),
    };
    lastAutoCategoryRef.current = "";
  }

  // Default the category to the built-in "Default" once categories load.
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    if (form.getFieldValue("categoryId")) return;
    const fallback = categories.find(category => category.builtIn) ?? categories[0];
    lastAutoCategoryRef.current = fallback.id;
    form.setFieldValue("categoryId", fallback.id);
  }, [categories, form]);

  return {
    numberInputs,
    booleanInputs,
    dateTimeInputs,
    choicesInputs,
    progressInputs,
    sectionsInputs,
    textInputs,
    customRef,
    handleNumberChange,
    handleBooleanChange,
    handleDateTimeChange,
    handleChoicesChange,
    handleProgressChange,
    handleSectionsChange,
    handleTextChange,
    runAutofill,
    applyCategoryDefaults,
    markTagsTouched,
    resetPrefill,
  };
}
