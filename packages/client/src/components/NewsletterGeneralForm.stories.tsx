import type { Meta, StoryObj } from "@storybook/react-vite";

import { NewsletterGeneralForm } from "./NewsletterGeneralForm";
import { makeNewsletter } from "../test-utils/factories";
import { apiHandlers, sampleCategories } from "../test-utils/story-mocks";

const newsletter = makeNewsletter({
  id: "newsletter-1",
  name: "Weekly Digest",
  slug: "weekly-digest",
  bookmarkCount: 8,
  category: {
    id: sampleCategories[0].id,
    name: sampleCategories[0].name,
    slug: sampleCategories[0].slug,
    icon: sampleCategories[0].icon,
  },
});

const meta = {
  title: "Components/NewsletterGeneralForm",
  component: NewsletterGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    newsletter,
  },
} satisfies Meta<typeof NewsletterGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name plus default category / media type / tags — each field auto-saves. */
export const Default: Story = {};

/** A newsletter with no default category assigned yet. */
export const NoDefaults: Story = {
  args: {
    newsletter: {
      ...newsletter,
      category: null,
    },
  },
};
