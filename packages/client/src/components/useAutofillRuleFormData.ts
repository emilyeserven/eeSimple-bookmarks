import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

/**
 * Bundles the queries and the update mutation shared by the autofill rule edit forms
 * (conditions and prefill), so each form needs a single hook import.
 */
export function useAutofillRuleFormData() {
  const {
    data: categories = [],
  } = useCategories();
  const {
    data: properties = [],
  } = useCustomProperties();
  const {
    data: tagTree = [],
  } = useTagTree();
  const updateRule = useUpdateAutofillRule();

  return {
    categories,
    properties,
    tagTree,
    updateRule,
  };
}
