// Single barrel of the building blocks `PropertyForm` assembles — the schema/value mappers, the
// extracted Display-options section, the category/operand checkbox lists, and the shared form
// constants/helpers — so the form keeps a lean top-level import surface.
export { PropertyDisplaySection } from "./PropertyDisplaySection";
export { CategoryCheckboxList, MediaTypeCheckboxList, OperandCheckboxList } from "./PropertyFormFields";
export {
  CREATE_DEFAULTS,
  payloadFromValues,
  type PropertyFormValues,
  propertySchema,
  valuesFromProperty,
} from "./propertyFormSchema";
export {
  BOOLEAN_LABEL_PRESET_OPTIONS,
  DATE_TIME_FORMAT_OPTIONS,
  summarizeBooleanOptions,
  summarizeCategories,
  summarizeMediaTypes,
  summarizeNumberOptions,
  toggleId,
  TYPE_OPTIONS,
} from "../lib/propertyForm";
