import type { Publisher } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { PublisherGeneralForm } from "./PublisherGeneralForm";
import { apiHandlers } from "../test-utils/story-mocks";

const NOW = "2026-06-01T00:00:00.000Z";

const publisher: Publisher = {
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  romanizedName: null,
  websiteId: "site-github",
  website: {
    id: "site-github",
    domain: "github.com",
    siteName: "GitHub",
  },
  createdAt: NOW,
  bookmarkCount: 12,
  socialLinks: [],
};

const meta = {
  title: "Components/PublisherGeneralForm",
  component: PublisherGeneralForm,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
  args: {
    publisher,
  },
} satisfies Meta<typeof PublisherGeneralForm>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Name, website, and social links — each field auto-saves. */
export const Default: Story = {};

/** A publisher with no website selected. */
export const NoWebsite: Story = {
  args: {
    publisher: {
      ...publisher,
      websiteId: null,
      website: null,
    },
  },
};
