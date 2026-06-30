import type { SocialLink } from "@eesimple/types";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { SocialLinksField } from "./SocialLinksField";

const socialLinks: SocialLink[] = [
  {
    platform: "x",
    url: "https://x.com/example",
  },
  {
    platform: "github",
    url: "https://github.com/example",
  },
];

const meta = {
  title: "Components/SocialLinksField",
  component: SocialLinksField,
  args: {
    socialLinks: [],
    onChange: () => {},
  },
} satisfies Meta<typeof SocialLinksField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One URL input per platform, all empty. */
export const Default: Story = {};

/** A couple of platforms pre-filled with URLs. */
export const WithLinks: Story = {
  args: {
    socialLinks,
  },
};
