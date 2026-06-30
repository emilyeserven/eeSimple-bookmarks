import type { AutofillRule, MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { emptyConditionTree } from "@eesimple/types";
import { HttpResponse, http } from "msw";

import { AutofillRulePrefillForm } from "./AutofillRulePrefillForm";
import { apiHandlers, sampleMediaTypes } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const mediaTypeTree: MediaTypeNode[] = sampleMediaTypes.map(mediaType => ({
  ...mediaType,
  children: [],
}));

const rule: AutofillRule = {
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Tag recipe links",
  conditions: emptyConditionTree(),
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  tagIds: ["tag-cli"],
  locationIds: [],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  booleanValues: [],
  dateTimeValues: [],
  sortOrder: 3,
  createdAt: NOW,
};

const handlers = [
  ...apiHandlers,
  http.get("/api/media-types/tree", () => HttpResponse.json(mediaTypeTree)),
  http.get("/api/locations/tree", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/AutofillRulePrefillForm",
  component: AutofillRulePrefillForm,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof AutofillRulePrefillForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Prefill pickers with a category, media type, tag, and property value set. */
export const Default: Story = {};

/** A rule that prefills nothing yet (leaves everything unchanged). */
export const NothingSet: Story = {
  args: {
    rule: {
      ...rule,
      setCategoryId: null,
      setMediaTypeId: null,
      tagIds: [],
      numberValues: [],
    },
  },
};
