import type { Meta, StoryObj } from "@storybook/react-vite";

import { ShortenedLinksList } from "./ShortenedLinksList";

const meta = {
  title: "Components/ShortenedLinksList",
  component: ShortenedLinksList,
  args: {
    emptyText: "None configured.",
    links: [
      {
        domain: "bit.ly",
        expandTo: "example.com/article",
        keepShortened: false,
      },
      {
        domain: "t.co",
        expandTo: null,
        keepShortened: true,
      },
    ],
  },
} satisfies Meta<typeof ShortenedLinksList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    links: [],
  },
};
