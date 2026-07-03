import type { Meta, StoryObj } from "@storybook/react-vite";

import { GroupListItem } from "./GroupListItem";
import { makeGroup } from "../test-utils/factories";

const group = makeGroup({
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
  title: "Components/GroupListItem",
  component: GroupListItem,
  args: {
    group,
  },
} satisfies Meta<typeof GroupListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A group with an associated website and bookmark count. */
export const Default: Story = {};

/** No website associated and zero bookmarks (de-emphasized). */
export const NoWebsite: Story = {
  args: {
    group: {
      ...group,
      id: "pub-manning",
      name: "Manning Publications",
      slug: "manning",
      websiteId: null,
      website: null,
      bookmarkCount: 0,
    },
  },
};
