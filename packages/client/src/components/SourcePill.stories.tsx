import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourcePill } from "./SourcePill";

const meta = {
  title: "Components/SourcePill",
  component: SourcePill,
} satisfies Meta<typeof SourcePill>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Website: Story = {
  args: {
    type: "website",
    data: {
      id: "w1",
      domain: "example.com",
      siteName: "Example",
      slug: "example-com",
      imageUrl: null,
    },
  },
};

export const YouTubeChannel: Story = {
  args: {
    type: "youtube-channel",
    data: {
      id: "ch1",
      name: "Some Channel",
      slug: "some-channel",
      imageUrl: null,
    },
  },
};
