import type { BookmarkFormApi, CustomPropertyInputs } from "../components/bookmarkFormSchema";
import type { BookmarkAddFormSettings, CustomProperty } from "@eesimple/types";

import { useMemo } from "react";

import { applyAdvancedRules } from "@eesimple/types";
import { useStore } from "@tanstack/react-form";

import { useBookmarkAddFormConfig } from "./useAppSettings";
import { useConditionEvaluateOptions } from "./useConditionEvaluateOptions";
import { formStateToConditionInput } from "../lib/bookmarkFormConditionInput";

/**
 * The create-form config with its Advanced Rules resolved against the *live* form state. Subscribes to
 * the form fields a condition can match on, projects them to a `ConditionInput`, and overlays every
 * matching rule's placement overrides on top of the saved settings (via `applyAdvancedRules`). The
 * result is fed straight into {@link useBookmarkAddFormVisibility}.
 *
 * Fast paths that skip all of this: edit mode (the resolver ignores the config anyway) and a settings
 * row with no advanced rules — both return the saved config unchanged, so the common case pays
 * nothing. Only when rules exist does a keystroke re-run the (cheap) projection + evaluation.
 */
export function useBookmarkAddFormEffectiveConfig(
  form: BookmarkFormApi,
  inputs: CustomPropertyInputs,
  customProperties: CustomProperty[],
  isEdit: boolean,
): BookmarkAddFormSettings {
  const config = useBookmarkAddFormConfig();
  const evaluateOptions = useConditionEvaluateOptions();
  const active = !isEdit && config.advancedRules.length > 0;
  // Subscribe to the whole values object so any relevant field change re-evaluates the rules. When no
  // rules are active this is still cheap — the memo below short-circuits before touching `values`.
  const values = useStore(form.store, s => s.values);

  return useMemo(() => {
    if (!active) return config;
    const input = formStateToConditionInput(
      {
        url: values.url,
        title: values.title,
        names: values.names.map(n => n.value),
        categoryId: values.categoryId,
        mediaTypeId: values.mediaTypeId,
        youtubeChannelId: values.youtubeChannelId,
        tagIds: values.tagIds,
        locationIds: values.locationIds,
        genreMoodIds: values.genreMoodIds,
      },
      inputs,
      customProperties,
    );
    return applyAdvancedRules(config, input, evaluateOptions);
  }, [active, config, values, inputs, customProperties, evaluateOptions]);
}
