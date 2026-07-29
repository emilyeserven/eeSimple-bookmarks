import type { Meta, StoryObj } from "@storybook/react-vite";

import { SourcePill } from "./SourcePill";

const meta = {
  title: "Components/SourcePill",
  component: SourcePill,
} satisfies Meta<typeof SourcePill>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The pill for a website source. */
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

/** The pill for a YouTube channel source. */
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
