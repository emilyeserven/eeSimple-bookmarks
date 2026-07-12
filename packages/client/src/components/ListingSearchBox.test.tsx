import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ListingSearchBox } from "./ListingSearchBox";
import { useUiStore } from "../stores/uiStore";

vi.mock("../hooks/useAppSettings", () => ({
  useSearchBoxPinned: () => false,
  useDisplayPreferenceSettings: () => ({
    data: {},
  }),
  useUpdateDisplayPreferenceSettings: () => ({
    mutate: vi.fn(),
  }),
  useCroppedWidth: () => 16,
  useCroppedHeight: () => 9,
}));

vi.mock("../hooks/useCustomAspectRatios", () => ({
  useCustomAspectRatios: () => ({
    data: [],
  }),
}));

const PAGE = "test-listing";

function registerListingPage() {
  useUiStore.setState({
    listingPage: {
      key: PAGE,
      showsImages: false,
      hasFilters: false,
      showsCards: true,
    },
  });
}

afterEach(() => {
  useUiStore.setState({
    listingPage: null,
    bulkSelectPageKey: null,
    selectionMode: {},
  });
});

describe("ListingSearchBox", () => {
  it("renders the Multiselect toggle in the display-options box when the page supports bulk-select", () => {
    registerListingPage();
    useUiStore.setState({
      bulkSelectPageKey: PAGE,
    });
    render(<ListingSearchBox />);
    expect(screen.getByRole("button", {
      name: "Select",
    })).toBeInTheDocument();
  });

  it("omits the Multiselect toggle when the page does not support bulk-select", () => {
    registerListingPage();
    render(<ListingSearchBox />);
    expect(screen.queryByRole("button", {
      name: "Select",
    })).not.toBeInTheDocument();
    // The display controls (View toggle) still render in the box.
    expect(screen.getByText("View")).toBeInTheDocument();
  });
});
