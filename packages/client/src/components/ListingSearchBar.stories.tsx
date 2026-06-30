import type { Meta, StoryObj } from "@storybook/react-vite";

import { ListingSearchBar } from "./ListingSearchBar";
import { useUiStore } from "../stores/uiStore";

// The bar renders nothing unless a listing page has registered a header search; activate it.
useUiStore.setState({
  headerSearchActive: true,
});

const meta = {
  title: "Components/ListingSearchBar",
  component: ListingSearchBar,
} satisfies Meta<typeof ListingSearchBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The collapsed search button; clicking it expands the inline input. */
export const Default: Story = {};
