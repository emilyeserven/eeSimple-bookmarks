import type { Category, CustomProperty, PropertyCondition } from "@eesimple/types";

import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PropertyConditionRow } from "./propertyConditionRows";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface PropertyConditionEditorProps {
  value: PropertyCondition[];
  properties: CustomProperty[];
  categories: Category[];
  selectedCategoryIds: string[];
  onChange: (next: PropertyCondition[]) => void;
}

/** Custom-property conditions as a flat list, with a collapsible "Other Properties" section for properties not assigned to the active category filter. */
export function PropertyConditionEditor({
  value, properties, categories, selectedCategoryIds, onChange,
}: PropertyConditionEditorProps) {
  const {
    t,
  } = useTranslation();
  const byId = new Map(value.map(condition => [condition.propertyId, condition]));

  function setCondition(propertyId: string, condition: PropertyCondition | null) {
    const others = value.filter(current => current.propertyId !== propertyId);
    onChange(condition ? [...others, condition] : others);
  }

  function isPropertyActive(property: CustomProperty): boolean {
    if (!selectedCategoryIds.length) return true;
    if (property.allCategories || property.categoryIds.length === 0) return true;
    return property.categoryIds.some(id => selectedCategoryIds.includes(id));
  }

  const enabledProperties = properties.filter(p => p.enabled);
  const activeProperties = enabledProperties.filter(isPropertyActive);
  const categoryInactiveProperties = enabledProperties.filter(p => !isPropertyActive(p));

  if (enabledProperties.length === 0) {
    return <p className="text-xs text-muted-foreground">{t("No custom properties yet.")}</p>;
  }

  function renderConditionRows(props: typeof activeProperties) {
    return (
      <div className="space-y-2">
        {props.map(property => (
          <PropertyConditionRow
            key={property.id}
            property={property}
            condition={byId.get(property.id)}
            categories={categories}
            onChange={condition => setCondition(property.id, condition)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeProperties.length > 0 ? renderConditionRows(activeProperties) : null}

      {categoryInactiveProperties.length > 0
        ? (
          <Collapsible className="group/disabled">
            <CollapsibleTrigger
              className="
                flex w-full items-center gap-1.5 text-xs text-muted-foreground
                hover:text-foreground
              "
            >
              <ChevronDown
                className="
                  size-3 shrink-0 transition-transform
                  group-data-[state=open]/disabled:rotate-180
                "
              />
              {t("Other Properties")}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">
                {t("These properties are not assigned to the selected categories and are unlikely to affect the results.")}
              </p>
              {renderConditionRows(categoryInactiveProperties)}
            </CollapsibleContent>
          </Collapsible>
        )
        : null}
    </div>
  );
}
