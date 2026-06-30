import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AutofillRuleForm } from "./AutofillRuleForm";
import {
  apiHandlers,
  sampleCategories,
  sampleMediaTypes,
  sampleProperties,
  sampleTagTree,
} from "../test-utils/story-mocks";

const handlers = [
  ...apiHandlers,
  http.get("/api/locations/tree", () => HttpResponse.json([])),
];

const meta = {
  title: "Components/AutofillRuleForm",
  component: AutofillRuleForm,
  parameters: {
    msw: {
      handlers,
    },
  },
  args: {
    categories: sampleCategories,
    mediaTypes: sampleMediaTypes,
    properties: sampleProperties,
    tagTree: sampleTagTree,
    submitLabel: "Create rule",
    onSubmit: () => {},
  },
} satisfies Meta<typeof AutofillRuleForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The create form: empty fields with the "when" and "then" sections expanded. */
export const Create: Story = {};

/** Pre-selected target category for a rule created from a category's page. */
export const WithDefaults: Story = {
  args: {
    defaultCategoryId: "cat-workflow",
    defaultMediaTypeId: "media-article",
  },
};

/** Submit error feedback. */
export const WithError: Story = {
  args: {
    isError: true,
    errorMessage: "A rule with that name already exists.",
  },
};
