import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PanelList } from "./PanelList";

const openItem = vi.fn();

vi.mock("./usePanelControls", () => ({
  usePanelControls: () => ({
    openItem,
  }),
}));

vi.mock("./contentTypes", () => ({
  getContentType: () => ({
    type: "bookmark",
    label: "Bookmarks",
    useList: () => ({
      items: [
        {
          id: "1",
          label: "Alpha",
          sublabel: "alpha.com",
        },
        {
          id: "2",
          label: "Beta",
          sublabel: "beta.com",
        },
      ],
      isLoading: false,
      error: null,
    }),
  }),
}));

describe("PanelList", () => {
  beforeEach(() => {
    openItem.mockClear();
  });

  it("filters rows by the search query against label and sublabel", () => {
    render(<PanelList type="bookmark" />);
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search bookmarks…"), {
      target: {
        value: "beta.com",
      },
    });
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("opens a row in view mode and its Edit button in edit mode", () => {
    render(<PanelList type="bookmark" />);

    fireEvent.click(screen.getByText("Alpha"));
    expect(openItem).toHaveBeenCalledWith("bookmark", "1", "view");

    fireEvent.click(screen.getByLabelText("Edit Alpha"));
    expect(openItem).toHaveBeenCalledWith("bookmark", "1", "edit");
  });

});
