import type {
  AutofillRule,
  ConditionTree,
  CreateAutofillRuleInput,
  CustomProperty,
} from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";
import { z } from "zod";

import { buildAutofillRuleDefaultValues, NO_MEDIA_TYPE } from "./autofillRuleForm";
import { useLocationTree } from "../hooks/useLocations";
import { seedConditions } from "../lib/autofillPrefill";
import { NO_CATEGORY } from "../lib/autofillScope";
import { autofillConditionsValidator } from "../lib/conditionsSchema";
import { useAppForm } from "../lib/form";
import { buildNumberValuesFromInputs } from "../lib/propertyValues";

const ruleSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string(),
  setCategoryId: z.string(),
  setMediaTypeId: z.string(),
  tagIds: z.array(z.string()),
  locationIds: z.array(z.string()),
  sortOrder: z.number().int(),
});

interface UseAutofillRuleFormArgs {
  rule?: AutofillRule;
  properties: CustomProperty[];
  defaultCategoryId?: string;
  defaultMediaTypeId?: string;
  defaultTagIds?: string[];
  defaultLocationIds?: string[];
  defaultWebsiteDomain?: string;
  defaultChannelIds?: string[];
  resetOnSubmit?: boolean;
  onSubmit: (input: CreateAutofillRuleInput) => void;
}

/**
 * Owns the autofill rule form's state and submit logic: the typed form, the out-of-form condition
 * tree + custom-property value inputs, the location tree query, and the submit handler that maps the
 * sentinel values + property inputs to a `CreateAutofillRuleInput`. Returns one bag so
 * `AutofillRuleForm` stays a presentational shell.
 */
export function useAutofillRuleForm({
  rule, properties, defaultCategoryId, defaultMediaTypeId, defaultTagIds, defaultLocationIds, defaultWebsiteDomain, defaultChannelIds, resetOnSubmit, onSubmit,
}: UseAutofillRuleFormArgs) {
  const {
    data: locationTree = [],
  } = useLocationTree();
  // The condition tree and custom-property values live outside the typed form (they're dynamic and,
  // for the recursive tree, would blow up TanStack Form's deep type inference). A new rule created
  // from a website's or channel's page is seeded with that entity as its "when".
  const [conditions, setConditions] = useState<ConditionTree>(
    rule?.conditions ?? seedConditions({
      websiteDomain: defaultWebsiteDomain,
      channelIds: defaultChannelIds,
      categoryId: defaultCategoryId,
      mediaTypeId: defaultMediaTypeId,
    }),
  );
  const [conditionsError, setConditionsError] = useState<string | null>(null);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.numberValues ?? []).map(entry => [entry.propertyId, String(entry.value)])));
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries((rule?.booleanValues ?? []).map(entry => [entry.propertyId, entry.value])));
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries((rule?.dateTimeValues ?? []).map(entry => [entry.propertyId, entry.value])));

  const form = useAppForm({
    defaultValues: buildAutofillRuleDefaultValues(rule, {
      defaultCategoryId,
      defaultMediaTypeId,
      defaultTagIds,
      defaultLocationIds,
    }),
    validators: {
      onChange: ruleSchema,
    },
    onSubmit: ({
      value,
    }) => {
      const parsedConditions = autofillConditionsValidator.safeParse(conditions);
      if (!parsedConditions.success) {
        setConditionsError(parsedConditions.error.issues.map(issue => issue.message).join(" "));
        return;
      }
      setConditionsError(null);

      const categoryId = value.setCategoryId === NO_CATEGORY ? null : value.setCategoryId;
      const mediaTypeId = value.setMediaTypeId === NO_MEDIA_TYPE ? null : value.setMediaTypeId;
      // Only persist property values for properties assigned to the rule's category.
      const categoryProps = categoryId
        ? properties.filter(property => propertyAppliesToCategory(property, categoryId))
        : [];
      const numberValues = buildNumberValuesFromInputs(categoryProps, numberInputs);
      const booleanValues = categoryProps
        .filter(property => property.type === "boolean")
        .map(property => ({
          propertyId: property.id,
          value: booleanInputs[property.id] ?? false,
        }));
      const dateTimeValues = categoryProps
        .filter(property => property.type === "datetime")
        .map(property => ({
          propertyId: property.id,
          value: (dateTimeInputs[property.id] ?? "").trim(),
        }))
        .filter(entry => entry.value !== "");

      onSubmit({
        name: value.name.trim(),
        description: value.description.trim() || null,
        conditions,
        setCategoryId: categoryId,
        setMediaTypeId: mediaTypeId,
        tagIds: value.tagIds,
        locationIds: value.locationIds,
        numberValues,
        booleanValues,
        dateTimeValues,
        sortOrder: value.sortOrder,
      });

      if (resetOnSubmit) {
        form.reset();
        setConditions(seedConditions({
          websiteDomain: defaultWebsiteDomain,
          channelIds: defaultChannelIds,
          categoryId: defaultCategoryId,
          mediaTypeId: defaultMediaTypeId,
        }));
        setConditionsError(null);
        setNumberInputs({});
        setBooleanInputs({});
        setDateTimeInputs({});
      }
    },
  });

  return {
    form,
    locationTree,
    conditions,
    setConditions,
    conditionsError,
    setConditionsError,
    numberInputs,
    setNumberInputs,
    booleanInputs,
    setBooleanInputs,
    dateTimeInputs,
    setDateTimeInputs,
  };
}
