import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkImageField } from "./BookmarkImageField";

const meta = {
  title: "Bookmarks/BookmarkImageField",
  component: BookmarkImageField,
  args: {
    existingImageUrl: null,
    pageUrl: "https://example.com",
    onChange: () => {},
  },
} satisfies Meta<typeof BookmarkImageField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const WithExistingImage: Story = {
  args: {
    existingImageUrl: "https://placehold.co/600x400/png",
  },
};

export const AutoFetchDefault: Story = {
  args: {
    defaultAuto: true,
  },
};

export const WithAutoGrabError: Story = {
  args: {
    existingImageUrl: null,
    autoGrabError: "no_image",
  },
};
