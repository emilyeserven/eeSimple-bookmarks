import type { Meta, StoryObj } from "@storybook/react-vite";

import { GroupGeneralForm } from "./GroupGeneralForm";
import { makeGroup } from "../test-utils/factories";
import { apiHandlers } from "../test-utils/story-mocks";

const group = makeGroup({
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  websiteId: "site-github",
  website: {
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
  },
  bookmarkCount: 12,
});

const meta = {
  title: "Components/GroupGeneralForm",
  component: GroupGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    group,
  },
} satisfies Meta<typeof GroupGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, website, and social links — each field auto-saves. */
export const Default: Story = {};

/** A group with no website selected. */
export const NoWebsite: Story = {
  args: {
    group: {
      ...group,
      websiteId: null,
      website: null,
    },
  },
};
