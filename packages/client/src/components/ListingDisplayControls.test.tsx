import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ListingDisplayControls } from "./ListingDisplayControls";
import { useUiStore } from "../stores/uiStore";

vi.mock("../hooks/useAppSettings", () => ({
  useCroppedWidth: () => 16,
  useCroppedHeight: () => 9,
}));

vi.mock("../hooks/useCustomAspectRatios", () => ({
  useCustomAspectRatios: () => ({
    data: [],
  }),
}));

const PAGE = "test-listing";

afterEach(() => {
  useUiStore.setState({
    bookmarkImageMode: {},
    viewMode: {},
    sectionDisplayMode: {},
  });
});

describe("ListingDisplayControls", () => {
  it("always shows the View toggle and only shows Aspect when image controls are enabled", () => {
    const {
      rerender,
    } = render(<ListingDisplayControls pageKey={PAGE} />);
    expect(screen.getByText("View")).toBeInTheDocument();
    expect(screen.queryByText("Aspect")).not.toBeInTheDocument();

    rerender(
      <ListingDisplayControls
        pageKey={PAGE}
        showImageControls
      />,
    );
    expect(screen.getByText("Aspect")).toBeInTheDocument();
  });

  it("shows 'Default' when the listing has no aspect override", () => {
    render(
      <ListingDisplayControls
        pageKey={PAGE}
        showImageControls
      />,
    );
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("reflects a stored per-listing aspect override on the Aspect selector", () => {
    useUiStore.setState({
      bookmarkImageMode: {
        [PAGE]: "square",
      },
    });
    render(
      <ListingDisplayControls
        pageKey={PAGE}
        showImageControls
      />,
    );
    expect(screen.getByText("Square (1:1)")).toBeInTheDocument();
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });

  it("only shows the Sections display toggle when section controls are enabled", () => {
    const {
      rerender,
    } = render(<ListingDisplayControls pageKey={PAGE} />);
    expect(screen.queryByText("Sections")).not.toBeInTheDocument();

    rerender(
      <ListingDisplayControls
        pageKey={PAGE}
        showSectionDisplayControls
      />,
    );
    expect(screen.getByText("Sections")).toBeInTheDocument();
    expect(screen.getByText("Only bookmarks")).toBeInTheDocument();
    expect(screen.getByText("Only sections")).toBeInTheDocument();
    expect(screen.getByText("Sections + bookmarks")).toBeInTheDocument();
  });

  it("persists the chosen section-display mode for the page", () => {
    render(
      <ListingDisplayControls
        pageKey={PAGE}
        showSectionDisplayControls
      />,
    );
    fireEvent.click(screen.getByText("Only sections"));
    expect(useUiStore.getState().sectionDisplayMode[PAGE]).toBe("sections");
  });
});
