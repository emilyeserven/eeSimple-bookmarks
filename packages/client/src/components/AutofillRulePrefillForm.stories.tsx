import type { MediaTypeNode } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AutofillRulePrefillForm } from "./AutofillRulePrefillForm";
import { makeAutofillRule } from "../test-utils/factories";
import { apiHandlers, sampleMediaTypes } from "../test-utils/story-mocks";

const mediaTypeTree: MediaTypeNode[] = sampleMediaTypes.map(mediaType => ({
  ...mediaType,
  children: [],
}));

const rule = makeAutofillRule({
  id: "rule-recipes",
  name: "Recipes",
  slug: "recipes",
  description: "Tag recipe links",
  setCategoryId: "cat-workflow",
  setMediaTypeId: "media-article",
  tagIds: ["tag-cli"],
  numberValues: [
    {
      propertyId: "prop-priority",
      value: 8,
    },
  ],
  sortOrder: 3,
});

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
