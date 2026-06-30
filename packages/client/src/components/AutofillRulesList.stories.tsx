import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { AutofillRulesList } from "./AutofillRulesList";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const sampleRules = [
  {
    id: "rule-github",
    name: "GitHub → Workflow",
    slug: "github-workflow",
    conditions: {
      type: "group",
      combinator: "and",
      children: [{
        type: "website",
        domains: ["github.com"],
      }],
    },
    setCategoryId: "cat-workflow",
    setMediaTypeId: null,
    setTagIds: [],
    setLocationIds: [],
    setNumberValues: [],
    setBooleanValues: [],
    setDateTimeValues: [],
    sortOrder: 0,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/AutofillRulesList",
  component: AutofillRulesList,
  args: {
    query: "",
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/autofill-rules", () => HttpResponse.json(sampleRules)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof AutofillRulesList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/autofill-rules", () => HttpResponse.json([])),
        ...apiHandlers,
      ],
    },
  },
};

export const NoMatches: Story = {
  args: {
    query: "nothing-matches-this",
  },
};
