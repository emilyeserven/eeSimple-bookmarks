import type { Meta, StoryObj } from "@storybook/react-vite";

import { IsbnLinksPanel } from "./IsbnLinksPanel";

const meta = {
  title: "Components/IsbnLinksPanel",
  component: IsbnLinksPanel,
  args: {
    links: [
      {
        label: "Amazon",
        url: "https://www.amazon.com/dp/0000000000",
      },
      {
        label: "Open Library",
        url: "https://openlibrary.org/isbn/9780000000000",
      },
      {
        label: "Google Books",
        url: "https://books.google.com/books?isbn=9780000000000",
      },
    ],
  },
} satisfies Meta<typeof IsbnLinksPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleLink: Story = {
  args: {
    links: [
      {
        label: "Amazon",
        url: "https://www.amazon.com/dp/0000000000",
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    links: [],
  },
};
