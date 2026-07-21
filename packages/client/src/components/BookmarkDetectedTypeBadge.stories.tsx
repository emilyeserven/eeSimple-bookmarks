import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkDetectedTypeBadge } from "./BookmarkDetectedTypeBadge";

const meta = {
  title: "Components/BookmarkDetectedTypeBadge",
  component: BookmarkDetectedTypeBadge,
  args: {
    kind: "youtube-video",
  },
} satisfies Meta<typeof BookmarkDetectedTypeBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A detected YouTube video, shown with the video icon. */
export const YouTubeVideo: Story = {};

/** A detected book (e.g. an ISBN scan). */
export const Book: Story = {
  args: {
    kind: "book",
  },
};

/** A detected social-media account/post. */
export const SocialAccount: Story = {
  args: {
    kind: "social-account",
  },
};

/** A generic web link. */
export const WebLink: Story = {
  args: {
    kind: "web-link",
  },
};

/** No specific kind detected → the badge renders nothing. */
export const NoneDetected: Story = {
  args: {
    kind: null,
  },
};
