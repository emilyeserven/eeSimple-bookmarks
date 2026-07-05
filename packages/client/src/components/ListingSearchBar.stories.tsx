import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListingSearchBar } from "./ListingSearchBar";
import { useUiStore } from "../stores/uiStore";

/** Seeds the shared search query, then renders the in-page search bar. */
function Host({
  query,
}: {
  query: string;
}) {
  useUiStore.setState({
    headerSearchQuery: query,
  });
  return <ListingSearchBar />;
}

const meta = {
  title: "Components/ListingSearchBar",
  component: ListingSearchBar,
} satisfies Meta<typeof ListingSearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The empty in-page search input. */
export const Default: Story = {
  render: () => <Host query="" />,
};

/** With a query typed, showing the clear button. */
export const WithQuery: Story = {
  render: () => <Host query="typescript" />,
};
