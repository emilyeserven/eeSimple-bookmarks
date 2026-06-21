import { MultiCombobox } from "../MultiCombobox";

interface EntityMultiSelectConditionProps {
  /** Accessible label and placeholder noun, e.g. "Media Types". */
  ariaLabel: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyText: string;
  options: { value: string;
    label: string; }[];
  values: string[];
  onValuesChange: (ids: string[]) => void;
}

/**
 * Shared controlled multi-select for an "is one of …" condition leaf over a flat entity list.
 * Backs the Media Type and Relationship Type condition editors so they don't duplicate the markup.
 */
export function EntityMultiSelectCondition({
  ariaLabel, placeholder, searchPlaceholder, emptyText, options, values, onValuesChange,
}: EntityMultiSelectConditionProps) {
  return (
    <MultiCombobox
      aria-label={ariaLabel}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyText={emptyText}
      options={options}
      values={values}
      onValuesChange={onValuesChange}
    />
  );
}
