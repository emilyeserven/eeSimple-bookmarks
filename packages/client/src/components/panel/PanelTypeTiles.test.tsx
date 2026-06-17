import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PanelTypeTiles } from "./PanelTypeTiles";

const openType = vi.fn();

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => ({
    openType,
  }),
}));

describe("PanelTypeTiles", () => {
  beforeEach(() => {
    openType.mockClear();
  });

  it("renders a tile for every content type", () => {
    render(<PanelTypeTiles />);
    for (const label of ["Bookmarks", "Tags", "Categories", "Custom Properties", "Websites", "Autofill Rules"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("opens the chosen type's list when a tile is clicked", () => {
    render(<PanelTypeTiles />);
    fireEvent.click(screen.getByText("Tags"));
    expect(openType).toHaveBeenCalledWith("tag");
  });
});
