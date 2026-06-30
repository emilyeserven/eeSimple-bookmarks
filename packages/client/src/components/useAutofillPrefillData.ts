import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useLocationTree } from "../hooks/useLocations";
import { useMediaTypeTree } from "../hooks/useMediaTypes";
import { useTagTree } from "../hooks/useTags";

/**
 * The taxonomy queries and update mutation the autofill prefill (edit) form needs, returned with
 * defaults applied. Split out of `AutofillRulePrefillForm` so the component stays under the
 * import-dependency cap.
 */
export function useAutofillPrefillData() {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: tagTree = [],
  } = useTagTree();
  const {
    data: mediaTypeTree = [],
  } = useMediaTypeTree();
  const {
    data: locationTree = [],
  } = useLocationTree();
  const updateRule = useUpdateAutofillRule();

  return {
    categories,
    properties,
    tagTree,
    mediaTypeTree,
    locationTree,
    updateRule,
  };
}
