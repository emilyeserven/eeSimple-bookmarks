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

/**
 * The tab opens with the PRINT LENGTH rule shown in full read-only detail and its own Edit button;
 * clicking that rule's Edit reveals its auto-saving fields without affecting any other rule.
 */
export const Default: Story = {};

/** A site with no extraction rules yet — the read-only empty state, with the Add button always available. */
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
 * A site that has opted into ISBN scanning and configured source defaults, so the read-only
 * "Built-in rules" section below the editor lists the site-specific rules that actually apply
 * (ISBN, default category / media type / tags, title-suffix removal) with their live values. A site
 * with none of these configured (see the Default/Empty stories) shows no built-in section at all.
 */
export const BuiltInRulesConfigured: Story = {
  args: {
    website: {
      ...website,
      scanUrlForIsbn: true,
      category: {
        id: "cat-dev",
        name: "Development",
        slug: "development",
        icon: null,
      },
      mediaTypeId: "media-video",
      tagIds: ["tag-dev"],
      alternateNames: ["O'Reilly Media"],
    },
  },
};

/**
 * Rules targeting multi-value properties: the Two-Numbers rule fills only the "Total" number, the
 * choices rule fills the "Read" option. Both are configured, so both load read-only.
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
