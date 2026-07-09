import type { Meta, StoryObj } from "@storybook/react-vite";

import { http, HttpResponse } from "msw";

import { WebsiteExtensionFillRulesForm } from "./WebsiteExtensionFillRulesForm";
import { makeCustomProperty, makeWebsite } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const website = makeWebsite({
  id: "site-oreilly",
  domain: "learning.oreilly.com",
  siteName: "O'Reilly Learning",
  slug: "oreilly-learning",
  bookmarkCount: 12,
  // The "PRINT LENGTH" worked example from #1239: grab the number in the node beside the
  // "PRINT LENGTH:" label and coerce it to a plain number.
  extensionFillRules: [
    {
      id: "print-length",
      label: "Print length",
      target: {
        kind: "customProperty",
        propertyId: "",
      },
      extract: {
        selector: "._statBlockTitle_1ckth_86 > *",
        filters: [
          {
            kind: "siblingText",
            match: {
              mode: "contains",
              value: "PRINT LENGTH:",
            },
          },
        ],
        transform: [
          {
            kind: "number",
          },
        ],
      },
    },
  ],
});

const meta = {
  title: "Components/WebsiteExtensionFillRulesForm",
  component: WebsiteExtensionFillRulesForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    website,
  },
} satisfies Meta<typeof WebsiteExtensionFillRulesForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The auto-saving extraction-rules editor with the PRINT LENGTH rule pre-populated. */
export const Default: Story = {};

/** A site with no extraction rules yet. */
export const Empty: Story = {
  args: {
    website: {
      ...website,
      extensionFillRules: [],
    },
  },
};

// Multi-value properties so the per-value sub-selectors (Current/Total, option) render: a
// Two-Numbers "Page progress" property and a multi-select "Status" choices property.
const multiValueProperties = [
  makeCustomProperty({
    id: "prop-progress",
    name: "Page progress",
    slug: "page-progress",
    type: "itemInItems",
  }),
  makeCustomProperty({
    id: "prop-status",
    name: "Status",
    slug: "status",
    type: "choices",
    choicesMultiple: true,
    choicesItems: [
      {
        label: "To read",
        value: "to-read",
      },
      {
        label: "Reading",
        value: "reading",
      },
      {
        label: "Read",
        value: "read",
      },
    ],
  }),
];

/**
 * Rules targeting multi-value properties: the Two-Numbers rule fills only the "Total" number, the
 * choices rule fills the "Read" option. Both are configured, so both load collapsed.
 */
export const MultiValueTargets: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/custom-properties", () => HttpResponse.json(multiValueProperties)),
        ...apiHandlers,
      ],
    },
  },
  args: {
    website: {
      ...website,
      extensionFillRules: [
        {
          id: "total-pages",
          label: "Total pages",
          target: {
            kind: "customProperty",
            propertyId: "prop-progress",
            subField: "total",
          },
          extract: {
            selector: ".pages",
            transform: [{
              kind: "number",
            }],
          },
        },
        {
          id: "mark-read",
          label: "Mark read",
          target: {
            kind: "customProperty",
            propertyId: "prop-status",
            choiceValue: "read",
          },
          extract: {
            selector: ".finished-badge",
          },
        },
      ],
    },
  },
};
