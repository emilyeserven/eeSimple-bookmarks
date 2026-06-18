import type { AutofillRule } from "@eesimple/types";

import { useState } from "react";

import { propertyAppliesToCategory } from "@eesimple/types";

import { NO_CATEGORY, RulePropertyFields } from "./AutofillRuleForm";
import { AutofillRulePrefillPickers } from "./AutofillRulePrefillPickers";
import { useUpdateAutofillRule } from "../hooks/useAutofill";
import { useCategories } from "../hooks/useCategories";
import { useCustomProperties } from "../hooks/useCustomProperties";
import { useTagTree } from "../hooks/useTags";

import { Button } from "@/components/ui/button";

interface Props {
  rule: AutofillRule;
}

/** Edit an autofill rule's prefill actions: category, tags, and property values. */
export function AutofillRulePrefillForm({
  rule,
}: Props) {
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

  const initialCategoryId = rule.setCategoryId ?? NO_CATEGORY;
  const initialTagIds = rule.tagIds;
  const initialNumberInputs = Object.fromEntries(rule.numberValues.map(e => [e.propertyId, String(e.value)]));
  const initialBooleanInputs = Object.fromEntries(rule.booleanValues.map(e => [e.propertyId, e.value]));
  const initialDateTimeInputs = Object.fromEntries(rule.dateTimeValues.map(e => [e.propertyId, e.value]));

  const [setCategoryId, setSetCategoryId] = useState(initialCategoryId);
  const [tagIds, setTagIds] = useState<string[]>(initialTagIds);
  const [numberInputs, setNumberInputs] = useState<Record<string, string>>(initialNumberInputs);
  const [booleanInputs, setBooleanInputs] = useState<Record<string, boolean>>(initialBooleanInputs);
  const [dateTimeInputs, setDateTimeInputs] = useState<Record<string, string>>(initialDateTimeInputs);

  const isDirty
    = setCategoryId !== initialCategoryId
      || JSON.stringify(tagIds) !== JSON.stringify(initialTagIds)
      || JSON.stringify(numberInputs) !== JSON.stringify(initialNumberInputs)
      || JSON.stringify(booleanInputs) !== JSON.stringify(initialBooleanInputs)
      || JSON.stringify(dateTimeInputs) !== JSON.stringify(initialDateTimeInputs);

  function handleSave() {
    const categoryId = setCategoryId === NO_CATEGORY ? null : setCategoryId;
    const categoryProps = categoryId
      ? properties.filter(p => propertyAppliesToCategory(p, categoryId))
      : [];
    const numberValues = categoryProps
      .filter(p => p.type === "number")
      .map(p => ({
        propertyId: p.id,
        raw: numberInputs[p.id] ?? "",
      }))
      .filter(({
        raw,
      }) => raw.trim() !== "" && !Number.isNaN(Number(raw)))
      .map(({
        propertyId, raw,
      }) => ({
        propertyId,
        value: Number(raw),
      }));
    const booleanValues = categoryProps
      .filter(p => p.type === "boolean")
      .map(p => ({
        propertyId: p.id,
        value: booleanInputs[p.id] ?? false,
      }));
    const dateTimeValues = categoryProps
      .filter(p => p.type === "datetime")
      .map(p => ({
        propertyId: p.id,
        value: (dateTimeInputs[p.id] ?? "").trim(),
      }))
      .filter(e => e.value !== "");

    updateRule.mutate({
      id: rule.id,
      input: {
        setCategoryId: categoryId,
        tagIds,
        numberValues,
        booleanValues,
        dateTimeValues,
      },
    });
  }

  return (
    <div className="space-y-4">
      <AutofillRulePrefillPickers
        categories={categories}
        tagTree={tagTree}
        setCategoryId={setCategoryId}
        onCategoryChange={setSetCategoryId}
        tagIds={tagIds}
        onToggleTag={id =>
          setTagIds(current =>
            current.includes(id) ? current.filter(t => t !== id) : [...current, id])}
      />

      <RulePropertyFields
        categoryId={setCategoryId === NO_CATEGORY ? "" : setCategoryId}
        properties={properties}
        numberInputs={numberInputs}
        booleanInputs={booleanInputs}
        dateTimeInputs={dateTimeInputs}
        onNumberChange={(id, value) => setNumberInputs(cur => ({
          ...cur,
          [id]: value,
        }))}
        onBooleanChange={(id, value) => setBooleanInputs(cur => ({
          ...cur,
          [id]: value,
        }))}
        onDateTimeChange={(id, value) => setDateTimeInputs(cur => ({
          ...cur,
          [id]: value,
        }))}
      />

      <Button
        type="button"
        size="sm"
        disabled={!isDirty || updateRule.isPending}
        onClick={handleSave}
      >
        {updateRule.isPending ? "Saving…" : "Save changes"}
      </Button>
      {updateRule.isError
        ? <p className="text-sm text-destructive">{updateRule.error.message}</p>
        : null}
    </div>
  );
}
