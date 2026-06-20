import type { PropertyFormApi, PropertyFormSection } from "./propertyFormSchema";
import type { Category, MediaType } from "@eesimple/types";

import { CollapsibleFormSection } from "./CollapsibleFormSection";
import {
  CategoryCheckboxList,
  MediaTypeCheckboxList,
  summarizeCategories,
  summarizeMediaTypes,
  toggleId,
} from "./propertyFormParts";

/**
 * The "Categories" scope section: choose which categories a property applies to, including the
 * "all categories" flag that opts new categories in. Operates on the shared form instance.
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
  return (
    <CollapsibleFormSection
      title="Categories"
      description="Choose which categories this property applies to."
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
      <form.Subscribe selector={state => state.values.allCategories}>
        {allCategories => (
          <form.AppField name="categoryIds">
            {field => (
              <CategoryCheckboxList
                categories={categories}
                selectedIds={field.state.value}
                allCategories={allCategories}
                onToggle={(id) => {
                  if (allCategories) {
                  // Toggling one category drops the "all categories" flag and falls back to an
                  // explicit list of every current category except the one just unchecked.
                    form.setFieldValue("allCategories", false);
                    field.handleChange(
                      categories.map(category => category.id).filter(categoryId => categoryId !== id),
                    );
                  }
                  else {
                    field.handleChange(toggleId(field.state.value, id));
                  }
                }}
                onToggleAll={(selectAll) => {
                // Select all also means "apply to categories created later" via the flag.
                  form.setFieldValue("allCategories", selectAll);
                  field.handleChange(selectAll ? categories.map(category => category.id) : []);
                }}
                idPrefix={idPrefix}
              />
            )}
          </form.AppField>
        )}
      </form.Subscribe>
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
  return (
    <CollapsibleFormSection
      title="Media Types"
      description="Also show this property on bookmarks of the chosen media types (in addition to its categories)."
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
