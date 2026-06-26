import type { Meta, StoryObj } from "@storybook/react-vite";

import { Folder } from "lucide-react";

import { StandardListingCard } from "./StandardListingCard";

const meta = {
  title: "Components/StandardListingCard",
  component: StandardListingCard,
  args: {
    icon: <Folder className="size-5" />,
    title: "Articles",
    subtitle: "articles",
    count: 12,
    renderPrimaryLink: (className, children) => (
      <a
        className={className}
        href="#"
      >
        {children}
      </a>
    ),
    renderEdit: () => null,
  },
} satisfies Meta<typeof StandardListingCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** A zero-count term is de-emphasized but still clickable. */
export const Empty: Story = {
  args: {
    count: 0,
  },
};

export const WithInfoButton: Story = {
  args: {
    renderInfo: () => (
      <button type="button">Info</button>
    ),
  },
};
