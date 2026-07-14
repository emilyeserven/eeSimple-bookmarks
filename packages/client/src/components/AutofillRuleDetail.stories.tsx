import type { Tag } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AutofillConditionsFields,
  AutofillGeneralFields,
  AutofillPrefillFields,
} from "./AutofillRuleDetail";
import { makeAutofillRule, makeLocation, makeTag } from "../test-utils/factories";
import { sampleCategories, sampleMediaTypes, sampleProperties } from "../test-utils/story-mocks";

const tags: Tag[] = [
  makeTag({
    id: "tag-cli",
    name: "cli",
    slug: "cli",
    parentId: "tag-tools",
  }),
];

const locations = [makeLocation({
  id: "loc-sf",
  name: "San Francisco",
  slug: "san-francisco",
})];

const rule = makeAutofillRule({
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Auto-tag recipe links from 101 Cookbooks.",
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
      {
        type: "category",
        categoryIds: ["cat-workflow"],
      },
    ],
  },
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  tagIds: ["tag-cli"],
  locationIds: ["loc-sf"],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  sortOrder: 3,
});

const meta = {
  title: "Components/AutofillRuleDetail",
  component: AutofillGeneralFields,
} satisfies Meta<typeof AutofillGeneralFields>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The General view tab: description and metadata. */
export const General: Story = {
  args: {
    rule,
  },
};

/** A rule with no description. */
export const GeneralNoDescription: Story = {
  args: {
    rule: {
      ...rule,
      description: null,
    },
  },
};

/** The Conditions view tab: a detailed breakdown of the match tree. */
export const Conditions: StoryObj = {
  render: () => (
    <AutofillConditionsFields
      rule={rule}
      categories={sampleCategories}
      tags={tags}
      properties={sampleProperties}
      locations={locations}
    />
  ),
};

/** The Prefill view tab: what the rule sets on a matched bookmark. */
export const Prefill: StoryObj = {
  render: () => (
    <AutofillPrefillFields
      rule={rule}
      categories={sampleCategories}
      mediaTypes={sampleMediaTypes}
      tags={tags}
      properties={sampleProperties}
      locations={locations}
    />
  ),
};
