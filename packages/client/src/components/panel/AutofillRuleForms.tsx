import type { CreateAutofillRuleInput } from "@eesimple/types";

import { useTranslation } from "react-i18next";

import { usePanelControls } from "./usePanelControls";
import {
  useCreateAutofillRule,
} from "../../hooks/useAutofill";
import { useAutofillScopeDefaults } from "../../hooks/useAutofillScopeDefaults";
import { useCategories } from "../../hooks/useCategories";
import { useCustomProperties } from "../../hooks/useCustomProperties";
import { useMediaTypes } from "../../hooks/useMediaTypes";
import { useTagTree } from "../../hooks/useTags";
import { AutofillRuleForm } from "../AutofillRuleForm";

/** Create form: on success, re-target the panel at the saved rule so editing continues inline. */
export function CreateAutofillRule() {
  const {
    t,
  } = useTranslation();
  const {
    openAutofill,
  } = usePanelControls();
  const {
    data: categories,
  } = useCategories();
  const {
    data: properties,
  } = useCustomProperties();
  const {
    data: tagTree,
  } = useTagTree();
  const {
    data: mediaTypes,
  } = useMediaTypes();
  const createRule = useCreateAutofillRule();

  // When opened from a category's / website's / tag's / media type's / channel's autofill tab the
  // slug is still in the route path; preselect that entity so the new rule shows up in the scoped
  // list. Undefined on every other surface (e.g. /settings/autofill), leaving the defaults unchanged.
  const {
    categoryId: defaultCategoryId,
    propertyId: defaultPropertyId,
    websiteDomain: defaultWebsiteDomain,
    tagIds: defaultTagIds,
    mediaTypeId: defaultMediaTypeId,
    channelIds: defaultChannelIds,
    genreMoodIds: defaultGenreMoodIds,
  } = useAutofillScopeDefaults();

  async function handleCreate(input: CreateAutofillRuleInput) {
    const created = await createRule.mutateAsync(input);
    openAutofill(created.id);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">{t("New autofill rule")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Match a bookmark’s title or website to prefill its category, tags, and custom properties.")}
        </p>
      </div>
      <AutofillRuleForm
        categories={categories ?? []}
        mediaTypes={mediaTypes ?? []}
        properties={properties ?? []}
        tagTree={tagTree ?? []}
        defaultCategoryId={defaultCategoryId}
        defaultMediaTypeId={defaultMediaTypeId}
        defaultWebsiteDomain={defaultWebsiteDomain}
        defaultTagIds={defaultTagIds}
        defaultChannelIds={defaultChannelIds}
        defaultGenreMoodIds={defaultGenreMoodIds}
        defaultOpenCustomProperties={!!defaultPropertyId}
        submitLabel={t("Add rule")}
        isError={createRule.isError}
        errorMessage={createRule.error?.message}
        onSubmit={(input) => {
          void handleCreate(input);
        }}
      />
    </div>
  );
}
