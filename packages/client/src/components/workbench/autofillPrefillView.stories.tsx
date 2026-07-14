import type { AutofillRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AutofillPrefillCategoryView,
  AutofillPrefillLocationsView,
  AutofillPrefillMediaTypeView,
  AutofillPrefillPropertiesView,
  AutofillPrefillTagsView,
} from "./autofillPrefillView";
import { makeAutofillRule } from "../../test-utils/factories";
import { apiHandlers } from "../../test-utils/story-mocks";

/** The five granular prefill view fields (#1197) stacked, as the layout renders them together. */
function PrefillView({
  entity,
}: { entity: AutofillRule }) {
  return (
    <div className="space-y-6">
      <AutofillPrefillCategoryView entity={entity} />
      <AutofillPrefillMediaTypeView entity={entity} />
      <AutofillPrefillTagsView entity={entity} />
      <AutofillPrefillLocationsView entity={entity} />
      <AutofillPrefillPropertiesView entity={entity} />
    </div>
  );
}

const rule = makeAutofillRule({
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links.",
  conditions: {
    type: "group",
    combinator: "and",
    children: [
      {
        type: "match",
        field: "url",
        operator: "domain",
        pattern: "101cookbooks.com",
      },
    ],
  },
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  sortOrder: 3,
});

const meta = {
  title: "Components/Workbench/AutofillPrefillView",
  component: PrefillView,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof PrefillView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    entity: rule,
  },
};

export const NothingSet: Story = {
  args: {
    entity: {
      ...rule,
      setCategoryId: null,
      setMediaTypeId: null,
      numberValues: [],
    },
  },
};
