import type { Meta, StoryObj } from "@storybook/react-vite";

import { WebsiteExtensionFillRulesForm } from "./WebsiteExtensionFillRulesForm";
import { makeWebsite } from "../test-utils/factories";
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
