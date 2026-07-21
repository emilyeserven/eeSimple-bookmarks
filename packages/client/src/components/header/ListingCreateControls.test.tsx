import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ListingCreateButton } from "./ListingCreateControls";

import { renderWithRouter } from "@/test-utils/router";

describe("ListingCreateButton", () => {
  it("renders nothing when there are no create options", async () => {
    const {
      container,
    } = await renderWithRouter(<ListingCreateButton />);
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders a single plain button labelled for the one option", async () => {
    await renderWithRouter(<ListingCreateButton addBookmark={{}} />);
    expect(screen.getByRole("button", {
      name: "Add bookmark",
    })).toBeInTheDocument();
  });

  it("uses the create label when the only option is the page's own entity create", async () => {
    await renderWithRouter(
      <ListingCreateButton
        createAction={vi.fn()}
        createLabel="New category"
      />,
    );
    expect(screen.getByRole("button", {
      name: "New category",
    })).toBeInTheDocument();
  });

  it("renders a single generic New trigger when two or more options are present", async () => {
    await renderWithRouter(
      <ListingCreateButton
        addBookmark={{}}
        createAction={vi.fn()}
        createLabel="New category"
      />,
    );
    // The multi-option control collapses into one Plus trigger labelled "New" (a dropdown), not two buttons.
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAttribute("aria-label", "New");
  });
});
