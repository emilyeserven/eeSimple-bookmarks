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

export const ExternalLink: Story = {
  args: {
    url: "https://github.com",
  },
};

export const ArchiveLink: StoryObj = {
  render: () => (
    <BookmarkArchiveLinkButton
      baseUrl="https://archive.example.com"
      url="https://github.com"
    />
  ),
};

export const ArchiveNow: StoryObj = {
  render: () => (
    <BookmarkArchiveNowButton
      baseUrl="https://archive.example.com"
      url="https://github.com"
    />
  ),
};

export const MoreMenu: StoryObj = {
  render: () => <BookmarkMoreMenu bookmark={sampleBookmark} />,
};
