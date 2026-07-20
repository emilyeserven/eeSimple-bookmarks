import type { PropertyFormApi, PropertyFormSection } from "./propertyFormSchema";
import type { Category, MediaType } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import {
  CategoryCheckboxList,
  MediaTypeCheckboxList,
  summarizeCategories,
  summarizeMediaTypes,
  toggleId,
} from "./propertyFormParts";

/**
 * The "Categories" scope section: choose which categories a property applies to. An empty selection
 * means "all categories" (see `propertyAppliesToCategory` in `@eesimple/types`), so the property is
 * global by default and needs no explicit "all categories" opt-in — you only scope it by checking
 * specific categories. Operates on the shared form instance.
 */
export function PropertyCategoriesSection({
  form,
  categories,
  idPrefix,
  mode,
  section,
}: {
  form: PropertyFormApi;
  categories: Category[];
  idPrefix: string;
  mode: "create" | "edit";
  section?: PropertyFormSection;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <CollapsibleFormSection
      title={t("Categories")}
      description={t("By default this property applies to all categories. Check specific categories to limit it to those.")}
      defaultOpen={mode === "create" || section === "categories"}
      preview={(
        <form.Subscribe
          selector={state => ({
            allCategories: state.values.allCategories,
            categoryIds: state.values.categoryIds,
          })}
        >
          {({
            allCategories, categoryIds,
          }) => summarizeCategories(allCategories, categoryIds)}
        </form.Subscribe>
      )}
    >
      <form.AppField name="categoryIds">
        {field => (
          <CategoryCheckboxList
            categories={categories}
            selectedIds={field.state.value}
            onToggle={(id) => {
              // Checking specific categories scopes the property to just those; clear any legacy
              // "all categories" flag so the explicit selection takes effect (empty selection = all).
              form.setFieldValue("allCategories", false);
              field.handleChange(toggleId(field.state.value, id));
            }}
            idPrefix={idPrefix}
          />
        )}
      </form.AppField>
    </CollapsibleFormSection>
  );
}

/**
 * The "Media Types" scope section: also surface a property on bookmarks of the chosen media types,
 * with the matching "all media types" flag. Operates on the shared form instance.
 */
export function PropertyMediaTypesSection({
  form,
  mediaTypes,
  idPrefix,
  section,
}: {
  form: PropertyFormApi;
  mediaTypes: MediaType[];
  idPrefix: string;
  section?: PropertyFormSection;
}) {
  const {
    t,
  } = useTranslation();

  return (
    <CollapsibleFormSection
      title={t("Media Types")}
      description={t("Also show this property on bookmarks of the chosen media types (in addition to its categories).")}
      defaultOpen={section === "media-types"}
      preview={(
        <form.Subscribe
          selector={state => ({
            allMediaTypes: state.values.allMediaTypes,
            mediaTypeIds: state.values.mediaTypeIds,
          })}
        >
          {({
            allMediaTypes, mediaTypeIds,
          }) => summarizeMediaTypes(allMediaTypes, mediaTypeIds)}
        </form.Subscribe>
      )}
    >
      <form.Subscribe selector={state => state.values.allMediaTypes}>
        {allMediaTypes => (
          <form.AppField name="mediaTypeIds">
            {field => (
              <MediaTypeCheckboxList
                mediaTypes={mediaTypes}
                selectedIds={field.state.value}
                allMediaTypes={allMediaTypes}
                onToggle={(id) => {
                  if (allMediaTypes) {
                    // Toggling one drops the "all media types" flag and falls back to an explicit
                    // list of every current media type except the one just unchecked.
                    form.setFieldValue("allMediaTypes", false);
                    field.handleChange(
                      mediaTypes.map(mt => mt.id).filter(mediaTypeId => mediaTypeId !== id),
                    );
                  }
                  else {
                    field.handleChange(toggleId(field.state.value, id));
                  }
                }}
                onToggleAll={(selectAll) => {
                  // Select all also means "apply to media types created later" via the flag.
                  form.setFieldValue("allMediaTypes", selectAll);
                  field.handleChange(selectAll ? mediaTypes.map(mt => mt.id) : []);
                }}
                idPrefix={`${idPrefix}-mt`}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>
    </CollapsibleFormSection>
  );
}
