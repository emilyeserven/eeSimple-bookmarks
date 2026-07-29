import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BookmarkArchiveLinkButton,
  BookmarkArchiveNowButton,
  BookmarkExternalLinkButton,
  BookmarkMoreMenu,
} from "./BookmarkCardActions";
import { apiHandlers, sampleBookmark } from "../test-utils/story-mocks";

const meta = {
  title: "Components/BookmarkCardActions",
  component: BookmarkExternalLinkButton,
  parameters: {
    msw: {
      handlers: apiHandlers,
    },
  },
} satisfies Meta<typeof BookmarkExternalLinkButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The external-link button opening the bookmark URL. */
export const ExternalLink: Story = {
  args: {
    url: "https://github.com",
  },
};

/** The archive link-out button pointing at a configured ArchiveBox instance. */
export const ArchiveLink: StoryObj = {
  render: () => (
    <BookmarkArchiveLinkButton
      baseUrl="https://archive.example.com"
      url="https://github.com"
    />
  ),
};

/** The "Archive now" button that opens the ArchiveBox add view for the URL. */
export const ArchiveNow: StoryObj = {
  render: () => (
    <BookmarkArchiveNowButton
      baseUrl="https://archive.example.com"
      url="https://github.com"
    />
  ),
};

/** The card's More dropdown menu for a sample bookmark. */
export const MoreMenu: StoryObj = {
  render: () => <BookmarkMoreMenu bookmark={sampleBookmark} />,
};
