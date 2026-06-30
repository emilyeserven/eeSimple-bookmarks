import type { ImportRule } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { HttpResponse, http } from "msw";

import { ImportRulesList } from "./ImportRulesList";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const sampleRules: ImportRule[] = [
  {
    id: "rule-block-social",
    name: "Block social media",
    slug: "block-social-media",
    description: null,
    conditions: {
      type: "group",
      combinator: "and",
      children: [{
        type: "website",
        domains: ["twitter.com"],
      }],
    },
    action: "reject",
    sortOrder: 0,
    createdAt: NOW,
  },
  {
    id: "rule-approve-recipes",
    name: "Auto-approve recipes",
    slug: "auto-approve-recipes",
    description: null,
    conditions: {
      type: "group",
      combinator: "and",
      children: [{
        type: "website",
        domains: ["101cookbooks.com"],
      }],
    },
    action: "approve",
    sortOrder: 1,
    createdAt: NOW,
  },
];

const meta = {
  title: "Components/ImportRulesList",
  component: ImportRulesList,
  args: {
    query: "",
  },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/import-rules", () => HttpResponse.json(sampleRules)),
        ...apiHandlers,
      ],
    },
  },
} satisfies Meta<typeof ImportRulesList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/import-rules", () => HttpResponse.json([])),
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
