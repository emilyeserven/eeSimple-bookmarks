import type { Meta, StoryObj } from "@storybook/react-vite";

import { MediaTypePill } from "./MediaTypePill";

const meta = {
  title: "Components/MediaTypePill",
  component: MediaTypePill,
  args: {
    mediaType: {
      id: "mt-article",
      name: "Article",
      slug: "article",
      icon: "Newspaper",
      parentId: null,
    },
  },
} satisfies Meta<typeof MediaTypePill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoIcon: Story = {
  args: {
    mediaType: {
      id: "mt-video",
      name: "Video",
      slug: "video",
      icon: null,
      parentId: null,
    },
  },
};
