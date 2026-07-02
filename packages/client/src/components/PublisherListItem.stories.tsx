import type { Meta, StoryObj } from "@storybook/react-vite";

import { PublisherListItem } from "./PublisherListItem";
import { makePublisher } from "../test-utils/factories";

const publisher = makePublisher({
  id: "pub-oreilly",
  name: "O'Reilly Media",
  slug: "oreilly-media",
  websiteId: "site-oreilly",
  website: {
    id: "site-oreilly",
    domain: "oreilly.com",
    siteName: "O'Reilly",
  },
  bookmarkCount: 12,
});

const meta = {
  title: "Components/PublisherListItem",
  component: PublisherListItem,
  args: {
    publisher,
  },
} satisfies Meta<typeof PublisherListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A publisher with an associated website and bookmark count. */
export const Default: Story = {};

/** No website associated and zero bookmarks (de-emphasized). */
export const NoWebsite: Story = {
  args: {
    publisher: {
      ...publisher,
      id: "pub-manning",
      name: "Manning Publications",
      slug: "manning",
      websiteId: null,
      website: null,
      bookmarkCount: 0,
    },
  },
};
