import type { Meta, StoryObj } from "@storybook/react-vite";

import { BookmarkImageDisplayToggle } from "./BookmarkImageDisplayToggle";

const meta = {
  title: "Components/BookmarkImageDisplayToggle",
  component: BookmarkImageDisplayToggle,
  args: {
    value: "auto",
    onChange: () => {},
    hasImage: true,
    hasScreenshot: true,
  },
} satisfies Meta<typeof BookmarkImageDisplayToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Both an image and a screenshot exist, so every option is selectable. */
export const BothSources: Story = {};

/** Only an image exists — the "Screenshot" option is disabled. */
export const ImageOnly: Story = {
  args: {
    value: "image",
    hasScreenshot: false,
  },
};

/** Only a screenshot exists — the "Image" option is disabled. */
export const ScreenshotOnly: Story = {
  args: {
    value: "screenshot",
    hasImage: false,
  },
};

/** Neither source captured yet — only "Auto" is selectable. */
export const NoSources: Story = {
  args: {
    hasImage: false,
    hasScreenshot: false,
  },
};

/** The whole control disabled. */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
