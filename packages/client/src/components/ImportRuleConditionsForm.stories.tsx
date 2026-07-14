import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImportRuleConditionsForm } from "./ImportRuleConditionsForm";
import { makeImportRule } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const rule = makeImportRule({
  id: "rule-block-social",
  name: "Block social media",
  slug: "block-social-media",
  description: "Skip noisy social links.",
  action: "block",
});

const meta = {
  title: "Components/ImportRuleConditionsForm",
  component: ImportRuleConditionsForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    rule,
  },
} satisfies Meta<typeof ImportRuleConditionsForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The auto-saving conditions editor for an import rule (URL / Website matches only). */
export const Default: Story = {};
